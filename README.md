## Geometric Jumper — Browser Game

Brief: Fast-paced procedural runner with simple controls and juicy visuals/audio.

How to run
- Open `index.html` in a modern browser (desktop or mobile).
- No build step required; the game uses ES modules directly.

Controls
- Click / Tap / Space: Jump
- Hold Left Mouse / Hold Touch: Auto-jump (jumps on each landing)
- Right click / Menu icon / Esc: Pause
- Full Screen: use the "Full Screen" button in pause or end-level menu

Project structure
- `index.html`: entry HTML, mounts canvas and UI overlays, loads `js/main.js` (module)
- `css/style.css`: layout, overlays, menus, typography
- `assets/`: PNG image assets organized by category
  - `player/`: player character sprites
  - `collectibles/`: collectible items and modifiers
  - `platforms/`: platform graphics
  - `backgrounds/`: parallax background elements
- `js/` modules:
  - `main.js`: bootstraps systems, game loop, level flow
  - `constants.js`: gameplay constants
  - `assetLoader.js`: PNG asset loading system with fallback
  - `renderer.js`: camera-aware rendering, pre-rendered platforms, parallax, player/portal draw
  - `physics.js`: game state machine, time scale, collisions, respawn, scoring
  - `player.js`: player state/controls/physics integration
  - `levelGenerator.js`: procedural platforms, collectibles, parallax sets, portal
  - `camera.js`: camera target/smoothing, respawn panning
  - `input.js`: keyboard/mouse/touch, pause toggling, auto-jump
  - `ui.js`: HUD, menus, transitions
  - `audio/`:
    - `audio.js`: sfx/music control
    - `audio/sfx.js`: sound effects
    - `audio/music/proceduralMusic.js`: music generation via Tone.js
  - `collectibles.js`: collectibles logic and modifiers
- `generate_assets.html`: tool for generating basic PNG assets
- `ASSETS.md`: detailed documentation for the asset system

Tech stack
- Canvas 2D, ES Modules, Tone.js for audio, PNG asset system with fallback.

Development
- Open `index.html` with a local server for better module/file access (optional).
- Recommended: VSCode + Live Server; or `python -m http.server`.

Notes
- Mobile friendly; responsive canvas with 16:9 aspect.
- Procedural levels, escalating difficulty, per-level scoring, bonuses.
- Normalized player speed by canvas width to keep pace consistent across devices.
- PNG asset system with automatic fallback to programmatic graphics.
- Asset generation tool included for creating custom graphics.

Asset System
- Use `generate_assets.html` to create basic PNG assets
- Place custom PNG files in the `assets/` folder structure
- System automatically falls back to programmatic graphics if assets are missing
- See `ASSETS.md` for detailed documentation

