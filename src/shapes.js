import * as THREE from 'three';
export const SHAPES = ['box', 'cylinder', 'sphere', 'cone', 'torus'];
export function makeGeometry(type) {
  switch (type) {
    case 'box': return new THREE.BoxGeometry(20, 20, 20);
    case 'cylinder': return new THREE.CylinderGeometry(10, 10, 20, 48);
    case 'sphere': return new THREE.SphereGeometry(10, 48, 24);
    case 'cone': return new THREE.ConeGeometry(10, 20, 48);
    case 'torus': return new THREE.TorusGeometry(8, 3, 24, 64).rotateX(Math.PI / 2);
    default: throw new Error('Unknown shape ' + type);
  }
}
const SOLID_COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22];
let ci = 0;
export function solidMaterial(color) {
  return new THREE.MeshStandardMaterial({ color: color ?? SOLID_COLORS[ci++ % SOLID_COLORS.length] });
}
export function holeMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.4, depthWrite: false });
}
export function makeShape(type, { hole = false } = {}) {
  const geo = makeGeometry(type);
  geo.computeBoundingBox();
  // sit on the workplane: shift geometry so min y = 0
  geo.translate(0, -geo.boundingBox.min.y, 0);
  const mesh = new THREE.Mesh(geo, hole ? holeMaterial() : solidMaterial());
  mesh.userData = { type, hole };
  return mesh;
}
export function setHole(mesh, hole) {
  mesh.userData.hole = hole;
  const color = mesh.userData.solidColor ?? mesh.material.color.getHex();
  if (!hole) mesh.userData.solidColor = undefined;
  if (hole) mesh.userData.solidColor = mesh.material.color.getHex();
  mesh.material = hole ? holeMaterial() : solidMaterial(color);
}
