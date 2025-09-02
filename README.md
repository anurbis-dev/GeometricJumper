## Geometric Jumper — Browser Game

Brief: Fast-paced procedural runner with simple controls and juicy visuals/audio.

How to run
- Open `index.html` in a modern browser (desktop or mobile).
- No build step required; the game uses ES modules directly.

Controls
- Click / Tap / Space: Jump
- Right click / Menu icon / Esc: Pause
- Two-finger pinch: Enter/exit fullscreen

Project structure
- `index.html`: entry HTML, mounts canvas and UI overlays, loads `js/main.js` (module)
- `css/style.css`: layout, overlays, menus, typography
- `js/` modules:
  - `main.js`: bootstraps systems, game loop, level flow
  - `constants.js`: gameplay constants
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

Tech stack
- Canvas 2D, ES Modules, Tone.js for audio.

Development
- Open `index.html` with a local server for better module/file access (optional).
- Recommended: VSCode + Live Server; or `python -m http.server`.

Notes
- Mobile friendly; responsive canvas with 16:9 aspect.
- Procedural levels, escalating difficulty, per-level scoring, bonuses.

