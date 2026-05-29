import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../context/ThemeContext';

let mermaidInitialized = false;

export default function FlowchartDisplay({ mermaidCode }) {
  const containerRef = useRef(null);
  const { theme } = useTheme();
  const [scale, setScale] = useState(1);
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState('');
  const renderCountRef = useRef(0);

  // Initialize/reinitialize mermaid when theme changes
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      flowchart: {
        curve: 'basis',
        padding: 15,
        htmlLabels: true,
        useMaxWidth: false
      },
      securityLevel: 'loose',
      suppressErrors: true
    });
    mermaidInitialized = true;

    // Re-render current diagram with new theme
    if (mermaidCode) {
      renderDiagram(mermaidCode);
    }
  }, [theme]);

  const renderDiagram = useCallback(async (code) => {
    if (!code) {
      setSvgContent('');
      setRenderError('');
      return;
    }

    const renderId = ++renderCountRef.current;

    // Clean up any previous render artifacts
    const existingEl = document.getElementById(`mermaid-render-${renderId - 1}`);
    if (existingEl) existingEl.remove();

    try {
      // Use unique ID for each render to avoid conflicts
      const id = `mermaid-render-${renderId}`;
      const { svg } = await mermaid.render(id, code);

      if (renderId === renderCountRef.current) {
        setSvgContent(svg);
        setRenderError('');
        setScale(1);
      }
    } catch (err) {
      console.error('Mermaid render error:', err);
      if (renderId === renderCountRef.current) {
        setRenderError(err?.message || 'Failed to render flowchart diagram.');
        setSvgContent('');
      }
      // Clean up any error artifacts mermaid may have inserted
      const errEl = document.querySelector(`#d${renderCountRef.current}`);
      if (errEl) errEl.remove();
    }
  }, []);

  // Render when mermaidCode changes
  useEffect(() => {
    if (!mermaidCode) {
      setSvgContent('');
      setRenderError('');
      return;
    }

    // Small delay to ensure mermaid is initialized
    const timer = setTimeout(() => renderDiagram(mermaidCode), 50);
    return () => clearTimeout(timer);
  }, [mermaidCode, renderDiagram]);

  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.3));
  const resetZoom = () => setScale(1);

  const exportSVG = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchart.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [svgContent]);

  const exportPNG = useCallback(() => {
    if (!svgContent) return;
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    const bbox = svgEl.getBoundingClientRect();
    const scaleFactor = 2;
    canvas.width = bbox.width * scaleFactor;
    canvas.height = bbox.height * scaleFactor;
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = theme === 'dark' ? '#0f0f1a' : '#f0f2f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'flowchart.png';
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [svgContent, theme]);

  const copyMermaidCode = useCallback(() => {
    if (mermaidCode) {
      navigator.clipboard.writeText(mermaidCode);
    }
  }, [mermaidCode]);

  return (
    <div className="h-full flex flex-col rounded-lg border border-light-border dark:border-dark-border
      bg-light-bg dark:bg-dark-bg overflow-hidden light-panel">
      {/* Toolbar */}
      {svgContent && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-light-border dark:border-dark-border
          bg-light-bg dark:bg-dark-bg2 shrink-0">
          <button onClick={zoomOut} className="toolbar-btn" title="Zoom out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <span className="text-xs text-light-text2 dark:text-dark-text2 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} className="toolbar-btn" title="Zoom in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button onClick={resetZoom} className="toolbar-btn" title="Reset zoom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          </button>

          <div className="flex-1" />

          <button onClick={copyMermaidCode} className="toolbar-btn text-xs" title="Copy Mermaid code">
            Copy Code
          </button>
          <button onClick={exportSVG} className="toolbar-btn text-xs" title="Export as SVG">
            SVG
          </button>
          <button onClick={exportPNG} className="toolbar-btn text-xs" title="Export as PNG">
            PNG
          </button>
        </div>
      )}

      {/* Diagram area */}
      <div className="flex-1 overflow-auto p-4">
        {renderError ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <p className="text-error dark:text-error-light text-sm">{renderError}</p>
            {mermaidCode && (
              <details className="text-xs text-light-text2 dark:text-dark-text2 max-w-full">
                <summary className="cursor-pointer">Show generated Mermaid code</summary>
                <pre className="mt-2 p-3 rounded bg-light-bg2 dark:bg-dark-bg2 overflow-auto max-h-[200px] whitespace-pre-wrap">
                  {mermaidCode}
                </pre>
              </details>
            )}
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            className="flex justify-center min-h-full"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-light-text2 dark:text-dark-text2">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <path d="M10 6.5h4M6.5 10v4M17.5 10v4" />
            </svg>
            <p className="text-sm">Write code and click Generate</p>
            <p className="text-xs opacity-60">or press Ctrl+Enter</p>
          </div>
        )}
      </div>
    </div>
  );
}
