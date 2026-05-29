export default function ControlBar({ onGenerate, onClear, onLoadExample, isLoading, exampleNames,
  language, onLanguageChange, languageNames, languageLabels }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      {/* Language Selector */}
      <div className="flex items-center rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
        {languageNames.map(lang => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={`px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer
              ${language === lang
                ? 'bg-primary dark:bg-primary-light text-white shadow-sm'
                : 'bg-white dark:bg-dark-bg2 text-light-text2 dark:text-dark-text2 hover:bg-light-bg2 dark:hover:bg-dark-border'
              }`}
          >
            {languageLabels[lang]}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm text-white
          bg-primary hover:bg-primary/90 dark:bg-primary-light dark:hover:bg-primary-light/90
          hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
          shadow-md hover:shadow-lg cursor-pointer"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Generate
          </>
        )}
      </button>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="px-4 py-2 rounded-lg font-medium text-sm
          border border-light-border dark:border-dark-border
          bg-white dark:bg-transparent
          text-light-text2 dark:text-dark-text2
          hover:bg-light-bg2 dark:hover:bg-dark-bg2
          hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
      >
        Clear
      </button>

      {/* Example Dropdown */}
      <select
        onChange={(e) => {
          if (e.target.value) {
            onLoadExample(e.target.value);
            e.target.value = '';
          }
        }}
        defaultValue=""
        className="px-3 py-2 rounded-lg text-sm font-medium
          border border-light-border dark:border-dark-border
          bg-white dark:bg-dark-bg2
          text-light-text dark:text-dark-text
          cursor-pointer outline-none
          focus:ring-2 focus:ring-primary/50"
      >
        <option value="" disabled>Load Example...</option>
        {exampleNames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Shortcut hint */}
      <span className="hidden lg:inline text-xs text-light-text2 dark:text-dark-text2 ml-auto">
        Ctrl+Enter to generate
      </span>
    </div>
  );
}
