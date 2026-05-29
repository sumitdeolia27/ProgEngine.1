import { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

let pseudocodeRegistered = false;

function registerPseudocodeLanguage(monaco) {
  if (pseudocodeRegistered) return;
  pseudocodeRegistered = true;

  monaco.languages.register({ id: 'pseudocode' });
  monaco.languages.setMonarchTokensProvider('pseudocode', {
    ignoreCase: true,
    keywords: [
      'IF', 'ELSE', 'THEN', 'ENDIF', 'WHILE', 'DO', 'ENDWHILE',
      'FOR', 'TO', 'ENDFOR', 'SET', 'INPUT', 'OUTPUT', 'PRINT', 'READ',
      'AND', 'OR', 'NOT'
    ],
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/==|!=|<=|>=|[+\-*/%=<>]/, 'operator'],
        [/[(),]/, 'delimiter'],
        [/\s+/, 'white']
      ]
    }
  });

  // Custom themes for all languages
  monaco.editor.defineTheme('progengine-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '6366f1', fontStyle: 'bold' },
      { token: 'string', foreground: '16a34a' },
      { token: 'number', foreground: 'ea580c' },
      { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
      { token: 'operator', foreground: 'dc2626' },
      { token: 'identifier', foreground: '1a1a2e' }
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1a1a2e',
      'editor.lineHighlightBackground': '#f0f2f5',
      'editorLineNumber.foreground': '#6b7280'
    }
  });

  monaco.editor.defineTheme('progengine-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
      { token: 'string', foreground: '4ade80' },
      { token: 'number', foreground: 'fb923c' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'operator', foreground: 'f87171' },
      { token: 'identifier', foreground: 'e4e4e7' }
    ],
    colors: {
      'editor.background': '#1a1a2e',
      'editor.foreground': '#e4e4e7',
      'editor.lineHighlightBackground': '#27273a',
      'editorLineNumber.foreground': '#64748b'
    }
  });
}

export default function CodeEditor({ value, onChange, errors, editorRef, language }) {
  const monacoRef = useRef(null);
  const { theme } = useTheme();
  const editorTheme = theme === 'dark' ? 'progengine-dark' : 'progengine-light';

  const handleBeforeMount = useCallback((monaco) => {
    registerPseudocodeLanguage(monaco);
  }, []);

  const handleMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco;
    if (editorRef) editorRef.current = editor;
  }, [editorRef]);

  // Set error markers
  if (monacoRef.current) {
    const monaco = monacoRef.current;
    const model = monaco.editor.getModels()[0];
    if (model) {
      const markers = (errors || []).map(err => ({
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: err.line || 1,
        startColumn: err.column || 1,
        endLineNumber: err.line || 1,
        endColumn: (err.column || 1) + 10
      }));
      monaco.editor.setModelMarkers(model, 'validation', markers);
    }
  }

  // Map our language names to Monaco language IDs
  const monacoLang = language === 'pseudocode' ? 'pseudocode'
    : language === 'cpp' ? 'cpp'
    : language === 'c' ? 'c'
    : language === 'python' ? 'python'
    : language === 'java' ? 'java'
    : 'plaintext';

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-light-border dark:border-dark-border light-panel">
      <Editor
        height="100%"
        language={monacoLang}
        value={value}
        onChange={onChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 12 },
          renderLineHighlight: 'line',
          bracketPairColorization: { enabled: true },
          suggestOnTriggerCharacters: false,
          quickSuggestions: false,
          parameterHints: { enabled: false },
          tabSize: 4
        }}
      />
    </div>
  );
}
