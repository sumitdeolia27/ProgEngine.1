export function buildAST(tokens) {
  // Filter out NEWLINEs for easier parsing; keep track of line info from tokens
  const filtered = tokens.filter(t => t.type !== 'NEWLINE');
  let pos = 0;

  function peek() { return filtered[pos]; }
  function advance() { return filtered[pos++]; }

  function expect(type, value) {
    const token = peek();
    if (!token || token.type !== type || (value !== undefined && token.value !== value)) {
      const found = token ? `'${token.value}'` : 'end of input';
      const expected = value ? `'${value}'` : type;
      throw {
        message: `Expected ${expected} but found ${found}`,
        line: token ? token.line : 0,
        column: token ? token.column : 0
      };
    }
    return advance();
  }

  function parseProgram() {
    const body = [];
    while (peek() && peek().type !== 'EOF') {
      body.push(parseStatement());
    }
    return { type: 'Program', body };
  }

  function parseStatement() {
    const token = peek();
    if (!token || token.type === 'EOF') {
      throw { message: 'Unexpected end of input', line: 0, column: 0 };
    }

    if (token.type === 'KEYWORD') {
      switch (token.value) {
        case 'SET': return parseAssignment();
        case 'IF': return parseIfStatement();
        case 'WHILE': return parseWhileStatement();
        case 'FOR': return parseForStatement();
        case 'INPUT':
        case 'READ': return parseInputStatement();
        case 'OUTPUT':
        case 'PRINT': return parseOutputStatement();
        default:
          throw { message: `Unexpected keyword '${token.value}'`, line: token.line, column: token.column };
      }
    }

    if (token.type === 'IDENTIFIER') {
      return parseAssignment();
    }

    throw { message: `Unexpected token '${token.value}'`, line: token.line, column: token.column };
  }

  function parseAssignment() {
    const line = peek().line;
    // Optional SET keyword
    if (peek().type === 'KEYWORD' && peek().value === 'SET') {
      advance();
    }
    const variable = expect('IDENTIFIER').value;
    expect('OPERATOR', '=');
    const value = parseExpression();
    return { type: 'Assignment', variable, value, line };
  }

  function parseIfStatement() {
    const line = peek().line;
    advance(); // consume IF
    const condition = parseExpression();
    expect('KEYWORD', 'THEN');

    const thenBlock = [];
    while (peek() && !(peek().type === 'KEYWORD' && (peek().value === 'ELSE' || peek().value === 'ENDIF'))) {
      thenBlock.push(parseStatement());
    }

    let elseBlock = null;
    if (peek() && peek().type === 'KEYWORD' && peek().value === 'ELSE') {
      advance(); // consume ELSE
      elseBlock = [];
      while (peek() && !(peek().type === 'KEYWORD' && peek().value === 'ENDIF')) {
        elseBlock.push(parseStatement());
      }
    }

    expect('KEYWORD', 'ENDIF');
    return { type: 'IfStatement', condition, thenBlock, elseBlock, line };
  }

  function parseWhileStatement() {
    const line = peek().line;
    advance(); // consume WHILE
    const condition = parseExpression();
    expect('KEYWORD', 'DO');

    const body = [];
    while (peek() && !(peek().type === 'KEYWORD' && peek().value === 'ENDWHILE')) {
      body.push(parseStatement());
    }

    expect('KEYWORD', 'ENDWHILE');
    return { type: 'WhileStatement', condition, body, line };
  }

  function parseForStatement() {
    const line = peek().line;
    advance(); // consume FOR
    const variable = expect('IDENTIFIER').value;
    expect('OPERATOR', '=');
    const start = parseExpression();
    expect('KEYWORD', 'TO');
    const end = parseExpression();
    expect('KEYWORD', 'DO');

    const body = [];
    while (peek() && !(peek().type === 'KEYWORD' && peek().value === 'ENDFOR')) {
      body.push(parseStatement());
    }

    expect('KEYWORD', 'ENDFOR');
    return { type: 'ForStatement', variable, start, end, body, line };
  }

  function parseInputStatement() {
    const keyword = advance(); // consume INPUT/READ
    const variable = expect('IDENTIFIER').value;
    return { type: 'InputStatement', variable, line: keyword.line };
  }

  function parseOutputStatement() {
    const keyword = advance(); // consume OUTPUT/PRINT
    const expression = parseExpression();
    return { type: 'OutputStatement', expression, line: keyword.line };
  }

  // Expression parsing with precedence climbing
  function parseExpression() {
    return parseOr();
  }

  function parseOr() {
    let left = parseAnd();
    while (peek() && peek().type === 'KEYWORD' && peek().value === 'OR') {
      const op = advance().value;
      const right = parseAnd();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  function parseAnd() {
    let left = parseComparison();
    while (peek() && peek().type === 'KEYWORD' && peek().value === 'AND') {
      const op = advance().value;
      const right = parseComparison();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  function parseComparison() {
    let left = parseAddSub();
    const compOps = new Set(['==', '!=', '<', '>', '<=', '>=']);
    while (peek() && peek().type === 'OPERATOR' && compOps.has(peek().value)) {
      const op = advance().value;
      const right = parseAddSub();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek() && peek().type === 'OPERATOR' && (peek().value === '+' || peek().value === '-')) {
      const op = advance().value;
      const right = parseMulDiv();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  function parseMulDiv() {
    let left = parseUnary();
    while (peek() && peek().type === 'OPERATOR' && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
      const op = advance().value;
      const right = parseUnary();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  function parseUnary() {
    if (peek() && peek().type === 'KEYWORD' && peek().value === 'NOT') {
      const op = advance().value;
      const operand = parseUnary();
      return { type: 'UnaryExpression', operator: op, operand };
    }
    if (peek() && peek().type === 'OPERATOR' && peek().value === '-') {
      advance();
      const operand = parseUnary();
      return { type: 'UnaryExpression', operator: '-', operand };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw { message: 'Unexpected end of expression', line: 0, column: 0 };

    // Parenthesized expression
    if (token.type === 'PUNCTUATION' && token.value === '(') {
      advance();
      const expr = parseExpression();
      expect('PUNCTUATION', ')');
      return expr;
    }

    // Number literal
    if (token.type === 'NUMBER') {
      advance();
      return { type: 'Literal', value: parseFloat(token.value), line: token.line };
    }

    // String literal
    if (token.type === 'STRING') {
      advance();
      return { type: 'Literal', value: token.value, line: token.line };
    }

    // Identifier
    if (token.type === 'IDENTIFIER') {
      advance();
      return { type: 'Identifier', name: token.value, line: token.line };
    }

    throw { message: `Unexpected token '${token.value}' in expression`, line: token.line, column: token.column };
  }

  return parseProgram();
}
