# Claude City

**Your codebase as a living 3D city.**

Files become buildings. Folders become districts. Bugs become fires. Deploys become rockets. Contributors walk between buildings as animated agents. All rendered in real-time 3D in your browser.

Zero install. Works with any git repo.

---

## What You See

- **Buildings** = Files (height = lines of code, color = programming language)
- **Districts** = Folders (grouped neighborhoods with labels)
- **Roads** = Dependencies (curved paths connecting related files)
- **Fires 🔥** = Bugs (particle effects on files with bug-fix commits)
- **Sparkles ✨** = New features (glowing recently modified files)
- **Rockets 🚀** = Deploys (launch from the city center)
- **Agents 🚶** = Contributors (walking between buildings)
- **Green beacons** = Test files
- **Window lights** = Tall buildings get illuminated windows
- **Stars** = Night sky with twinkling starfield

---

## Quick Start

### Standalone (any git repo)
```bash
git clone https://github.com/Manavarya09/claude-city.git
cd claude-city
node scripts/analyze.js /path/to/your/repo
node scripts/server.js
```
Opens in your browser at `http://localhost:3333`

### Claude Code Plugin
```bash
git clone https://github.com/Manavarya09/claude-city.git ~/.claude/plugins/claude-city
```
Then in any project:
```
/city
```

### Demo Mode (no repo needed)
```bash
node scripts/server.js
```
Auto-generates a demo city if no data file exists.

---

## Controls

| Action | Control |
|--------|---------|
| Rotate | Click + drag |
| Zoom | Scroll wheel |
| Pan | Right-click + drag |
| Inspect building | Hover |
| Zoom to building | Click |
| Reset camera | Press `R` or 📷 button |
| Toggle fires | 🔥 button |
| Toggle roads | 🛣️ button |
| Launch rocket | 🚀 button |

---

## How Buildings Are Generated

| Code Concept | City Element | Visual Property |
|---|---|---|
| File | Building | 3D box |
| Lines of code | Building height | Y scale |
| Language | Building color | Material color |
| Folder | District | Grouped area with label |
| Import/require | Road | Curved line between buildings |
| Bug-fix commits | Fire | Particle effect |
| Recent changes | Sparkle | Glowing emissive material |
| Test file | Green beacon | Sphere on top |
| Contributor | Agent | Walking character |

### Language Colors

| Language | Color |
|----------|-------|
| TypeScript | 🔵 Blue |
| JavaScript | 🟡 Yellow |
| Python | 🔵 Dark Blue |
| Rust | 🟠 Orange |
| Go | 🔵 Cyan |
| Java | 🟤 Brown |
| Ruby | 🔴 Red |
| HTML | 🟠 Orange-Red |
| CSS | 🟣 Purple |

---

## Tech Stack

- **Three.js** — 3D rendering (loaded from CDN, no build step)
- **Node.js** — Git analysis and local server
- **D3-inspired treemap** — City layout algorithm
- **Zero dependencies** — No npm install needed

---

## Architecture

```
Your Git Repo
    │
    ▼
┌─────────────┐
│ analyze.js  │  Parses git log, file tree, dependencies
│             │  Outputs city-data.json
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ server.js   │  Serves the 3D app on localhost
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│              index.html                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ city.js  │ │agents.js │ │effects.js││
│  │Buildings │ │Walking   │ │Fire,     ││
│  │Districts │ │sprites   │ │sparkles, ││
│  │Roads     │ │paths     │ │rockets   ││
│  └──────────┘ └──────────┘ └──────────┘│
│  ┌──────────────────────────────────────┤
│  │         controls.js                  │
│  │  Camera, UI overlay, tooltips        │
│  └──────────────────────────────────────┤
└─────────────────────────────────────────┘
```

---

## Requirements

- Node.js (16+)
- A modern browser (Chrome, Firefox, Safari, Edge)
- A git repository to visualize

---

## FAQ

**Q: How many files can it handle?**
A: Tested with 5000+ files at 60fps. Uses InstancedMesh and geometry merging for performance.

**Q: Does it work with non-JavaScript projects?**
A: Yes. Supports TypeScript, Python, Rust, Go, Java, Ruby, PHP, Swift, C/C++, and more.

**Q: Can I share my city?**
A: Screenshot it! The dark theme with glowing buildings makes great social media content.

**Q: Does it need a build step?**
A: No. Three.js is loaded from CDN via import maps. Just run the server.

---

## Also By Me

- **[Cost Guardian](https://github.com/Manavarya09/cost-guardian)** — Real-time cost tracking for Claude Code
- **[Team Brain](https://github.com/Manavarya09/team-brain)** — Git-native shared AI memory for teams

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

**See your code. Like never before.**
