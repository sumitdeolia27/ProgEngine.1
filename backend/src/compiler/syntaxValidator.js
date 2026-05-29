export function validate(tokens) {
  const errors = [];
  const stack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'KEYWORD') continue;

    switch (token.value) {
      case 'IF': {
        // Check that THEN exists before next NEWLINE/EOF
        let foundThen = false;
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'NEWLINE' || tokens[j].type === 'EOF') break;
          if (tokens[j].type === 'KEYWORD' && tokens[j].value === 'THEN') {
            foundThen = true;
            break;
          }
        }
        if (!foundThen) {
          errors.push({ message: 'Expected THEN after IF condition', line: token.line, column: token.column });
        }
        stack.push({ keyword: 'IF', line: token.line, column: token.column });
        break;
      }

      case 'WHILE': {
        let foundDo = false;
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'NEWLINE' || tokens[j].type === 'EOF') break;
          if (tokens[j].type === 'KEYWORD' && tokens[j].value === 'DO') {
            foundDo = true;
            break;
          }
        }
        if (!foundDo) {
          errors.push({ message: 'Expected DO after WHILE condition', line: token.line, column: token.column });
        }
        stack.push({ keyword: 'WHILE', line: token.line, column: token.column });
        break;
      }

      case 'FOR': {
        let foundTo = false;
        let foundDo = false;
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === 'NEWLINE' || tokens[j].type === 'EOF') break;
          if (tokens[j].type === 'KEYWORD' && tokens[j].value === 'TO') foundTo = true;
          if (tokens[j].type === 'KEYWORD' && tokens[j].value === 'DO') foundDo = true;
        }
        if (!foundTo) {
          errors.push({ message: 'Expected TO in FOR statement', line: token.line, column: token.column });
        }
        if (!foundDo) {
          errors.push({ message: 'Expected DO after FOR range', line: token.line, column: token.column });
        }
        stack.push({ keyword: 'FOR', line: token.line, column: token.column });
        break;
      }

      case 'ELSE': {
        if (stack.length === 0 || stack[stack.length - 1].keyword !== 'IF') {
          errors.push({ message: 'ELSE without matching IF', line: token.line, column: token.column });
        }
        break;
      }

      case 'ENDIF': {
        if (stack.length === 0 || stack[stack.length - 1].keyword !== 'IF') {
          errors.push({ message: 'ENDIF without matching IF', line: token.line, column: token.column });
        } else {
          stack.pop();
        }
        break;
      }

      case 'ENDWHILE': {
        if (stack.length === 0 || stack[stack.length - 1].keyword !== 'WHILE') {
          errors.push({ message: 'ENDWHILE without matching WHILE', line: token.line, column: token.column });
        } else {
          stack.pop();
        }
        break;
      }

      case 'ENDFOR': {
        if (stack.length === 0 || stack[stack.length - 1].keyword !== 'FOR') {
          errors.push({ message: 'ENDFOR without matching FOR', line: token.line, column: token.column });
        } else {
          stack.pop();
        }
        break;
      }
    }
  }

  // Report any unmatched opening blocks
  for (const item of stack) {
    const end = item.keyword === 'IF' ? 'ENDIF' : item.keyword === 'WHILE' ? 'ENDWHILE' : 'ENDFOR';
    errors.push({ message: `Missing ${end} for ${item.keyword}`, line: item.line, column: item.column });
  }

  return { valid: errors.length === 0, errors };
}
