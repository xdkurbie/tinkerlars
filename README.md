# TinkerLARS

An original, open-source browser app for **3D design, simple circuits and code blocks**, made as a Vg3 Datateknologi project. It's inspired by the *idea* of beginner CAD tools like Tinkercad, but every line is written from scratch on open-source libraries. It is not affiliated with Autodesk.

*Norsk:* En nettleser-app for 3D-modellering, enkle kretser og kodeblokker. Grensesnittet finnes på norsk og engelsk.

## Features (v0.1)
- **3D design:** box, cylinder, sphere, cone, torus. Move, rotate and scale with gizmos (`g` / `r` / `s`) or with number fields. Snap grid (0–10 mm, 15° rotation steps). **Solid/Hole** toggle, and **Group** runs CSG (union of solids minus holes) with [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg). Duplicate, delete, and **binary STL export** (Z-up, mm).
- **Circuits:** Arduino Uno pins D2–D13, 5V, GND and 30 breadboard rows. Resistors, LEDs, push buttons (hold to press) and wires. A small DC nodal-analysis solver shows LED on/off, current in mA, and burnt LEDs (>30 mA).
- **Code blocks:** [Blockly](https://developers.google.com/blockly) blocks (setup/loop, pinMode, digitalWrite/Read, delay, repeat, if/else, not). They generate Arduino C++ and also run in the simulator, so the blink example lights the LED.
- Norwegian/English UI. Blocks are saved in localStorage.

## Develop
```bash
npm ci
npm run dev      # http://localhost:5173
npm test         # vitest unit tests
npm run build    # dist/
```
Headless smoke test (optional): install `puppeteer-core` separately, run `npm run preview`, then run `node test/smoke.mjs`.

## Limitations
3D scenes are not saved yet. Shift-click multi-select is the only way to pick shapes for grouping. The circuit solver is DC/steady-state only, and LEDs use a simple 2 V / 10 Ω model. Circuit components are placed with dropdowns, not by dragging.

## Licence
MIT
