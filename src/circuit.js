// Tiny DC circuit solver (nodal analysis) for an Arduino Uno + breadboard.
export const ARDUINO_PINS = ['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'];
export const BREADBOARD_ROWS = Array.from({ length: 30 }, (_, i) => 'row' + (i + 1));
export const NODES = ['GND', '5V', ...ARDUINO_PINS, ...BREADBOARD_ROWS];
export const LED_VF = 2.0, LED_RON = 10, LED_MAX_MA = 30;
const PIN_R = 25, G_OFF = 1e-9, G_LEAK = 1e-7;

function solveLinear(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    const d = A[i][i] || 1e-30;
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / d;
      if (!f) continue;
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
    x[i] = s / (A[i][i] || 1e-30);
  }
  return x;
}

/**
 * @param components [{id,type:'resistor'|'led'|'button'|'wire', a, b, ohms?, pressed?}]
 * @param pinOut  map pin -> 0|1 for pins configured as OUTPUT
 * @returns {voltages, leds:{id:{on,mA,burnt}}, readPin(pin)}
 */
export function solve(components, pinOut = {}) {
  const nodes = NODES.filter(n => n !== 'GND');
  const idx = Object.fromEntries(nodes.map((n, i) => [n, i]));
  let ledOn = Object.fromEntries(components.filter(c => c.type === 'led').map(c => [c.id, false]));
  let V = new Array(nodes.length).fill(0);
  const vOf = (n) => (n === 'GND' ? 0 : V[idx[n]]);
  for (let iter = 0; iter < 50; iter++) {
    const N = nodes.length;
    const A = Array.from({ length: N }, () => new Array(N).fill(0));
    const b = new Array(N).fill(0);
    const G = (n1, n2, g) => {
      const i = idx[n1], j = idx[n2];
      if (i !== undefined) A[i][i] += g;
      if (j !== undefined) A[j][j] += g;
      if (i !== undefined && j !== undefined) { A[i][j] -= g; A[j][i] -= g; }
    };
    const I = (n, cur) => { if (idx[n] !== undefined) b[idx[n]] += cur; }; // current injected into node
    for (const n of nodes) G(n, 'GND', G_LEAK);
    G('5V', 'GND', 1 / 0.1); I('5V', 5 / 0.1);
    for (const [pin, val] of Object.entries(pinOut)) { G(pin, 'GND', 1 / PIN_R); I(pin, (val ? 5 : 0) / PIN_R); }
    for (const c of components) {
      if (c.type === 'resistor') G(c.a, c.b, 1 / Math.max(c.ohms || 1, 1e-3));
      else if (c.type === 'wire') G(c.a, c.b, 1e3);
      else if (c.type === 'button') G(c.a, c.b, c.pressed ? 1e3 : G_OFF);
      else if (c.type === 'led') {
        if (ledOn[c.id]) { const g = 1 / LED_RON; G(c.a, c.b, g); I(c.a, LED_VF * g); I(c.b, -LED_VF * g); }
        else G(c.a, c.b, G_OFF);
      }
    }
    V = solveLinear(A, b);
    let changed = false;
    for (const c of components.filter(c => c.type === 'led')) {
      const vd = vOf(c.a) - vOf(c.b);
      const on = ledOn[c.id] ? vd > LED_VF - 1e-6 : vd > LED_VF;
      if (on !== ledOn[c.id]) { ledOn[c.id] = on; changed = true; }
    }
    if (!changed) break;
  }
  const voltages = Object.fromEntries([['GND', 0], ...nodes.map(n => [n, V[idx[n]]])]);
  const leds = {};
  for (const c of components.filter(c => c.type === 'led')) {
    const vd = voltages[c.a] - voltages[c.b];
    const mA = ledOn[c.id] ? Math.max(0, (vd - LED_VF) / LED_RON) * 1000 : 0;
    leds[c.id] = { on: ledOn[c.id] && mA > 0.5, mA, burnt: mA > LED_MAX_MA };
  }
  return { voltages, leds, readPin: (pin) => (voltages[pin] > 2.5 ? 1 : 0) };
}
