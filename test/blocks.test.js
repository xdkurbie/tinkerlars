import { describe, it, expect } from 'vitest';
import * as Blockly from 'blockly/core';
import { defineBlocks, toArduino, runProgram, STARTER } from '../src/blocks.js';
defineBlocks();
const ws = () => { const w = new Blockly.Workspace(); Blockly.serialization.workspaces.load(STARTER, w); return w; };
describe('code blocks', () => {
  it('generates Arduino blink sketch', () => {
    const code = toArduino(ws());
    expect(code).toContain('void setup() {\n  pinMode(13, OUTPUT);\n}');
    expect(code).toMatch(/digitalWrite\(13, HIGH\);\n  delay\(500\);\n  digitalWrite\(13, LOW\);/);
  });
  it('runs blink in the simulator', async () => {
    const log = [];
    const p = runProgram(ws(), { pinMode: () => {}, digitalRead: () => 0, digitalWrite: (pin, v) => log.push(pin + '=' + v), delay: async () => { if (log.length >= 4) p.stop(); } });
    await p.done;
    expect(log.slice(0, 4)).toEqual(['D13=1', 'D13=0', 'D13=1', 'D13=0'].slice(0, 4));
  });
});
