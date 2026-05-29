# ProgEngine - Pseudocode to Flowchart Generator

## 📋 Project Overview

ProgEngine is a web-based application that automatically converts pseudocode into accurate flowchart diagrams using compiler design techniques. It performs lexical analysis, syntax validation, and AST-based control flow generation to create visual representations of algorithms.

---

## 🎯 Problem Statement

Students and developers frequently write algorithms in pseudocode but must manually create flowcharts for visualization. This manual process is:
- Time-consuming
- Prone to logical or structural errors
- Increasingly difficult as algorithm complexity grows

**Solution:** ProgEngine automates this process, converting algorithm logic into accurate visual diagrams, saving time and reducing errors.

---

## Deploy

**Full step-by-step guide:** [DEPLOY.md](./DEPLOY.md)

| Service | Platform | Root folder |
|---------|----------|-------------|
| Frontend | [Vercel](https://vercel.com) | `frontend` |
| Backend | [Render](https://render.com) | `backend` |

**Required env vars:** `VITE_API_URL` (Vercel) · `FRONTEND_URL` + `ALLOW_VERCEL_PREVIEW` (Render)

---

## Setup & Run (local development)

### 1. Clone / Open the project

```bash
cd ProgEngine
```

### 2. Install dependencies

Open two terminals and run:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

### 3. Start the application

**Terminal 1 - Start backend (runs on port 3001):**
```bash
cd backend
npm run dev
```

**Terminal 2 - Start frontend (runs on port 5173):**
```bash
cd frontend
npm run dev
```

### 4. Open in browser

Go to [http://localhost:5173](http://localhost:5173)

## ✨ Key Features

- **Pseudocode Input Editor** - Clean code editor for writing pseudocode
- **Automatic Flowchart Generation** - One-click conversion to visual diagrams
- **Lexical Analysis** - Tokenizes input, identifies keywords (IF, ELSE, WHILE, FOR), operators, identifiers
- **Syntax Validation** - Validates block structures, parentheses, nesting
- **AST Builder** - Creates hierarchical tree structure for control flow
- **Control Flow Generator** - Converts AST to flowchart nodes and edges
- **Mermaid.js Rendering** - Beautiful, interactive flowchart visualization
- **Light/Dark Mode** - Toggle between themes for comfortable viewing
- **Error Handling** - Clear syntax error messages with line numbers
- **Export Options** - Download flowcharts as PNG/SVG

---

## 🛠 Technology Stack

### Frontend (Core Technologies)
- **React.js** - Component-based dynamic UI
- **HTML5** - Structure
- **CSS3/Tailwind CSS** - Styling and responsive design
- **Mermaid.js** - Flowchart diagram rendering

### Backend
- **Node.js** - Runtime environment for server-side logic
- **Express.js** - Web framework for REST API requests

### Development Tools
- **Visual Studio Code** - Code editor
- **GitHub** - Repository hosting
- **Postman** - API testing

## 📝 Supported Pseudocode Syntax

```
// Variables and Assignment
SET variable = value
variable = expression

// Input/Output
INPUT variable
OUTPUT expression
PRINT expression
READ variable

// Conditional Statements
IF condition THEN
    statements
ENDIF

IF condition THEN
    statements
ELSE
    statements
ENDIF

// Loops
WHILE condition DO
    statements
ENDWHILE

FOR variable = start TO end DO
    statements
ENDFOR

// Operators
Arithmetic: +, -, *, /, %
Comparison: ==, !=, <, >, <=, >=
Logical: AND, OR, NOT

// Comments
// This is a comment
```

---

## 🎨 UI/UX Requirements

### Layout
- **Split-pane design**: Code editor on left (40%), Flowchart on right (60%)
- **Responsive**: Works on desktop and tablet
- **Clean, modern aesthetic**: Minimal, professional look

### Theme Support
- **Light Mode**: White background, dark text, subtle shadows
- **Dark Mode**: Dark background (#1a1a2e or similar), light text, glowing accents
- **Theme Toggle**: Smooth transition, persists in localStorage

### Components
1. **Header**: Logo, App name, Theme toggle, GitHub link
2. **Code Editor**: Syntax highlighting, line numbers, error indicators
3. **Control Bar**: Generate button, Clear button, Example dropdown
4. **Flowchart Panel**: Zoomable, pannable diagram area
5. **Error Panel**: Collapsible error messages with line references
6. **Footer**: Credits, version info

---

## 📁 Project Structure

```
progengine/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── FlowchartDisplay.jsx
│   │   │   ├── ControlBar.jsx
│   │   │   ├── ErrorPanel.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   └── useFlowchartGenerator.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── themes.css
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── lexer/
│   │   │   └── lexer.js
│   │   ├── parser/
│   │   │   ├── syntaxValidator.js
│   │   │   └── astBuilder.js
│   │   ├── generator/
│   │   │   ├── controlFlowGenerator.js
│   │   │   └── mermaidGenerator.js
│   │   ├── routes/
│   │   │   └── flowchartRoutes.js
│   │   └── index.js
│   └── package.json
│
└── README.md


## 🚀 Expected Outcomes

1. **Automated Flowchart Generation** - System capable of converting pseudocode into structured flowchart diagrams
2. **Accurate Visual Diagrams** - Logical correctness by transforming algorithmic steps into clear visual representations
3. **Syntax Validation & AST Processing** - Integrated lexical analysis, syntax checking, and AST construction
4. **Reduced Manual Effort** - Eliminated need for hand-drawn flowcharts, minimizing human mistakes
5. **Improved Understanding** - Enhanced clarity of complex logic structures for students, educators, and developers

---

## 📖 Sample Pseudocode Examples

### Example 1: Simple Conditional
```
SET number = 10
IF number > 0 THEN
    OUTPUT "Positive"
ELSE
    OUTPUT "Non-positive"
ENDIF
```

### Example 2: While Loop
```
SET count = 1
WHILE count <= 5 DO
    OUTPUT count
    SET count = count + 1
ENDWHILE
```

### Example 3: Nested Structures
```
INPUT n
SET sum = 0
FOR i = 1 TO n DO
    IF i % 2 == 0 THEN
        SET sum = sum + i
    ENDIF
ENDFOR
OUTPUT sum
```

---

## 🎯 Implementation Notes

### Lexer Token Types
- `KEYWORD`: IF, ELSE, THEN, ENDIF, WHILE, DO, ENDWHILE, FOR, TO, ENDFOR, SET, INPUT, OUTPUT, PRINT, READ, AND, OR, NOT
- `IDENTIFIER`: Variable names (letters, numbers, underscores)
- `NUMBER`: Integer and decimal numbers
- `STRING`: Text in quotes
- `OPERATOR`: +, -, *, /, %, =, ==, !=, <, >, <=, >=
- `PUNCTUATION`: (, ), comma
- `NEWLINE`: Line breaks
- `COMMENT`: Lines starting with //

### AST Node Types
- `Program`: Root node containing statements
- `Assignment`: Variable assignment
- `IfStatement`: Conditional with condition, thenBlock, elseBlock
- `WhileLoop`: Loop with condition and body
- `ForLoop`: Loop with iterator, start, end, body
- `Input`: User input statement
- `Output`: Display statement
- `BinaryExpression`: Operations with left, operator, right
- `Identifier`: Variable reference
- `Literal`: Number or string value

### Mermaid Node Mapping
- `A[text]` → Process/Statement (rectangle)
- `A{text}` → Decision/Condition (diamond)
- `A([text])` → Start/End (rounded rectangle)
- `A --> B` → Flow connection
- `A -->|label| B` → Labeled connection (Yes/No for conditions)

---

## 📄 License

MIT License - Feel free to use and modify for educational purposes.

## 👥 Target Users

- **Students** learning algorithms and programming
- **Educators** teaching algorithm visualization
- **Developers** documenting their code logic

---
## Acknowledgements

Special thanks to my teammates for their valuable support and contribution to this project:

* [Anvi Shah](https://github.com/anvi-sha675)
* [Diksha Kunwar](https://github.com/dikshakunwar)


**Built with ❤️ for the programming community**
