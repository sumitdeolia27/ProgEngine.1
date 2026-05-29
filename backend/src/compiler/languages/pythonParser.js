// Parser for Python code
// Extracts control flow and converts to our internal AST format

export function parsePython(code) {
  const lines = code.split('\n');
  const tokens = tokenizeLines(lines);
  let pos = 0;

  function peek() { return tokens[pos] || { type: 'EOF', indent: 0, text: '', line: 0 }; }
  function advance() { return tokens[pos++]; }

  function parseProgram() {
    const body = [];
    while (peek().type !== 'EOF') {
      const stmt = parseStatement(0);
      if (stmt) body.push(stmt);
    }
    return { type: 'Program', body };
  }

  function parseStatement(minIndent) {
    const t = peek();
    if (t.type === 'EOF') return null;
    if (t.indent < minIndent) return null;

    // Skip empty lines, comments, imports, def without main content
    if (t.type === 'COMMENT' || t.type === 'EMPTY') { advance(); return null; }
    if (t.text.startsWith('import ') || t.text.startsWith('from ')) { advance(); return null; }
    if (t.text.startsWith('def ')) return parseFunctionDef(t.indent);
    if (t.text.startsWith('class ')) { advance(); skipBlock(t.indent); return null; }

    if (t.text.startsWith('if ') || t.text === 'if:') return parseIfStatement(t.indent);
    if (t.text.startsWith('while ') || t.text === 'while:') return parseWhileStatement(t.indent);
    if (t.text.startsWith('for ') || t.text === 'for:') return parseForStatement(t.indent);
    if (t.text.startsWith('elif ') || t.text.startsWith('else')) return null; // handled by if
    if (t.text === 'pass' || t.text === 'break' || t.text === 'continue') { advance(); return null; }
    if (t.text.startsWith('return')) return parseReturnStatement();
    if (t.text.startsWith('try:') || t.text.startsWith('except') || t.text.startsWith('finally')) {
      advance(); skipBlock(t.indent); return null;
    }

    return parseExpressionLine();
  }

  function parseBlock(parentIndent) {
    const stmts = [];
    while (peek().type !== 'EOF' && peek().indent > parentIndent) {
      const s = parseStatement(parentIndent + 1);
      if (s) stmts.push(s);
    }
    return stmts;
  }

  function skipBlock(parentIndent) {
    while (peek().type !== 'EOF' && peek().indent > parentIndent) {
      advance();
    }
  }

  function parseIfStatement(baseIndent) {
    const t = advance(); // consume 'if ...'
    const condText = t.text.replace(/^if\s+/, '').replace(/:$/, '').trim();

    const thenBlock = parseBlock(baseIndent);

    let elseBlock = null;
    // Check for elif
    if (peek().indent === baseIndent && peek().text.startsWith('elif ')) {
      elseBlock = [parseElifChain(baseIndent)];
    }
    // Check for else
    else if (peek().indent === baseIndent && (peek().text === 'else:' || peek().text.startsWith('else:'))) {
      advance(); // consume else:
      elseBlock = parseBlock(baseIndent);
    }

    return {
      type: 'IfStatement',
      condition: textNode(condText),
      thenBlock,
      elseBlock,
      line: t.line
    };
  }

  function parseElifChain(baseIndent) {
    const t = advance(); // consume 'elif ...'
    const condText = t.text.replace(/^elif\s+/, '').replace(/:$/, '').trim();

    const thenBlock = parseBlock(baseIndent);

    let elseBlock = null;
    if (peek().indent === baseIndent && peek().text.startsWith('elif ')) {
      elseBlock = [parseElifChain(baseIndent)];
    } else if (peek().indent === baseIndent && (peek().text === 'else:' || peek().text.startsWith('else:'))) {
      advance();
      elseBlock = parseBlock(baseIndent);
    }

    return {
      type: 'IfStatement',
      condition: textNode(condText),
      thenBlock,
      elseBlock,
      line: t.line
    };
  }

  function parseWhileStatement(baseIndent) {
    const t = advance();
    const condText = t.text.replace(/^while\s+/, '').replace(/:$/, '').trim();
    const body = parseBlock(baseIndent);

    return {
      type: 'WhileStatement',
      condition: textNode(condText),
      body,
      line: t.line
    };
  }

  function parseForStatement(baseIndent) {
    const t = advance();
    const forText = t.text.replace(/^for\s+/, '').replace(/:$/, '').trim();
    const body = parseBlock(baseIndent);

    // Try to parse "i in range(start, end)" pattern
    const rangeMatch = forText.match(/^(\w+)\s+in\s+range\s*\(\s*(.+)\s*\)$/);
    if (rangeMatch) {
      const variable = rangeMatch[1];
      const args = rangeMatch[2].split(',').map(s => s.trim());

      let start = '0', end = args[0];
      if (args.length >= 2) { start = args[0]; end = args[1]; }

      return {
        type: 'ForStatement',
        variable,
        start: textNode(start),
        end: textNode(end),
        body,
        line: t.line
      };
    }

    // For-in loop (e.g., for item in list)
    const forInMatch = forText.match(/^(\w+)\s+in\s+(.+)$/);
    if (forInMatch) {
      return {
        type: 'WhileStatement',
        condition: textNode(`${forInMatch[1]} in ${forInMatch[2]}`),
        body,
        line: t.line
      };
    }

    // Fallback
    return {
      type: 'WhileStatement',
      condition: textNode(forText),
      body,
      line: t.line
    };
  }

  function parseFunctionDef(baseIndent) {
    advance(); // skip 'def ...'
    const body = parseBlock(baseIndent);
    return { type: 'Block', body, line: peek().line };
  }

  function parseReturnStatement() {
    const t = advance();
    const expr = t.text.replace(/^return\s*/, '').trim();
    if (!expr) return null;
    return { type: 'OutputStatement', expression: textNode('return ' + expr), line: t.line };
  }

  function parseExpressionLine() {
    const t = advance();
    const text = t.text.trim();
    if (!text) return null;

    return classifyPythonStatement(text, t.line);
  }

  const ast = parseProgram();
  return flattenAST(ast);
}

function classifyPythonStatement(text, line) {
  // print()
  if (/^print\s*\(/.test(text)) {
    const content = text.replace(/^print\s*\(\s*/, '').replace(/\)\s*$/, '');
    return { type: 'OutputStatement', expression: textNode(content), line };
  }

  // input()
  if (/=\s*input\s*\(/.test(text)) {
    const varMatch = text.match(/^(\w+)\s*=/);
    return { type: 'InputStatement', variable: varMatch ? varMatch[1] : 'var', line };
  }
  if (/^input\s*\(/.test(text)) {
    return { type: 'InputStatement', variable: 'input', line };
  }

  // int(input()), float(input()) etc.
  if (/=\s*(?:int|float|str)\s*\(\s*input\s*\(/.test(text)) {
    const varMatch = text.match(/^(\w+)\s*=/);
    return { type: 'InputStatement', variable: varMatch ? varMatch[1] : 'var', line };
  }

  // Augmented assignment: x += 5, x -= 3, etc.
  const augMatch = text.match(/^(\w+)\s*([+\-*/%])=\s*(.+)$/);
  if (augMatch) {
    return {
      type: 'Assignment',
      variable: augMatch[1],
      value: textNode(`${augMatch[1]} ${augMatch[2]} ${augMatch[3]}`),
      line
    };
  }

  // Simple assignment: x = expr
  const assignMatch = text.match(/^(\w+)\s*=\s*(.+)$/);
  if (assignMatch) {
    return { type: 'Assignment', variable: assignMatch[1], value: textNode(assignMatch[2].trim()), line };
  }

  // Function call
  if (/^\w+\s*\(/.test(text)) {
    return { type: 'OutputStatement', expression: textNode(text), line };
  }

  // Anything else
  if (text.length > 0) {
    return { type: 'Assignment', variable: '_', value: textNode(text), line };
  }

  return null;
}

function textNode(text) {
  return { type: 'Identifier', name: String(text), line: 0 };
}

function flattenAST(node) {
  if (!node) return { type: 'Program', body: [] };
  if (node.type === 'Program') {
    return { type: 'Program', body: node.body.flatMap(flattenNode) };
  }
  return node;
}

function flattenNode(node) {
  if (!node) return [];
  if (node.type === 'Block') {
    return node.body.flatMap(flattenNode);
  }
  if (node.type === 'IfStatement') {
    return [{
      ...node,
      thenBlock: node.thenBlock.flatMap(flattenNode),
      elseBlock: node.elseBlock ? node.elseBlock.flatMap(flattenNode) : null
    }];
  }
  if (node.type === 'WhileStatement') {
    return [{ ...node, body: node.body.flatMap(flattenNode) }];
  }
  return [node];
}

// Tokenize Python into logical lines with indent levels
function tokenizeLines(lines) {
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();

    if (trimmed === '' || trimmed.match(/^\s*$/)) continue;

    // Calculate indent level (count leading spaces, 1 tab = 4 spaces)
    let indent = 0;
    for (let j = 0; j < raw.length; j++) {
      if (raw[j] === ' ') indent++;
      else if (raw[j] === '\t') indent += 4;
      else break;
    }
    // Normalize indent to levels (roughly 4 spaces per level)
    const indentLevel = Math.floor(indent / 2); // use 2 for flexibility

    const text = trimmed.trim();

    // Skip empty and pure comment lines
    if (text.startsWith('#')) {
      tokens.push({ type: 'COMMENT', indent: indentLevel, text, line: i + 1 });
      continue;
    }

    tokens.push({ type: 'LINE', indent: indentLevel, text, line: i + 1 });
  }

  tokens.push({ type: 'EOF', indent: 0, text: '', line: lines.length });
  return tokens;
}
