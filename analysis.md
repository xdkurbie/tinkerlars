# Tinkercad: a high-level study of public information

This is the background study for TinkerLARS. The only sources were Tinkercad's public landing page (one ordinary HTTP GET of https://www.tinkercad.com/ on 2026-10-13, looking at the script and meta tags) and what's publicly known about how the product works. No Autodesk code, assets, icons or styling was downloaded or reused, and nothing was deobfuscated. "Observed" means I saw it in the public HTML. "Public knowledge / inferred" means it comes from docs, the product UI or general knowledge, and is not verified in their code.

## Tech stack
- **Observed:** The landing page loads ES-module bundles at `.../js/tinkercad-frontend/browser/polyfills.js` and `main.js`. That `browser/polyfills + main` layout is what the Angular CLI (application builder) produces, so the marketing and dashboard front end is probably Angular. The page also loads `webgl_check.js` / `webgl_utils.js` (a WebGL capability check before the editor starts), a `featureFlagsBundle.js` and a `nativeBridgeBundle.js` (probably for the iPad/desktop app wrapper), and reCAPTCHA. The editor assets come from a separate host (`editor.tinkercad.com/assets_v2_…`) with content-hashed paths.
- **Inferred:** The 3D editor renders with WebGL. Geometry is processed on the server (Autodesk's own geometry kernel) for exact CSG and export. The client shows tessellated meshes.

## UI concepts (public product behaviour)
- A **workplane** with a mm grid and a "Snap Grid" setting (off / 0.1 / 0.5 / 1 / 2 / 5 … mm). There's a view cube and orbit controls.
- A **shape panel** on the right. You drag basic shapes onto the workplane. Every shape has a parametric inspector with a **Solid (colour) / Hole** toggle.
- **Manipulation:** corner and side handles scale, arc handles rotate in snapped steps, and a cone handle lifts the shape on Z. Shapes drop onto the workplane, and there are align and mirror tools.
- **Group** combines the selected objects. Solids are unioned and holes are subtracted. That is constructive solid geometry hidden behind one button. Ungroup restores the parts, so the CSG tree stays non-destructive.
- **Export:** STL / OBJ / SVG. You can also send to 3D-print services.

## Circuits (public product behaviour)
- A breadboard canvas with a component library: Arduino Uno R3, micro:bit, resistors, LEDs, buttons, potentiometers, sensors, motors and more. You draw wires by clicking pins.
- **Simulation:** Arduino code (blocks or text) runs in an emulated MCU, and an analog circuit solver runs alongside it. LEDs light up, a multimeter reads values, and over-current components show warnings. Breadboard rows are internally connected nets.
- **Code panel:** Blocks, Blocks + Text, or Text. The block editor generates Arduino C++, and the serial monitor shows output.

## Code blocks
- The block editor works like Blockly/Scratch: typed sockets (boolean, number) and statement stacks. Each block maps to a code template. (I can't confirm which library they use, and it doesn't matter for this project.) "Codeblocks" for 3D is a separate product mode that generates geometry from blocks.

## How TinkerLARS does it (all original, all open source)
| Concept | TinkerLARS v0.1 |
|---|---|
| Rendering | three.js WebGL, OrbitControls, TransformControls |
| Snap grid | Our own `snap()` plus TransformControls snapping (mm, 15°) |
| Solid/Hole + Group | `three-bvh-csg` in the browser (union of solids, minus holes). This is destructive: no ungroup yet |
| Export | three.js STLExporter, rotated to Z-up |
| Circuits | Our own nodal-analysis DC solver (pins as Norton sources, LED as a piecewise-linear 2 V/10 Ω model, buttons as switches) |
| MCU | No emulation. Blockly blocks compile to JS that drives the pin states, and the same blocks generate Arduino C++ |
| UI | Vanilla JS + Vite, our own CSS and name/logo text, nb/en strings |

Possible next steps: drag-and-drop circuit editing, a save/load scene file, ungroup (keeping the CSG tree), AVR emulation with the open-source `avr8js` so typed C++ can run, and moving manifold-3d CSG into a web worker.
