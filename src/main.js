import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as Blockly from 'blockly/core';
import * as En from 'blockly/msg/en';
import { t, setLang, getLang } from './i18n.js';
import { SHAPES, makeShape, setHole } from './shapes.js';
import { groupMeshes } from './csg.js';
import { exportSTL } from './stl.js';
import { snap } from './grid.js';
import { NODES, ARDUINO_PINS, BREADBOARD_ROWS, solve } from './circuit.js';
import { defineBlocks, toArduino, runProgram, STARTER, TOOLBOX } from './blocks.js';

const $ = (s) => document.querySelector(s);
let state = { lang: localStorage.getItem('tl-lang') || 'nb' };
setLang(state.lang);

// ---------- 3D design ----------
const vp = $('#viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
vp.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe7ee);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
camera.position.set(120, 110, 160);
scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(100, 200, 80); scene.add(sun);
const grid = new THREE.GridHelper(200, 20, 0x5a7a99, 0xa8bccc); scene.add(grid);
const fine = new THREE.GridHelper(200, 200, 0xc4d2dc, 0xc4d2dc); fine.position.y = -0.01; scene.add(fine);
const plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fb7cc, transparent: true, opacity: 0.25 }));
plane.position.y = -0.02; scene.add(plane);
const orbit = new OrbitControls(camera, renderer.domElement);
const tc = new TransformControls(camera, renderer.domElement);
tc.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value; });
tc.addEventListener('objectChange', () => { const o = tc.object; if (o && o.position.y < 0 && tc.mode === 'translate') o.position.y = snap(o.position.y, step()); renderProps(); });
scene.add(tc.getHelper ? tc.getHelper() : tc);

const objects = [];
let selected = [];
const step = () => Number($('#snap').value);
function applySnap() {
  const s = step();
  tc.setTranslationSnap(s || null);
  tc.setRotationSnap(s ? THREE.MathUtils.degToRad(15) : null);
  tc.setScaleSnap(s ? 0.05 : null);
}
$('#snap').onchange = applySnap; applySnap();

function addObject(mesh) {
  mesh.position.x = snap((Math.random() - 0.5) * 60, 10);
  mesh.position.z = snap((Math.random() - 0.5) * 60, 10);
  scene.add(mesh); objects.push(mesh); select([mesh]);
}
function removeObject(m) { scene.remove(m); objects.splice(objects.indexOf(m), 1); }
function select(list) {
  for (const o of objects) o.material.emissive?.setHex(0);
  selected = list;
  for (const o of selected) o.material.emissive?.setHex(0x333300);
  if (selected.length === 1) tc.attach(selected[0]); else tc.detach();
  renderProps();
}
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4 || tc.dragging) return;
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(objects, false)[0]?.object;
  if (!hit) { if (!e.shiftKey) select([]); return; }
  if (e.shiftKey) select(selected.includes(hit) ? selected.filter(o => o !== hit) : [...selected, hit]);
  else select([hit]);
});
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => tc.setMode(b.dataset.mode));
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input,select,textarea,#blockly')) return;
  if (e.key === 'Delete' || e.key === 'Backspace') $('#btn-del').click();
  if (e.key === 'g') tc.setMode('translate'); if (e.key === 'r') tc.setMode('rotate'); if (e.key === 's') tc.setMode('scale');
});
$('#btn-del').onclick = () => { selected.forEach(removeObject); select([]); };
$('#btn-dup').onclick = () => {
  const copies = selected.map(o => { const c = o.clone(); c.material = o.material.clone(); c.userData = { ...o.userData }; c.position.x += 10; scene.add(c); objects.push(c); return c; });
  select(copies);
};
$('#btn-group').onclick = () => {
  if (selected.length < 2) return;
  try {
    const g = groupMeshes(selected);
    selected.forEach(removeObject); scene.add(g); objects.push(g); select([g]);
  } catch (err) { alert(err.message); }
};
$('#btn-stl').onclick = () => {
  const blob = new Blob([exportSTL(objects, true)], { type: 'model/stl' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tinkerlars.stl'; a.click();
};
function renderProps() {
  const el = $('#props');
  if (selected.length !== 1) { el.textContent = selected.length ? `${selected.length} ✓` : t('empty'); return; }
  const o = selected[0];
  const f = (label, get, set) => { const l = document.createElement('label'); l.textContent = label; const i = document.createElement('input'); i.type = 'number'; i.step = 'any'; i.value = Number(get().toFixed(2)); i.onchange = () => { set(Number(i.value)); }; l.append(i); return l; };
  el.replaceChildren(
    f('X', () => o.position.x, v => o.position.x = v), f('Y', () => o.position.y, v => o.position.y = v), f('Z', () => o.position.z, v => o.position.z = v),
    f('°X', () => THREE.MathUtils.radToDeg(o.rotation.x), v => o.rotation.x = THREE.MathUtils.degToRad(v)),
    f('°Y', () => THREE.MathUtils.radToDeg(o.rotation.y), v => o.rotation.y = THREE.MathUtils.degToRad(v)),
    f('°Z', () => THREE.MathUtils.radToDeg(o.rotation.z), v => o.rotation.z = THREE.MathUtils.degToRad(v)),
    f('S×', () => o.scale.x, v => o.scale.x = v), f('S↑', () => o.scale.y, v => o.scale.y = v), f('S⊙', () => o.scale.z, v => o.scale.z = v),
  );
  const row = document.createElement('div'); row.className = 'row';
  for (const h of [false, true]) { const b = document.createElement('button'); b.textContent = t(h ? 'hole' : 'solid'); if (o.userData.hole === h) b.className = 'on'; b.onclick = () => { setHole(o, h); select([o]); }; row.append(b); }
  el.append(row);
}
function resize() { const w = vp.clientWidth, h = vp.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(vp);
renderer.setAnimationLoop(() => { orbit.update(); renderer.render(scene, camera); });

// ---------- Circuits ----------
const comps = [
  { id: 'R1', type: 'resistor', a: 'D13', b: 'row5', ohms: 220 },
  { id: 'L1', type: 'led', a: 'row5', b: 'GND' },
];
let pinOut = {}, sim = null, nextId = 2;
const opt = (sel, items, label = (x) => x) => sel.replaceChildren(...items.map(v => new Option(label(v), v)));
const nodePos = (n) => {
  if (n === 'GND') return [30, 40]; if (n === '5V') return [30, 70];
  const pi = ARDUINO_PINS.indexOf(n); if (pi >= 0) return [70 + pi * 12, 20];
  const ri = BREADBOARD_ROWS.indexOf(n); return [20 + ri * 13, 200];
};
function drawBoard(res) {
  const NS = 'http://www.w3.org/2000/svg', svg = $('#board');
  const el = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; svg.append(e); return e; };
  svg.replaceChildren();
  el('rect', { x: 10, y: 8, width: 230, height: 90, rx: 6, fill: '#1f6f8b' }); el('text', { x: 120, y: 85, fill: '#fff', 'font-size': 12, 'text-anchor': 'middle' }, 'Arduino Uno');
  el('rect', { x: 10, y: 170, width: 400, height: 70, rx: 4, fill: '#fafafa', stroke: '#bbb' }); el('text', { x: 210, y: 235, 'font-size': 10, 'text-anchor': 'middle', fill: '#888' }, 'Breadboard');
  for (const n of NODES) { const [x, y] = nodePos(n); el('circle', { cx: x, cy: y, r: 3, fill: '#333' }); if (!n.startsWith('row') || BREADBOARD_ROWS.indexOf(n) % 5 === 0) el('text', { x, y: y + (n.startsWith('row') ? -6 : 14), 'font-size': 7, 'text-anchor': 'middle', fill: n.startsWith('row') ? '#555' : '#fff' }, n.replace('row', '')); }
  comps.forEach((c, i) => {
    const [x1, y1] = nodePos(c.a), [x2, y2] = nodePos(c.b);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (i % 3) * 8;
    const color = { resistor: '#b5651d', led: '#c0392b', button: '#555', wire: '#2ecc71' }[c.type];
    el('polyline', { points: `${x1},${y1} ${mx},${my} ${x2},${y2}`, fill: 'none', stroke: color, 'stroke-width': 2 });
    if (c.type === 'led') { const s = res?.leds[c.id]; el('circle', { cx: mx, cy: my, r: 7, fill: s?.burnt ? '#222' : s?.on ? '#ff3b30' : '#6b1d1d', stroke: s?.on ? '#ffd0c0' : '#333', 'stroke-width': s?.on ? 3 : 1 }); }
    else if (c.type === 'button') { const b = el('rect', { x: mx - 7, y: my - 7, width: 14, height: 14, fill: c.pressed ? '#e9c46a' : '#999', cursor: 'pointer' }); b.addEventListener('pointerdown', () => { c.pressed = true; update(); }); b.addEventListener('pointerup', () => { c.pressed = false; update(); }); b.addEventListener('pointerleave', () => { if (c.pressed) { c.pressed = false; update(); } }); }
    else if (c.type === 'resistor') el('rect', { x: mx - 8, y: my - 3, width: 16, height: 6, fill: '#e3c08d', stroke: '#8a5a2b' });
    el('text', { x: mx, y: my - 10, 'font-size': 8, 'text-anchor': 'middle' }, c.id);
  });
}
function update() {
  const res = solve(comps, pinOut);
  drawBoard(res);
  $('#c-list').replaceChildren(...comps.map(c => {
    const li = document.createElement('li');
    const s = res.leds[c.id];
    li.textContent = `${c.id}: ${t(c.type)} ${c.a} → ${c.b}${c.type === 'resistor' ? ` ${c.ohms} Ω` : ''}${s ? ` — ${s.on ? t('on') : t('off')} (${s.mA.toFixed(1)} mA ${t('current')})${s.burnt ? ' 🔥' : ''}` : ''}${c.type === 'button' && c.pressed ? ` (${t('pressed')})` : ''}`;
    const del = document.createElement('button'); del.textContent = '✕'; del.onclick = () => { comps.splice(comps.indexOf(c), 1); update(); };
    li.prepend(del); return li;
  }));
  return res;
}
$('#c-add').onclick = () => {
  const type = $('#c-type').value; const prefix = { resistor: 'R', led: 'L', button: 'B', wire: 'W' }[type];
  comps.push({ id: prefix + nextId++, type, a: $('#c-a').value, b: $('#c-b').value, ohms: Number($('#c-val').value) || 220, pressed: false });
  update();
};

// ---------- Blockly ----------
Blockly.setLocale(En);
defineBlocks();
const ws = Blockly.inject('blockly', { toolbox: TOOLBOX, trashcan: true, zoom: { controls: true, startScale: 0.9 } });
Blockly.serialization.workspaces.load(JSON.parse(localStorage.getItem('tl-blocks') || 'null') || STARTER, ws);
const showCode = () => { $('#code').textContent = toArduino(ws); localStorage.setItem('tl-blocks', JSON.stringify(Blockly.serialization.workspaces.save(ws))); };
ws.addChangeListener((e) => { if (!e.isUiEvent) showCode(); });
showCode();
$('#sim').onclick = () => {
  if (sim) { sim.stop(); sim = null; pinOut = {}; update(); renderI18n(); return; }
  pinOut = {};
  sim = runProgram(ws, {
    pinMode: (p, m) => { if (m === 'OUTPUT') pinOut[p] = pinOut[p] ?? 0; else delete pinOut[p]; update(); },
    digitalWrite: (p, v) => { if (p in pinOut) { pinOut[p] = v; update(); } },
    digitalRead: (p) => solve(comps, pinOut).readPin(p),
    delay: (ms) => new Promise(r => setTimeout(r, ms)),
  });
  sim.done.catch(err => { alert(err.message); });
  renderI18n();
};

// ---------- tabs + i18n ----------
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + b.dataset.tab));
  resize(); Blockly.svgResize(ws);
});
function renderI18n() {
  document.documentElement.lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  $('#sim').textContent = t(sim ? 'stop' : 'run');
  const sb = $('#shape-buttons');
  sb.replaceChildren(...SHAPES.map(s => { const b = document.createElement('button'); b.textContent = t(s); b.onclick = () => addObject(makeShape(s)); return b; }),
    (() => { const b = document.createElement('button'); b.textContent = t('hole') + ' ▢'; b.onclick = () => addObject(makeShape('box', { hole: true })); return b; })());
  const ct = $('#c-type').value || 'resistor';
  opt($('#c-type'), ['resistor', 'led', 'button', 'wire'], t); $('#c-type').value = ct;
  if (!$('#c-a').options.length) { opt($('#c-a'), NODES); opt($('#c-b'), NODES); $('#c-a').value = '5V'; $('#c-b').value = 'row1'; }
  renderProps(); update();
}
$('#lang').value = getLang();
$('#lang').onchange = (e) => { setLang(e.target.value); localStorage.setItem('tl-lang', e.target.value); renderI18n(); };
renderI18n();
addObject(makeShape('box'));
window.__tinkerlars = { objects, scene, comps, solve, ws, select };
