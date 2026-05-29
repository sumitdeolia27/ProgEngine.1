import { Router } from 'express';
import { tokenize } from '../compiler/lexer.js';
import { validate } from '../compiler/syntaxValidator.js';
import { buildAST } from '../compiler/astBuilder.js';
import { generateCFG } from '../compiler/controlFlowGenerator.js';
import { generateMermaid } from '../compiler/mermaidGenerator.js';
import { generateExplanation } from '../compiler/explanationGenerator.js';
import { parseCStyle } from '../compiler/languages/cStyleParser.js';
import { parsePython } from '../compiler/languages/pythonParser.js';
import { tokenizeGeneric } from '../compiler/genericTokenizer.js';

const router = Router();

router.post('/generate-flowchart', (req, res) => {
  const { pseudocode, language = 'pseudocode' } = req.body;

  if (!pseudocode || typeof pseudocode !== 'string' || pseudocode.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Code input is required', line: 0, column: 0 }
    });
  }

  try {
    let ast;
    let tokens = null;

    if (language === 'pseudocode') {
      // Original pseudocode pipeline
      tokens = tokenize(pseudocode);
      const validation = validate(tokens);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.errors[0],
          errors: validation.errors
        });
      }
      ast = buildAST(tokens);
    } else if (language === 'python') {
      tokens = tokenizeGeneric(pseudocode, 'python');
      ast = parsePython(pseudocode);
    } else if (['c', 'cpp', 'java'].includes(language)) {
      tokens = tokenizeGeneric(pseudocode, language);
      ast = parseCStyle(pseudocode, language);
    } else {
      return res.status(400).json({
        success: false,
        error: { message: `Unsupported language: ${language}`, line: 0, column: 0 }
      });
    }

    // Check if AST has any statements
    if (!ast || !ast.body || ast.body.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No recognizable statements found in the code. Make sure your code contains control flow (if/else, loops) or I/O operations.', line: 0, column: 0 }
      });
    }

    const cfg = generateCFG(ast);
    const mermaidCode = generateMermaid(cfg);
    const explanation = generateExplanation(ast, language);

    return res.json({
      success: true,
      mermaidCode,
      tokens,
      ast,
      cfg,
      explanation,
      language
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'Compilation error',
        line: err.line || 0,
        column: err.column || 0
      }
    });
  }
});

export default router;
