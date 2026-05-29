import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="h-[60px] flex items-center justify-between px-6
      bg-white dark:bg-dark-bg border-b border-light-border dark:border-dark-border shrink-0
      shadow-sm dark:shadow-none">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary dark:text-primary-light">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="8.5" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
          <line x1="6.5" y1="10" x2="6.5" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="17.5" y1="10" x2="17.5" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="6.5" y1="12" x2="17.5" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="12" x2="12" y2="14" stroke="currentColor" strokeWidth="2" />
        </svg>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          ProgEngine
        </h1>
      </div>

      {/* Center: Tagline */}
      <p className="hidden md:block text-sm text-light-text2 dark:text-dark-text2">
        Pseudocode to Flowchart Generator
      </p>

      {/* Right: Theme toggle + GitHub */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:scale-105 transition-transform duration-200
            text-light-text2 dark:text-dark-text2 hover:text-light-text dark:hover:text-dark-text"
          aria-label="GitHub"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
