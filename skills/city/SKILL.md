---
name: city
description: "Visualize your codebase as a living 3D city in the browser. Files become buildings, folders become districts, bugs become fires. Use when user says 'city', 'visualize', '3d', 'show my code', or '/city'."
allowed-tools: Bash
---

# Claude City

Launch a 3D visualization of the current codebase.

## Commands

### `/city` (default)
Analyze the repo and launch the 3D city in the browser:
```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/analyze.js" . "${CLAUDE_SKILL_DIR}/../../app/city-data.json" && node "${CLAUDE_SKILL_DIR}/../../scripts/server.js"
```

Tell the user: "Your code city is live! Open http://localhost:3333 in your browser. Click buildings to inspect files. Scroll to zoom. Drag to rotate. Press R to reset camera."

### `/city analyze`
Only regenerate the city data without launching the server:
```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/analyze.js" . "${CLAUDE_SKILL_DIR}/../../app/city-data.json"
```

### `/city demo`
Launch with demo data (no repo analysis needed):
```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/server.js"
```
The app auto-generates a demo city if city-data.json is not found.

## Notes
- The 3D city opens in your default browser
- Buildings are colored by programming language
- Height represents lines of code
- Fires (🔥) indicate files with bug-fix commits
- Green beacons mark test files
- Sparkles appear on recently modified files
- Agents represent contributors walking between buildings
- Press Ctrl+C in the terminal to stop the server
