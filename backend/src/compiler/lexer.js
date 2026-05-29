const KEYWORDS = new Set([
  'IF', 'ELSE', 'THEN', 'ENDIF',
  'WHILE', 'DO', 'ENDWHILE',
  'FOR', 'TO', 'ENDFOR',
  'SET', 'INPUT', 'OUTPUT', 'PRINT', 'READ',
  'AND', 'OR', 'NOT'
]);

const MULTI_CHAR_OPS = new Set(['==', '!=', '<=', '>=']);
const SINGLE_CHAR_OPS = new Set(['+', '-', '*', '/', '%', '=', '<', '>']);
const PUNCTUATION = new Set(['(', ')', ',']);

export function tokenize(input) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let column = 1;

  while (i < input.length) {
    const ch = input[i];

    // Newlines
    if (ch === '\n') {
      tokens.push({ type: 'NEWLINE', value: '\\n', line, column });
      i++;
      line++;
      column = 1;
      continue;
    }

    // Skip carriage return
    if (ch === '\r') {
      i++;
      continue;
    }

    // Skip spaces and tabs
    if (ch === ' ' || ch === '\t') {
      i++;
      column++;
      continue;
    }

    // Comments
    if (ch === '/' && i + 1 < input.length && input[i + 1] === '/') {
      while (i < input.length && input[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const startCol = column;
      let value = '';
      i++; column++;
      while (i < input.length && input[i] !== quote && input[i] !== '\n') {
        value += input[i];
        i++; column++;
      }
      if (i >= input.length || input[i] === '\n') {
        throw { message: `Unterminated string literal`, line, column: startCol };
      }
      i++; column++; // skip closing quote
      tokens.push({ type: 'STRING', value, line, column: startCol });
      continue;
    }

    // Numbers
    if (isDigit(ch)) {
      const startCol = column;
      let value = '';
      while (i < input.length && (isDigit(input[i]) || input[i] === '.')) {
        value += input[i];
        i++; column++;
      }
      tokens.push({ type: 'NUMBER', value, line, column: startCol });
      continue;
    }

    // Identifiers and keywords
    if (isAlpha(ch)) {
      const startCol = column;
      let value = '';
      while (i < input.length && isAlphaNumeric(input[i])) {
        value += input[i];
        i++; column++;
      }
      const upper = value.toUpperCase();
      if (KEYWORDS.has(upper)) {
        tokens.push({ type: 'KEYWORD', value: upper, line, column: startCol });
      } else {
        tokens.push({ type: 'IDENTIFIER', value, line, column: startCol });
      }
      continue;
    }

    // Multi-character operators
    if (i + 1 < input.length && MULTI_CHAR_OPS.has(ch + input[i + 1])) {
      const startCol = column;
      tokens.push({ type: 'OPERATOR', value: ch + input[i + 1], line, column: startCol });
      i += 2; column += 2;
      continue;
    }

    // Single-character operators
    if (SINGLE_CHAR_OPS.has(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, line, column });
      i++; column++;
      continue;
    }

    // Punctuation
    if (PUNCTUATION.has(ch)) {
      tokens.push({ type: 'PUNCTUATION', value: ch, line, column });
      i++; column++;
      continue;
    }

    throw { message: `Unexpected character '${ch}'`, line, column };
  }

  tokens.push({ type: 'EOF', value: null, line, column });
  return tokens;
}

function isDigit(ch) { return ch >= '0' && ch <= '9'; }
function isAlpha(ch) { return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'; }
function isAlphaNumeric(ch) { return isAlpha(ch) || isDigit(ch); }
