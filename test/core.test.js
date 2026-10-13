import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { snap, snapVec, snapAngle } from '../src/grid.js';
import { t, setLang, strings } from '../src/i18n.js';
import { makeShape, SHAPES } from '../src/shapes.js';
import { groupMeshes } from '../src/csg.js';
import { exportSTL } from '../src/stl.js';
describe('grid', () => {
  it('snaps', () => { expect(snap(7.4, 5)).toBe(5); expect(snap(-2.6, 5)).toBe(-5); expect(snap(3.3, 0)).toBe(3.3); expect(snapAngle(50)).toBe(45); expect(snapVec({ x: 1.2, y: 0.4, z: 9.9 }, 1)).toEqual({ x: 1, y: 0, z: 10 }); });
});
describe('i18n', () => {
  it('has same keys in nb and en', () => { expect(Object.keys(strings.nb).sort()).toEqual(Object.keys(strings.en).sort()); });
  it('switches', () => { setLang('en'); expect(t('hole')).toBe('Hole'); setLang('nb'); expect(t('hole')).toBe('Hull'); });
});
describe('shapes + CSG + STL', () => {
  it('all shapes sit on the workplane', () => {
    for (const s of SHAPES) { const m = makeShape(s); m.geometry.computeBoundingBox(); expect(Math.abs(m.geometry.boundingBox.min.y)).toBeLessThan(1e-6); }
  });
  it('hole subtracts volume', () => {
    const box = makeShape('box');
    const hole = makeShape('cylinder', { hole: true }); hole.scale.set(0.5, 1.5, 0.5); hole.position.y = -5;
    const g = groupMeshes([box, hole]);
    const vol = (geo) => { const p = geo.attributes.position, idx = geo.index; let v = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(); const n = idx ? idx.count : p.count; for (let i = 0; i < n; i += 3) { const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2; a.fromBufferAttribute(p, i0); b.fromBufferAttribute(p, i1); c.fromBufferAttribute(p, i2); v += a.dot(b.clone().cross(c)) / 6; } return Math.abs(v); };
    const v = vol(g.geometry);
    const expected = 8000 - Math.PI * 25 * 20;
    expect(Math.abs(v - expected) / expected).toBeLessThan(0.02);
  });
  it('exports ASCII STL with solids only', () => {
    const stl = exportSTL([makeShape('box'), makeShape('sphere', { hole: true })]);
    expect(stl.startsWith('solid')).toBe(true);
    expect((stl.match(/facet normal/g) || []).length).toBe(12);
  });
});
