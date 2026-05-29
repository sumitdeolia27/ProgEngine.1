import { useState, useCallback } from 'react';
import { generateFlowchart as apiGenerate } from '../utils/api';

const EXAMPLES = {
  pseudocode: {
    'Check Positive Number': `SET number = 10
IF number > 0 THEN
    OUTPUT "Positive"
ELSE
    OUTPUT "Non-positive"
ENDIF`,
    'Count to 5': `SET count = 1
WHILE count <= 5 DO
    OUTPUT count
    SET count = count + 1
ENDWHILE`,
    'Sum Even Numbers': `INPUT n
SET sum = 0
FOR i = 1 TO n DO
    IF i % 2 == 0 THEN
        SET sum = sum + i
    ENDIF
ENDFOR
OUTPUT sum`,
    'Find Maximum': `INPUT a
INPUT b
IF a > b THEN
    SET max = a
ELSE
    SET max = b
ENDIF
OUTPUT max`
  },
  c: {
    'Check Positive': `#include <stdio.h>

int main() {
    int number = 10;
    if (number > 0) {
        printf("Positive");
    } else {
        printf("Non-positive");
    }
    return 0;
}`,
    'Sum Even Numbers': `#include <stdio.h>

int main() {
    int n, sum = 0;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        if (i % 2 == 0) {
            sum += i;
        }
    }
    printf("%d", sum);
    return 0;
}`,
    'Find Maximum': `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d", &a);
    scanf("%d", &b);
    if (a > b) {
        printf("%d", a);
    } else {
        printf("%d", b);
    }
    return 0;
}`
  },
  cpp: {
    'Check Positive': `#include <iostream>
using namespace std;

int main() {
    int number = 10;
    if (number > 0) {
        cout << "Positive" << endl;
    } else {
        cout << "Non-positive" << endl;
    }
    return 0;
}`,
    'Count to 5': `#include <iostream>
using namespace std;

int main() {
    int count = 1;
    while (count <= 5) {
        cout << count << endl;
        count++;
    }
    return 0;
}`,
    'Sum Even Numbers': `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        if (i % 2 == 0) {
            sum += i;
        }
    }
    cout << sum << endl;
    return 0;
}`
  },
  python: {
    'Check Positive': `number = 10
if number > 0:
    print("Positive")
else:
    print("Non-positive")`,
    'Count to 5': `count = 1
while count <= 5:
    print(count)
    count += 1`,
    'Sum Even Numbers': `n = int(input("Enter n: "))
total = 0
for i in range(1, n + 1):
    if i % 2 == 0:
        total = total + i
print(total)`,
    'Find Maximum': `a = int(input())
b = int(input())
if a > b:
    print(a)
else:
    print(b)`
  },
  java: {
    'Check Positive': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int number = 10;
        if (number > 0) {
            System.out.println("Positive");
        } else {
            System.out.println("Non-positive");
        }
    }
}`,
    'Find Maximum': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        if (a > b) {
            System.out.println(a);
        } else {
            System.out.println(b);
        }
    }
}`,
    'Sum Even Numbers': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int sum = 0;
        for (int i = 1; i <= n; i++) {
            if (i % 2 == 0) {
                sum += i;
            }
        }
        System.out.println(sum);
    }
}`
  }
};

const LANGUAGE_LABELS = {
  pseudocode: 'Pseudocode',
  c: 'C',
  cpp: 'C++',
  python: 'Python',
  java: 'Java'
};

export function useFlowchartGenerator() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('pseudocode');
  const [mermaidCode, setMermaidCode] = useState('');
  const [tokens, setTokens] = useState(null);
  const [ast, setAst] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrors([]);
    setMermaidCode('');

    const result = await apiGenerate(code, language);

    if (result.success) {
      setMermaidCode(result.mermaidCode);
      setTokens(result.tokens || null);
      setAst(result.ast || null);
      setCfg(result.cfg || null);
      setExplanation(result.explanation || null);
      setErrors([]);
    } else {
      setMermaidCode('');
      setTokens(null);
      setAst(null);
      setCfg(null);
      setExplanation(null);
      const errs = result.errors || (result.error ? [result.error] : []);
      setErrors(errs);
    }
    setIsLoading(false);
  }, [code, language]);

  const clear = useCallback(() => {
    setCode('');
    setMermaidCode('');
    setTokens(null);
    setAst(null);
    setCfg(null);
    setExplanation(null);
    setErrors([]);
  }, []);

  const loadExample = useCallback((name) => {
    const langExamples = EXAMPLES[language];
    if (langExamples && langExamples[name]) {
      setCode(langExamples[name]);
      setMermaidCode('');
      setErrors([]);
    }
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    setCode('');
    setMermaidCode('');
    setTokens(null);
    setAst(null);
    setCfg(null);
    setExplanation(null);
    setErrors([]);
  }, []);

  return {
    code, setCode,
    language, changeLanguage,
    mermaidCode, tokens, ast, cfg, explanation,
    errors, isLoading,
    generate, clear, loadExample,
    exampleNames: Object.keys(EXAMPLES[language] || {}),
    languageNames: Object.keys(LANGUAGE_LABELS),
    languageLabels: LANGUAGE_LABELS
  };
}
