export function snap(v, step) {
  if (!step || step <= 0) return v;
  const r = Math.round(v / step) * step;
  return Math.abs(r) < 1e-9 ? 0 : Number(r.toFixed(6));
}
export function snapVec(p, step) { return { x: snap(p.x, step), y: snap(p.y, step), z: snap(p.z, step) }; }
export function snapAngle(deg, step = 15) { return snap(deg, step); }
