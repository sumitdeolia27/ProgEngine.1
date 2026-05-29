import { useCallback } from 'react';

export default function PipelineView({ activeTab, tokens, ast, cfg, mermaidCode, explanation }) {
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
  }, []);

  const renderData = (data, label) => {
    if (data === null || data === undefined) {
      return (
        <div className="h-full flex items-center justify-center text-light-text2 dark:text-dark-text2">
          <p className="text-sm">No {label} data available. Generate code first.</p>
        </div>
      );
    }

    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-end px-3 py-2 border-b border-light-border dark:border-dark-border shrink-0">
          <button
            onClick={() => copyToClipboard(text)}
            className="toolbar-btn text-xs"
            title={`Copy ${label}`}
          >
            Copy
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-light-text dark:text-dark-text whitespace-pre-wrap break-words">
          {text}
        </pre>
      </div>
    );
  };

  switch (activeTab) {
    case 'tokens':
      return renderData(tokens, 'token');
    case 'ast':
      return renderData(ast, 'AST');
    case 'cfg':
      return renderData(cfg, 'control flow graph');
    case 'mermaid':
      return renderData(mermaidCode, 'Mermaid code');
    case 'explanation':
      return renderData(explanation, 'explanation');
    default:
      return null;
  }
}
