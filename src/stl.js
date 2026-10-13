import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
/** Export only solid meshes (holes are ignored), Y-up scene converted to Z-up for printers. */
export function exportSTL(meshes, binary = false) {
  const root = new THREE.Group();
  root.rotation.x = Math.PI / 2;
  for (const m of meshes) if (!m.userData.hole) root.add(m.clone());
  root.updateMatrixWorld(true);
  return new STLExporter().parse(root, { binary });
}
