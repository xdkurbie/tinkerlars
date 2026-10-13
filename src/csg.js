import * as THREE from 'three';
import { Brush, Evaluator, ADDITION, SUBTRACTION } from 'three-bvh-csg';
import { solidMaterial } from './shapes.js';

function toBrush(mesh) {
  mesh.updateMatrixWorld(true);
  const g = mesh.geometry.clone();
  g.applyMatrix4(mesh.matrixWorld);
  // three-bvh-csg needs matching attributes; keep position+normal(+uv)
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  const b = new Brush(g);
  b.updateMatrixWorld();
  return b;
}

/** Union all solids, subtract all holes. Returns a new mesh with identity transform. */
export function groupMeshes(meshes) {
  const solids = meshes.filter(m => !m.userData.hole);
  const holes = meshes.filter(m => m.userData.hole);
  if (!solids.length) throw new Error('Group needs at least one solid');
  const ev = new Evaluator();
  ev.useGroups = false;
  let acc = toBrush(solids[0]);
  for (const s of solids.slice(1)) acc = ev.evaluate(acc, toBrush(s), ADDITION);
  for (const h of holes) acc = ev.evaluate(acc, toBrush(h), SUBTRACTION);
  const geo = acc.geometry;
  geo.computeVertexNormals();
  const out = new THREE.Mesh(geo, solidMaterial(solids[0].material.color.getHex()));
  out.userData = { type: 'group', hole: false };
  return out;
}
