export function generateExplanation(ast, language = 'pseudocode') {
  const lines = [];
  const langLabel = {
    pseudocode: 'pseudocode',
    c: 'C',
    cpp: 'C++',
    python: 'Python',
    java: 'Java'
  }[language] || language;

  lines.push(`This ${langLabel} program does the following:\n`);

  let stepNum = 1;

  function explainNode(node, indent = 0) {
    const pad = '  '.repeat(indent);
    const step = () => `${pad}${stepNum++}.`;

    switch (node.type) {
      case 'Program':
        if (node.body) {
          node.body.forEach(child => explainNode(child, indent));
        }
        break;

      case 'Assignment': {
        const varName = exprToString(node.left || node.variable);
        const value = exprToString(node.right || node.value);
        lines.push(`${step()} Set variable "${varName}" to ${value}.`);
        break;
      }

      case 'InputStatement': {
        const varName = node.variable?.name || node.variable || exprToString(node.expression);
        lines.push(`${step()} Read input from the user and store it in "${varName}".`);
        break;
      }

      case 'OutputStatement': {
        const value = exprToString(node.value || node.expression);
        lines.push(`${step()} Display the value of ${value} to the user.`);
        break;
      }

      case 'IfStatement': {
        const cond = exprToString(node.condition);
        lines.push(`${step()} Check if ${cond}:`);

        lines.push(`${pad}   If TRUE:`);
        const thenBody = node.consequent?.body || node.consequent;
        if (Array.isArray(thenBody)) {
          thenBody.forEach(child => explainNode(child, indent + 2));
        } else if (thenBody) {
          explainNode(thenBody, indent + 2);
        }

        const altBody = node.alternate?.body || node.alternate;
        if (altBody) {
          lines.push(`${pad}   If FALSE:`);
          if (Array.isArray(altBody)) {
            altBody.forEach(child => explainNode(child, indent + 2));
          } else {
            explainNode(altBody, indent + 2);
          }
        }
        break;
      }

      case 'WhileStatement': {
        const cond = exprToString(node.condition);
        lines.push(`${step()} Repeat WHILE ${cond}:`);
        const body = node.body?.body || node.body;
        if (Array.isArray(body)) {
          body.forEach(child => explainNode(child, indent + 2));
        } else if (body) {
          explainNode(body, indent + 2);
        }
        break;
      }

      case 'DoWhileStatement': {
        const cond = exprToString(node.condition);
        lines.push(`${step()} Do the following, then repeat WHILE ${cond}:`);
        const body = node.body?.body || node.body;
        if (Array.isArray(body)) {
          body.forEach(child => explainNode(child, indent + 2));
        } else if (body) {
          explainNode(body, indent + 2);
        }
        break;
      }

      case 'ForStatement': {
        const varName = node.variable?.name || node.variable || 'i';
        const from = exprToString(node.start || node.init);
        const to = exprToString(node.end || node.condition);
        lines.push(`${step()} Loop with "${varName}" from ${from} to ${to}:`);
        const body = node.body?.body || node.body;
        if (Array.isArray(body)) {
          body.forEach(child => explainNode(child, indent + 2));
        } else if (body) {
          explainNode(body, indent + 2);
        }
        break;
      }

      case 'Block': {
        if (node.body && Array.isArray(node.body)) {
          node.body.forEach(child => explainNode(child, indent));
        }
        break;
      }

      default:
        lines.push(`${step()} ${exprToString(node)}.`);
        break;
    }
  }

  function exprToString(node) {
    if (!node) return '(unknown)';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);

    switch (node.type) {
      case 'Literal':
        return typeof node.value === 'string' ? `"${node.value}"` : String(node.value);
      case 'Identifier':
        return node.name;
      case 'BinaryExpression':
        return `${exprToString(node.left)} ${node.operator} ${exprToString(node.right)}`;
      case 'UnaryExpression':
        return `${node.operator}${exprToString(node.operand || node.argument)}`;
      case 'Assignment':
        return `${exprToString(node.left || node.variable)} = ${exprToString(node.right || node.value)}`;
      default:
        if (node.name) return node.name;
        if (node.value !== undefined) return String(node.value);
        return '(expression)';
    }
  }

  explainNode(ast);

  lines.push('\n--- End of Explanation ---');
  return lines.join('\n');
}
