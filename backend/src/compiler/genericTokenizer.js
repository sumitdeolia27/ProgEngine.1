const C_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof',
  'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void',
  'volatile', 'while', 'printf', 'scanf', 'include', 'define'
]);

const CPP_KEYWORDS = new Set([
  ...C_KEYWORDS,
  'bool', 'catch', 'class', 'const_cast', 'delete', 'dynamic_cast',
  'explicit', 'export', 'false', 'friend', 'inline', 'mutable',
  'namespace', 'new', 'operator', 'private', 'protected', 'public',
  'reinterpret_cast', 'static_cast', 'template', 'this', 'throw',
  'true', 'try', 'typeid', 'typename', 'using', 'virtual',
  'cout', 'cin', 'endl', 'string', 'iostream', 'std'
]);

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'const', 'continue', 'default', 'do', 'double',
  'else', 'enum', 'extends', 'final', 'finally', 'float', 'for',
  'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private',
  'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while',
  'System', 'Scanner', 'String', 'println', 'print', 'nextInt', 'nextLine'
]);

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield', 'print', 'input', 'int', 'str',
  'float', 'range', 'len'
]);

const KEYWORD_MAP = {
  c: C_KEYWORDS,
  cpp: CPP_KEYWORDS,
  java: JAVA_KEYWORDS,
  python: PYTHON_KEYWORDS
};

const MULTI_CHAR_OPS = new Set([
  '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=',
  '*=', '/=', '%=', '<<', '>>', '->', '::', '//'
]);

const SINGLE_CHAR_OPS = new Set([
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?', ':'
]);

const PUNCTUATION = new Set([
  '(', ')', '{', '}', '[', ']', ',', ';', '.', '#'
]);

export function tokenizeGeneric(input, language) {
  const keywords = KEYWORD_MAP[language] || new Set();
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

    // Single-line comments: // or #(python)
    if (ch === '/' && i + 1 < input.length && input[i + 1] === '/') {
      const startCol = column;
      let value = '';
      while (i < input.length && input[i] !== '\n') {
        value += input[i];
        i++;
        column++;
      }
      tokens.push({ type: 'COMMENT', value, line, column: startCol });
      continue;
    }

    // Python single-line comment
    if (language === 'python' && ch === '#') {
      const startCol = column;
      let value = '';
      while (i < input.length && input[i] !== '\n') {
        value += input[i];
        i++;
        column++;
      }
      tokens.push({ type: 'COMMENT', value, line, column: startCol });
      continue;
    }

    // Block comments: /* ... */
    if (ch === '/' && i + 1 < input.length && input[i + 1] === '*') {
      const startCol = column;
      let value = '/*';
      i += 2;
      column += 2;
      while (i < input.length) {
        if (input[i] === '*' && i + 1 < input.length && input[i + 1] === '/') {
          value += '*/';
          i += 2;
          column += 2;
          break;
        }
        if (input[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        value += input[i];
        i++;
      }
      tokens.push({ type: 'COMMENT', value, line, column: startCol });
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const startCol = column;
      let value = quote;
      i++;
      column++;
      while (i < input.length && input[i] !== quote && input[i] !== '\n') {
        if (input[i] === '\\' && i + 1 < input.length) {
          value += input[i] + input[i + 1];
          i += 2;
          column += 2;
        } else {
          value += input[i];
          i++;
          column++;
        }
      }
      if (i < input.length && input[i] === quote) {
        value += quote;
        i++;
        column++;
      }
      tokens.push({ type: 'STRING', value, line, column: startCol });
      continue;
    }

    // Numbers
    if (isDigit(ch) || (ch === '.' && i + 1 < input.length && isDigit(input[i + 1]))) {
      const startCol = column;
      let value = '';
      while (i < input.length && (isDigit(input[i]) || input[i] === '.' || input[i] === 'f' || input[i] === 'L')) {
        value += input[i];
        i++;
        column++;
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
        i++;
        column++;
      }
      if (keywords.has(value)) {
        tokens.push({ type: 'KEYWORD', value, line, column: startCol });
      } else {
        tokens.push({ type: 'IDENTIFIER', value, line, column: startCol });
      }
      continue;
    }

    // Multi-character operators
    if (i + 1 < input.length && MULTI_CHAR_OPS.has(ch + input[i + 1])) {
      const startCol = column;
      tokens.push({ type: 'OPERATOR', value: ch + input[i + 1], line, column: startCol });
      i += 2;
      column += 2;
      continue;
    }

    // Single-character operators
    if (SINGLE_CHAR_OPS.has(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, line, column });
      i++;
      column++;
      continue;
    }

    // Punctuation
    if (PUNCTUATION.has(ch)) {
      tokens.push({ type: 'PUNCTUATION', value: ch, line, column });
      i++;
      column++;
      continue;
    }

    // Skip unknown characters
    i++;
    column++;
  }

  tokens.push({ type: 'EOF', value: null, line, column });
  return tokens;
}

function isDigit(ch) { return ch >= '0' && ch <= '9'; }
function isAlpha(ch) { return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'; }
function isAlphaNumeric(ch) { return isAlpha(ch) || isDigit(ch); }
