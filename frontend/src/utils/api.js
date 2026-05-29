export async function generateFlowchart(code, language = 'pseudocode') {
  try {
    const res = await fetch('/api/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudocode: code, language })
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: { message: 'Network error: Could not connect to server. Is the backend running?', line: 0, column: 0 }
    };
  }
}
