import { describe, it, expect } from 'vitest';
import { solve } from '../src/circuit.js';
const blink = (r = 220) => [
  { id: 'r1', type: 'resistor', a: 'D13', b: 'row1', ohms: r },
  { id: 'l1', type: 'led', a: 'row1', b: 'GND' },
];
describe('circuit solver', () => {
  it('LED lights when pin HIGH through 220Ω', () => {
    const s = solve(blink(), { D13: 1 });
    expect(s.leds.l1.on).toBe(true);
    expect(s.leds.l1.mA).toBeGreaterThan(10);
    expect(s.leds.l1.mA).toBeLessThan(15);
    expect(s.leds.l1.burnt).toBe(false);
  });
  it('LED off when pin LOW', () => { expect(solve(blink(), { D13: 0 }).leds.l1.on).toBe(false); });
  it('LED without resistor burns', () => { expect(solve(blink(0.001), { D13: 1 }).leds.l1.burnt).toBe(true); });
  it('reversed LED stays off', () => {
    const c = [{ id: 'r', type: 'resistor', a: '5V', b: 'row2', ohms: 330 }, { id: 'l', type: 'led', a: 'GND', b: 'row2' }];
    expect(solve(c).leds.l.on).toBe(false);
  });
  it('button with pull-down is read correctly', () => {
    const c = (p) => [
      { id: 'b', type: 'button', a: '5V', b: 'D2', pressed: p },
      { id: 'rp', type: 'resistor', a: 'D2', b: 'GND', ohms: 10000 },
    ];
    expect(solve(c(true)).readPin('D2')).toBe(1);
    expect(solve(c(false)).readPin('D2')).toBe(0);
  });
});
