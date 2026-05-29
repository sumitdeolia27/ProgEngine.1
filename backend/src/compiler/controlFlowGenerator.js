export function generateCFG(ast) {
  const nodes = [];
  const edges = [];
  let counter = 0;

  function nextId() {
    const id = counter++;
    if (id < 26) return String.fromCharCode(65 + id);
    return String.fromCharCode(65 + Math.floor(id / 26) - 1) + String.fromCharCode(65 + (id % 26));
  }

  function addNode(type, label) {
    const id = nextId();
    nodes.push({ id, type, label });
    return id;
  }

  function addEdge(from, to, label) {
    edges.push({ from, to, label: label || null });
  }

  function expressionToString(expr) {
    if (!expr) return '';
    switch (expr.type) {
      case 'Literal':
        return typeof expr.value === 'string' ? `"${expr.value}"` : String(expr.value);
      case 'Identifier':
        return expr.name;
      case 'BinaryExpression':
        return `${expressionToString(expr.left)} ${expr.operator} ${expressionToString(expr.right)}`;
      case 'UnaryExpression':
        return `${expr.operator} ${expressionToString(expr.operand)}`;
      default:
        return '?';
    }
  }

  // Process statements, return array of exit node IDs
  // (most statements have 1 exit, but we track multiples for merge points)
  function processStatements(statements, entryId) {
    let prevId = entryId;
    for (const stmt of statements) {
      prevId = processStatement(stmt, prevId);
    }
    return prevId;
  }

  function processStatement(stmt, prevId) {
    switch (stmt.type) {
      case 'Assignment': {
        const varName = stmt.variable === '_' ? '' : `${stmt.variable} = `;
        const label = varName + expressionToString(stmt.value);
        const id = addNode('process', label);
        addEdge(prevId, id);
        return id;
      }

      case 'InputStatement': {
        const id = addNode('io', `INPUT ${stmt.variable}`);
        addEdge(prevId, id);
        return id;
      }

      case 'OutputStatement': {
        const exprStr = expressionToString(stmt.expression);
        const label = exprStr.startsWith('return ') ? exprStr.toUpperCase() : `OUTPUT ${exprStr}`;
        const id = addNode('io', label);
        addEdge(prevId, id);
        return id;
      }

      case 'IfStatement': {
        const condLabel = expressionToString(stmt.condition);
        const decisionId = addNode('decision', condLabel);
        addEdge(prevId, decisionId);

        // We need a merge node for branches to converge
        const mergeId = addNode('junction', '');

        // Then branch
        if (stmt.thenBlock && stmt.thenBlock.length > 0) {
          const thenLastId = processStatements(stmt.thenBlock, decisionId);
          addEdge(thenLastId, mergeId);
          // Label the first edge from decision as "Yes"
          const firstEdge = edges.find(e => e.from === decisionId && e.label === null);
          if (firstEdge) firstEdge.label = 'Yes';
        } else {
          addEdge(decisionId, mergeId, 'Yes');
        }

        // Else branch
        if (stmt.elseBlock && stmt.elseBlock.length > 0) {
          const elseLastId = processStatements(stmt.elseBlock, decisionId);
          addEdge(elseLastId, mergeId);
          const elseEdge = edges.filter(e => e.from === decisionId && e.label === null);
          if (elseEdge.length > 0) elseEdge[0].label = 'No';
        } else {
          addEdge(decisionId, mergeId, 'No');
        }

        return mergeId;
      }

      case 'WhileStatement': {
        const condLabel = expressionToString(stmt.condition);
        const decisionId = addNode('decision', condLabel);
        addEdge(prevId, decisionId);

        if (stmt.body.length > 0) {
          const bodyLastId = processStatements(stmt.body, decisionId);
          addEdge(bodyLastId, decisionId);
          const bodyEdge = edges.find(e => e.from === decisionId && e.label === null);
          if (bodyEdge) bodyEdge.label = 'Yes';
        }

        // No exit goes directly to whatever comes next - use a junction
        const exitId = addNode('junction', '');
        addEdge(decisionId, exitId, 'No');
        return exitId;
      }

      case 'DoWhileStatement': {
        const bodyLastId = processStatements(stmt.body, prevId);
        const condLabel = expressionToString(stmt.condition);
        const decisionId = addNode('decision', condLabel);
        addEdge(bodyLastId, decisionId);

        // Yes -> loop back to first body node
        const firstBodyEdge = edges.find(e => e.from === prevId && e.label === null);
        const firstBodyNodeId = firstBodyEdge ? firstBodyEdge.to : prevId;
        addEdge(decisionId, firstBodyNodeId, 'Yes');

        // No -> exit
        const exitId = addNode('junction', '');
        addEdge(decisionId, exitId, 'No');
        return exitId;
      }

      case 'ForStatement': {
        const initLabel = `${stmt.variable} = ${expressionToString(stmt.start)}`;
        const initId = addNode('process', initLabel);
        addEdge(prevId, initId);

        const condOp = stmt.conditionOp || '<=';
        const condLabel = `${stmt.variable} ${condOp} ${expressionToString(stmt.end)}`;
        const condId = addNode('decision', condLabel);
        addEdge(initId, condId);

        if (stmt.body.length > 0) {
          const bodyLastId = processStatements(stmt.body, condId);
          const incLabel = `${stmt.variable} = ${stmt.variable} + 1`;
          const incId = addNode('process', incLabel);
          addEdge(bodyLastId, incId);
          addEdge(incId, condId);
          const bodyEdge = edges.find(e => e.from === condId && e.label === null);
          if (bodyEdge) bodyEdge.label = 'Yes';
        }

        const exitId = addNode('junction', '');
        addEdge(condId, exitId, 'No');
        return exitId;
      }

      case 'Block': {
        return processStatements(stmt.body || [], prevId);
      }

      default:
        return prevId;
    }
  }

  const startId = addNode('start', 'Start');
  const lastId = processStatements(ast.body, startId);
  const endId = addNode('end', 'End');
  addEdge(lastId, endId);

  // Post-process: remove junction nodes by rewiring edges through them
  return removeJunctions({ nodes, edges });
}

// Remove junction (empty merge) nodes by connecting their incoming edges
// directly to their outgoing edges' targets
function removeJunctions(cfg) {
  const { nodes, edges } = cfg;
  const junctionIds = new Set(nodes.filter(n => n.type === 'junction').map(n => n.id));

  if (junctionIds.size === 0) return cfg;

  const newEdges = [...edges];
  const removed = new Set();

  for (const jId of junctionIds) {
    // Find all edges going INTO this junction
    const incoming = newEdges.filter(e => e.to === jId && !removed.has(e));
    // Find all edges going OUT of this junction
    const outgoing = newEdges.filter(e => e.from === jId && !removed.has(e));

    if (outgoing.length === 1) {
      const target = outgoing[0].to;
      // Rewire: each incoming edge now points to the outgoing target
      for (const inc of incoming) {
        inc.to = target;
      }
      // Mark outgoing edge for removal
      removed.add(outgoing[0]);
    }
    // If multiple outgoing (shouldn't happen for junctions), leave as is
  }

  // Remove junction nodes and marked edges
  return {
    nodes: nodes.filter(n => !junctionIds.has(n.id)),
    edges: newEdges.filter(e => !removed.has(e))
  };
}
