# ProgEngine - Pseudocode to Flowchart Generator

A web application that converts pseudocode (and C, C++, Python, Java) into visual flowchart diagrams using compiler design techniques.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

## Setup & Run

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

## Usage

1. Write pseudocode in the editor (or select an example from the dropdown)
2. Click **Generate Flowchart** (or press `Ctrl+Enter`)
3. View the generated flowchart on the right panel
4. Use zoom controls to adjust the view
5. Export as **PNG** or **SVG**, or copy the Mermaid code

## Supported Pseudocode Syntax

```
SET variable = value
INPUT variable
OUTPUT expression
PRINT expression

IF condition THEN
    statements
ELSE
    statements
ENDIF

WHILE condition DO
    statements
ENDWHILE

FOR variable = start TO end DO
    statements
ENDFOR
```

## Production Build

```bash
cd frontend
npm run build
npm run preview
```
