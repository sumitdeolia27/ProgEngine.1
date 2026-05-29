export function generateMermaid(cfg) {
  const lines = ['flowchart TD'];

  for (const node of cfg.nodes) {
    const label = escape(node.label);
    switch (node.type) {
      case 'start':
      case 'end':
        lines.push(`  ${node.id}([${label}])`);
        break;
      case 'decision':
        lines.push(`  ${node.id}{${escape(node.label)}}`);
        break;
      case 'io':
        lines.push(`  ${node.id}[/${label}/]`);
        break;
      case 'process':
      default:
        lines.push(`  ${node.id}[${label}]`);
        break;
    }
  }

  lines.push('');

  for (const edge of cfg.edges) {
    if (edge.label) {
      lines.push(`  ${edge.from} -->|${edge.label}| ${edge.to}`);
    } else {
      lines.push(`  ${edge.from} --> ${edge.to}`);
    }
  }

  return lines.join('\n');
}

function escape(text, useQuotes = true) {
  if (!text || !text.trim()) return useQuotes ? '" "' : ' ';
  let t = text.trim();
  if (useQuotes) {
    t = t.replace(/"/g, "#quot;");
    return `"${t}"`;
  }
  // For decision nodes: replace double quotes with single quotes
  t = t.replace(/"/g, "'");
  return t;
}
