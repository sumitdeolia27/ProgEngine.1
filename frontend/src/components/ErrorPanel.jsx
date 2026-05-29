import { useState } from 'react';

export default function ErrorPanel({ errors, onErrorClick }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!errors || errors.length === 0) return null;

  return (
    <div className="border-t border-light-border dark:border-dark-border
      bg-red-50 dark:bg-red-950/30 shrink-0">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-2
          text-sm font-medium text-error dark:text-error-light cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errors.length} error{errors.length > 1 ? 's' : ''} found</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Error list */}
      {!collapsed && (
        <div className="px-4 pb-3 space-y-1 max-h-[150px] overflow-auto">
          {errors.map((err, i) => (
            <div
              key={i}
              onClick={() => onErrorClick && onErrorClick(err.line)}
              className="flex items-start gap-3 px-3 py-2 rounded-md text-sm
                bg-red-100/60 dark:bg-red-900/20
                hover:bg-red-100 dark:hover:bg-red-900/30
                cursor-pointer transition-colors duration-150"
            >
              <span className="shrink-0 font-mono text-xs mt-0.5 px-1.5 py-0.5 rounded
                bg-red-200 dark:bg-red-900/40 text-error dark:text-error-light">
                {err.line ? `L${err.line}` : '?'}
              </span>
              <span className="text-red-800 dark:text-red-300">{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
