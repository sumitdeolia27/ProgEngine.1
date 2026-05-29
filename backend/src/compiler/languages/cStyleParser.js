// Parser for C, C++, and Java
// Extracts control flow and converts to our internal AST format

export function parseCStyle(code, language) {
  const tokens = tokenize(code, language);
  let pos = 0;

  function peek() { return tokens[pos] || { type: 'EOF', value: '', line: 0, col: 0 }; }
  function advance() { return tokens[pos++]; }
  function match(type, value) {
    const t = peek();
    if (t.type === type && (value === undefined || t.value === value)) {
      return advance();
    }
    return null;
  }
  function expect(type, value) {
    const t = match(type, value);
    if (!t) {
      const got = peek();
      throw { message: `Expected ${value || type} but found '${got.value}'`, line: got.line, column: got.col };
    }
    return t;
  }
  function skipSemicolons() {
    while (peek().value === ';') advance();
  }

  // Type keywords that indicate a type/modifier prefix
  const TYPE_KEYWORDS = new Set([
    'void', 'int', 'float', 'double', 'char', 'long', 'short',
    'unsigned', 'signed', 'string', 'String', 'bool', 'boolean',
    'auto', 'const', 'static', 'final', 'abstract', 'var'
  ]);

  const ACCESS_MODIFIERS = new Set(['public', 'private', 'protected']);

  function parseProgram() {
    const body = [];
    while (peek().type !== 'EOF') {
      skipSemicolons();
      if (peek().type === 'EOF') break;
      const stmt = parseTopLevel();
      if (stmt) {
        if (Array.isArray(stmt)) body.push(...stmt);
        else body.push(stmt);
      }
    }
    return { type: 'Program', body: body.filter(Boolean) };
  }

  function parseTopLevel() {
    const t = peek();

    // Skip preprocessor directives
    if (t.type === 'PREPROCESSOR') { advance(); return null; }

    // Skip 'using namespace ...;' and 'import ...;'
    if (t.value === 'using' || (t.value === 'import' && language === 'java') || t.value === 'package') {
      skipToSemicolon();
      return null;
    }

    // Skip access modifiers
    if (ACCESS_MODIFIERS.has(t.value)) {
      advance();
      if (peek().value === ':') advance();
    }

    // class/struct (check again after skipping modifiers)
    if (peek().value === 'class' || peek().value === 'struct' || t.value === 'class' || t.value === 'struct') {
      return parseClassDecl();
    }

    // Check if this is a function declaration/definition
    if (isFunctionDeclAhead()) {
      return parseFunctionDef();
    }

    return parseStatement();
  }

  function parseStatement() {
    skipSemicolons();
    const t = peek();
    if (t.type === 'EOF') return null;

    // Skip access modifiers inside class
    if (ACCESS_MODIFIERS.has(t.value)) {
      advance();
      if (peek().value === ':') advance();
      if (peek().value === 'static') advance();
      if (isFunctionDeclAhead()) return parseFunctionDef();
    }

    if (t.value === 'if') return parseIfStatement();
    if (t.value === 'while') return parseWhileStatement();
    if (t.value === 'for') return parseForStatement();
    if (t.value === 'do') return parseDoWhileStatement();
    if (t.value === 'switch') return parseSwitchStatement();
    if (t.value === 'return') return parseReturnStatement();
    if (t.value === '{') {
      const stmts = parseBlock();
      return { type: 'Block', body: stmts, line: t.line };
    }

    // Expression statement
    return parseExpressionStatement();
  }

  function parseBlock() {
    const stmts = [];
    expect('PUNCT', '{');
    while (peek().value !== '}' && peek().type !== 'EOF') {
      skipSemicolons();
      if (peek().value === '}') break;
      const s = parseStatement();
      if (s) stmts.push(s);
    }
    expect('PUNCT', '}');
    return stmts;
  }

  function parseBlockOrSingle() {
    if (peek().value === '{') return parseBlock();
    const s = parseStatement();
    return s ? [s] : [];
  }

  function parseIfStatement() {
    const line = advance().line; // skip 'if'
    expect('PUNCT', '(');
    const condText = collectBalanced('(', ')');
    expect('PUNCT', ')');

    const thenBlock = parseBlockOrSingle();

    let elseBlock = null;
    if (peek().value === 'else') {
      advance();
      if (peek().value === 'if') {
        elseBlock = [parseIfStatement()];
      } else {
        elseBlock = parseBlockOrSingle();
      }
    }

    return { type: 'IfStatement', condition: idNode(condText), thenBlock, elseBlock, line };
  }

  function parseWhileStatement() {
    const line = advance().line;
    expect('PUNCT', '(');
    const condText = collectBalanced('(', ')');
    expect('PUNCT', ')');
    const body = parseBlockOrSingle();
    return { type: 'WhileStatement', condition: idNode(condText), body, line };
  }

  function parseDoWhileStatement() {
    const line = advance().line;
    const body = parseBlockOrSingle();
    if (peek().value === 'while') advance();
    if (peek().value === '(') {
      advance();
      const condText = collectBalanced('(', ')');
      if (peek().value === ')') advance();
      if (peek().value === ';') advance();
      return { type: 'DoWhileStatement', condition: idNode(condText), body, line };
    }
    return { type: 'Block', body, line };
  }

  function parseForStatement() {
    const line = advance().line;
    expect('PUNCT', '(');

    // Collect three parts: init; cond; update
    let init = '', cond = '', update = '';
    let part = 0, depth = 0;
    while (peek().type !== 'EOF') {
      if (peek().value === '(') depth++;
      if (peek().value === ')') { if (depth === 0) break; depth--; }
      if (peek().value === ';' && depth === 0) { part++; advance(); continue; }
      const val = advance().value;
      if (part === 0) init += val + ' ';
      else if (part === 1) cond += val + ' ';
      else update += val + ' ';
    }
    expect('PUNCT', ')');
    const body = parseBlockOrSingle();

    init = init.trim();
    cond = cond.trim();
    update = update.trim();

    // Build: init assignment + while loop with body + update
    const result = [];

    if (init) {
      const initNode = classifyStatement(init, line, language);
      if (initNode) result.push(initNode);
    }

    const loopBody = [...body];
    if (update) {
      const updateNode = classifyStatement(update, line, language);
      if (updateNode) loopBody.push(updateNode);
    }

    result.push({
      type: 'WhileStatement',
      condition: idNode(cond || 'true'),
      body: loopBody,
      line
    });

    return { type: 'Block', body: result, line };
  }

  function parseSwitchStatement() {
    const line = advance().line;
    expect('PUNCT', '(');
    const switchExpr = collectBalanced('(', ')');
    expect('PUNCT', ')');
    expect('PUNCT', '{');

    const cases = [];
    let defaultBody = null;

    while (peek().value !== '}' && peek().type !== 'EOF') {
      skipSemicolons();
      if (peek().value === 'case') {
        advance();
        let caseVal = '';
        while (peek().value !== ':' && peek().type !== 'EOF') { caseVal += advance().value + ' '; }
        if (peek().value === ':') advance();
        const body = parseCaseBody();
        cases.push({ value: caseVal.trim(), body });
      } else if (peek().value === 'default') {
        advance();
        if (peek().value === ':') advance();
        defaultBody = parseCaseBody();
      } else {
        advance();
      }
    }
    if (peek().value === '}') advance();

    // Convert to if-else chain
    if (cases.length === 0) return null;
    return buildSwitchIfChain(cases, defaultBody, switchExpr, line);
  }

  function parseCaseBody() {
    const stmts = [];
    while (peek().type !== 'EOF' && peek().value !== 'case' && peek().value !== 'default' && peek().value !== '}') {
      if (peek().value === 'break') { advance(); if (peek().value === ';') advance(); continue; }
      skipSemicolons();
      if (peek().value === 'case' || peek().value === 'default' || peek().value === '}') break;
      const s = parseStatement();
      if (s) stmts.push(s);
    }
    return stmts;
  }

  function buildSwitchIfChain(cases, defaultBody, switchExpr, line) {
    function build(idx) {
      if (idx >= cases.length) {
        if (defaultBody && defaultBody.length > 0) return { type: 'Block', body: defaultBody, line };
        return null;
      }
      const c = cases[idx];
      const next = build(idx + 1);
      return {
        type: 'IfStatement',
        condition: idNode(`${switchExpr} == ${c.value}`),
        thenBlock: c.body.length > 0 ? c.body : [],
        elseBlock: next ? [next] : (defaultBody && defaultBody.length > 0 && idx === cases.length - 1 ? defaultBody : null),
        line
      };
    }
    return build(0);
  }

  function parseReturnStatement() {
    const line = advance().line;
    let expr = '';
    while (peek().value !== ';' && peek().type !== 'EOF' && peek().value !== '}') {
      expr += advance().value + ' ';
    }
    if (peek().value === ';') advance();
    expr = expr.trim();
    if (!expr) return null;
    return { type: 'OutputStatement', expression: idNode('return ' + expr), line };
  }

  function parseExpressionStatement() {
    const line = peek().line;
    let text = '';
    let depth = 0;

    while (peek().type !== 'EOF') {
      if (peek().value === '{' || peek().value === '(') depth++;
      if (peek().value === '}') { if (depth > 0) depth--; else break; }
      if (peek().value === ')') depth--;
      if (peek().value === ';' && depth === 0) { advance(); break; }
      text += advance().value + ' ';
    }

    text = text.trim();
    if (!text) return null;
    return classifyStatement(text, line, language);
  }

  function parseFunctionDef() {
    const line = peek().line;
    // Skip everything until '(' - that gives us the function name
    while (peek().value !== '(' && peek().type !== 'EOF') advance();
    if (peek().value === '(') {
      advance();
      // Skip params
      let d = 1;
      while (d > 0 && peek().type !== 'EOF') {
        if (peek().value === '(') d++;
        if (peek().value === ')') d--;
        advance();
      }
    }
    // Skip throws clause
    while (peek().value !== '{' && peek().value !== ';' && peek().type !== 'EOF') advance();

    if (peek().value === '{') {
      const stmts = parseBlock();
      return { type: 'Block', body: stmts, line };
    }
    if (peek().value === ';') advance();
    return null;
  }

  function parseClassDecl() {
    advance(); // skip class/struct
    // Skip name, extends, implements
    while (peek().value !== '{' && peek().type !== 'EOF') advance();
    if (peek().value === '{') {
      const stmts = parseBlock();
      return { type: 'Block', body: stmts, line: peek().line };
    }
    return null;
  }

  // Look ahead to detect function declarations: [modifiers] [type] name '('
  function isFunctionDeclAhead() {
    let i = pos;
    let seenType = false;
    let seenName = false;

    // Skip type keywords and modifiers
    while (i < tokens.length && (TYPE_KEYWORDS.has(tokens[i]?.value) || ACCESS_MODIFIERS.has(tokens[i]?.value))) {
      seenType = true;
      i++;
    }

    // After types, we might have a custom type name (identifier)
    if (i < tokens.length && tokens[i]?.type === 'IDENT') {
      // This could be the function name or a custom return type
      const nextIdx = i + 1;

      // Skip generic/template params
      let j = nextIdx;
      if (j < tokens.length && tokens[j]?.value === '<') {
        let d = 1; j++;
        while (j < tokens.length && d > 0) {
          if (tokens[j].value === '<') d++;
          if (tokens[j].value === '>') d--;
          j++;
        }
      }

      // If next is '(', this IDENT is the function name
      if (j < tokens.length && tokens[j]?.value === '(') return true;
      // If next after generics is '[' then ']' then IDENT then '(', also function (array return type)

      // If next is IDENT then '(', first IDENT was return type
      if (j < tokens.length && tokens[j]?.type === 'IDENT') {
        const k = j + 1;
        if (k < tokens.length && tokens[k]?.value === '(') return true;
        // Array: IDENT [] IDENT (
        if (k < tokens.length && tokens[k]?.value === '[') {
          if (k + 1 < tokens.length && tokens[k + 1]?.value === ']') {
            if (k + 2 < tokens.length && tokens[k + 2]?.type === 'IDENT') {
              if (k + 3 < tokens.length && tokens[k + 3]?.value === '(') return true;
            }
          }
        }
      }
    }

    // If we consumed types and next is directly '(' - like `main()`
    if (seenType && i < tokens.length && tokens[i]?.value === '(') return true;

    return false;
  }

  function collectBalanced(open, close) {
    let text = '';
    let depth = 0;
    while (peek().type !== 'EOF') {
      if (peek().value === open) depth++;
      if (peek().value === close) { if (depth === 0) break; depth--; }
      text += advance().value + ' ';
    }
    return text.trim();
  }

  function skipToSemicolon() {
    while (peek().value !== ';' && peek().type !== 'EOF') advance();
    if (peek().value === ';') advance();
  }

  // Flatten Block nodes
  function flattenAST(node) {
    if (!node) return { type: 'Program', body: [] };
    if (node.type === 'Program') {
      return { type: 'Program', body: node.body.flatMap(flattenNode).filter(Boolean) };
    }
    return node;
  }

  function flattenNode(node) {
    if (!node) return [];
    if (node.type === 'Block') return node.body.flatMap(flattenNode);
    if (node.type === 'IfStatement') {
      return [{
        ...node,
        thenBlock: (node.thenBlock || []).flatMap(flattenNode),
        elseBlock: node.elseBlock ? node.elseBlock.flatMap(flattenNode) : null
      }];
    }
    if (node.type === 'WhileStatement' || node.type === 'DoWhileStatement') {
      return [{ ...node, body: (node.body || []).flatMap(flattenNode) }];
    }
    return [node];
  }

  const ast = parseProgram();
  return flattenAST(ast);
}

// Classify a C-style statement text into our AST node
function classifyStatement(text, line, language) {
  if (!text || text.trim() === '') return null;

  // C printf
  if (/^printf\s*\(/.test(text)) {
    const content = extractFuncArgs(text, 'printf');
    return { type: 'OutputStatement', expression: idNode(cleanPrintfArgs(content)), line };
  }
  // C scanf
  if (/^scanf\s*\(/.test(text)) {
    const varMatch = text.match(/&\s*(\w+)/);
    return { type: 'InputStatement', variable: varMatch ? varMatch[1] : 'var', line };
  }
  // C++ cout
  if (/^(std\s*::\s*)?cout\s*<</.test(text)) {
    const content = text.replace(/^(std\s*::\s*)?cout\s*<<\s*/, '')
      .replace(/\s*<<\s*(std\s*::\s*)?endl\s*$/, '')
      .replace(/\s*;\s*$/, '');
    return { type: 'OutputStatement', expression: idNode(content.replace(/\s*<<\s*/g, ' + ')), line };
  }
  // C++ cin
  if (/^(std\s*::\s*)?cin\s*>>/.test(text)) {
    const varMatch = text.match(/>>\s*(\w+)/);
    return { type: 'InputStatement', variable: varMatch ? varMatch[1] : 'var', line };
  }
  // Java System.out
  if (/^System\s*\.\s*out\s*\.\s*print(ln)?\s*\(/.test(text)) {
    const content = text.replace(/^System\s*\.\s*out\s*\.\s*print(ln)?\s*\(\s*/, '').replace(/\)\s*$/, '');
    return { type: 'OutputStatement', expression: idNode(content), line };
  }
  // Java Scanner input: int a = sc.nextInt() or a = sc.next()
  if (/next(Int|Double|Float|Line|Long|Short|Byte|Boolean)?\s*\(/.test(text)) {
    const varMatch = text.match(/(?:int|float|double|long|String|char|boolean|var|auto)?\s*(\w+)\s*=/);
    if (varMatch) return { type: 'InputStatement', variable: varMatch[1], line };
  }
  // Java Scanner declaration - skip
  if (/Scanner/.test(text) && /new/.test(text)) return null;

  // Increment/decrement: i++, i--, ++i, --i
  const incPost = text.match(/^(\w+)\s*(\+\+|--)$/);
  if (incPost) {
    const op = incPost[2] === '++' ? '+' : '-';
    return { type: 'Assignment', variable: incPost[1], value: idNode(`${incPost[1]} ${op} 1`), line };
  }
  const incPre = text.match(/^(\+\+|--)\s*(\w+)$/);
  if (incPre) {
    const op = incPre[1] === '++' ? '+' : '-';
    return { type: 'Assignment', variable: incPre[2], value: idNode(`${incPre[2]} ${op} 1`), line };
  }

  // Variable declaration with assignment: int x = 5
  const declAssign = text.match(/^(?:int|float|double|char|long|short|unsigned|bool|boolean|string|String|auto|var|const)\s+(\w+)\s*=\s*(.+)$/);
  if (declAssign) {
    return { type: 'Assignment', variable: declAssign[1], value: idNode(declAssign[2].trim()), line };
  }

  // Variable declaration without assignment: int x
  const declOnly = text.match(/^(?:int|float|double|char|long|short|unsigned|bool|boolean|string|String|auto|var)\s+(\w+)\s*$/);
  if (declOnly) {
    return { type: 'Assignment', variable: declOnly[1], value: idNode('0'), line };
  }

  // Augmented assignment: x += 5
  const augAssign = text.match(/^(\w+)\s*([+\-*/%])=\s*(.+)$/);
  if (augAssign) {
    return { type: 'Assignment', variable: augAssign[1], value: idNode(`${augAssign[1]} ${augAssign[2]} ${augAssign[3].trim()}`), line };
  }

  // Simple assignment: x = expr
  const simpleAssign = text.match(/^(\w+)\s*=\s*(.+)$/);
  if (simpleAssign && simpleAssign[1] !== 'if' && simpleAssign[1] !== 'while') {
    return { type: 'Assignment', variable: simpleAssign[1], value: idNode(simpleAssign[2].trim()), line };
  }

  // Function call
  if (/^\w+\s*\(/.test(text)) {
    return { type: 'OutputStatement', expression: idNode(text), line };
  }

  // Anything else meaningful
  if (text.length > 0 && text !== ';') {
    return { type: 'Assignment', variable: '_', value: idNode(text), line };
  }

  return null;
}

function idNode(text) {
  return { type: 'Identifier', name: String(text), line: 0 };
}

function extractFuncArgs(text, funcName) {
  const start = text.indexOf('(');
  if (start === -1) return text;
  let depth = 0;
  let end = start;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '(') depth++;
    if (text[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
  }
  return text.substring(start + 1, end).trim();
}

function cleanPrintfArgs(content) {
  const parts = splitArgs(content);
  if (parts.length > 1 && parts[0].trim().startsWith('"')) {
    let fmt = parts[0].trim().replace(/^"|"$/g, '');
    const args = parts.slice(1).map(s => s.trim());
    let argIdx = 0;
    fmt = fmt.replace(/%[difs%lLu]/g, (m) => {
      if (m === '%%') return '%';
      return args[argIdx++] || '?';
    });
    return fmt;
  }
  return content.replace(/^"|"$/g, '');
}

function splitArgs(text) {
  const result = [];
  let current = '';
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"' && text[i - 1] !== '\\') inStr = !inStr;
    if (!inStr) {
      if (text[i] === '(') depth++;
      if (text[i] === ')') depth--;
      if (text[i] === ',' && depth === 0) { result.push(current); current = ''; continue; }
    }
    current += text[i];
  }
  if (current) result.push(current);
  return result;
}

// Tokenizer for C-style languages
function tokenize(code, language) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const keywords = new Set([
    'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break',
    'return', 'class', 'struct', 'void', 'int', 'float', 'double', 'char',
    'long', 'short', 'unsigned', 'signed', 'bool', 'boolean', 'string', 'String',
    'auto', 'const', 'static', 'public', 'private', 'protected', 'using',
    'namespace', 'import', 'package', 'final', 'abstract', 'throws', 'new', 'var',
    'continue'
  ]);

  while (i < code.length) {
    const ch = code[i];
    if (ch === '\n') { line++; col = 1; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === ' ' || ch === '\t') { col++; i++; continue; }

    // Preprocessor
    if (ch === '#') {
      let text = '';
      while (i < code.length && code[i] !== '\n') { text += code[i]; i++; col++; }
      tokens.push({ type: 'PREPROCESSOR', value: text.trim(), line, col });
      continue;
    }

    // Single-line comments
    if (ch === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') { i++; col++; }
      continue;
    }

    // Multi-line comments
    if (ch === '/' && code[i + 1] === '*') {
      i += 2; col += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') { line++; col = 1; } else col++;
        i++;
      }
      if (i < code.length) { i += 2; col += 2; }
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = quote;
      i++; col++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') { str += code[i]; i++; col++; }
        if (i < code.length) { str += code[i]; i++; col++; }
      }
      if (i < code.length) { str += quote; i++; col++; }
      tokens.push({ type: 'STRING', value: str, line, col });
      continue;
    }

    // Numbers
    if (ch >= '0' && ch <= '9') {
      let num = '';
      while (i < code.length && ((code[i] >= '0' && code[i] <= '9') || code[i] === '.' || code[i] === 'f' || code[i] === 'L')) {
        num += code[i]; i++; col++;
      }
      tokens.push({ type: 'NUMBER', value: num, line, col });
      continue;
    }

    // Identifiers and keywords
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let word = '';
      const startCol = col;
      while (i < code.length && ((code[i] >= 'a' && code[i] <= 'z') || (code[i] >= 'A' && code[i] <= 'Z') ||
        (code[i] >= '0' && code[i] <= '9') || code[i] === '_')) {
        word += code[i]; i++; col++;
      }
      tokens.push({ type: keywords.has(word) ? 'KEYWORD' : 'IDENT', value: word, line, col: startCol });
      continue;
    }

    // Multi-char operators
    const two = code.substring(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '<<', '>>', '::', '->'].includes(two)) {
      tokens.push({ type: 'OP', value: two, line, col });
      i += 2; col += 2;
      continue;
    }

    // Single char punctuation/operators
    if ('{}()[];,.<>+-*/%=!&|^~?:@'.includes(ch)) {
      tokens.push({ type: 'PUNCT', value: ch, line, col });
      i++; col++;
      continue;
    }

    i++; col++;
  }

  tokens.push({ type: 'EOF', value: '', line, col });
  return tokens;
}
