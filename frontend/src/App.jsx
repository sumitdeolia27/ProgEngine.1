import { useEffect, useRef, useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { useFlowchartGenerator } from './hooks/useFlowchartGenerator';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import ControlBar from './components/ControlBar';
import FlowchartDisplay from './components/FlowchartDisplay';
import NavigationTabs from './components/NavigationTabs';
import PipelineView from './components/PipelineView';
import ErrorPanel from './components/ErrorPanel';

const MONACO_LANG_MAP = {
  pseudocode: 'pseudocode',
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  java: 'java'
};

export default function App() {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const [activeTab, setActiveTab] = useState('flowchart');
  const {
    code, setCode,
    language, changeLanguage,
    mermaidCode, tokens, ast, cfg, explanation,
    errors, isLoading,
    generate, clear, loadExample,
    exampleNames, languageNames, languageLabels
  } = useFlowchartGenerator();

  // Ctrl+Enter keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate]);

  const handleErrorClick = (line) => {
    if (editorRef.current && line) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-dark-bg text-dark-text' : 'bg-light-bg text-light-text'}`}>
      <Header />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel: Editor (40%) */}
        <div className="w-full md:w-[40%] flex flex-col px-3 pt-2 pb-3 overflow-hidden">
          <ControlBar
            onGenerate={generate}
            onClear={clear}
            onLoadExample={loadExample}
            isLoading={isLoading}
            exampleNames={exampleNames}
            language={language}
            onLanguageChange={changeLanguage}
            languageNames={languageNames}
            languageLabels={languageLabels}
          />
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={(val) => setCode(val || '')}
              errors={errors}
              editorRef={editorRef}
              language={MONACO_LANG_MAP[language] || 'plaintext'}
            />
          </div>
        </div>

        {/* Right panel: Pipeline views (60%) */}
        <div className="w-full md:w-[60%] flex flex-col p-3 overflow-hidden">
          <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'flowchart' ? (
              <FlowchartDisplay mermaidCode={mermaidCode} />
            ) : (
              <div className="h-full rounded-lg border border-light-border dark:border-dark-border
                bg-light-bg dark:bg-dark-bg overflow-hidden light-panel">
                <PipelineView activeTab={activeTab} tokens={tokens} ast={ast} cfg={cfg} mermaidCode={mermaidCode} explanation={explanation} />
              </div>
            )}
          </div>
        </div>
      </div>

      <ErrorPanel errors={errors} onErrorClick={handleErrorClick} />

      <footer className="text-center py-2 text-xs text-light-text2 dark:text-dark-text2
        border-t border-light-border dark:border-dark-border shrink-0
        bg-white dark:bg-transparent">
        ProgEngine v1.0 — Pseudocode, C, C++, Python, Java to Flowchart
      </footer>
    </div>
  );
}
