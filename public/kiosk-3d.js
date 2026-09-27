// Kiosk 3D hero: Three.js core only (no addons — tiny local OBJ/MTL
// parser below, since our model is flat-shaded with no textures).
// Fails soft: the PNG fallback underneath stays visible.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

function parseMtl(text) {
  const mats = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('newmtl ')) { cur = t.slice(7).trim(); mats[cur] = { color: [0.7, 0.7, 0.7], textured: false }; }
    else if (cur && t.startsWith('Kd ')) {
      const p = t.split(/\s+/).slice(1, 4).map(Number);
      if (p.every(Number.isFinite)) mats[cur].color = p;
    } else if (cur && t.startsWith('map_Kd')) { mats[cur].textured = true; }
  }
  return mats;
}

function parseObj(text, mats) {
  const group = new THREE.Group();
  const verts = [];
  let mat = new THREE.MeshStandardMaterial({ color: 0x1746e0, roughness: 0.55, metalness: 0.1 });
  let pos = [];
  const flush = () => {
    if (pos.length < 9) { pos = []; return; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    group.add(new THREE.Mesh(g, mat));
    pos = [];
  };
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('v ')) {
      const p = t.split(/\s+/).slice(1, 4).map(Number);
      if (p.every(Number.isFinite)) verts.push(p);
    } else if (t.startsWith('usemtl ')) {
      flush();
      const m = mats[t.slice(7).trim()];
      // Textured decal faces have no image on the web path — render them
      // clean white so the kiosk reads white + brand blue, like the mock.
      const c = (m && m.textured) ? [1, 1, 1] : (m ? m.color : [0.09, 0.27, 0.88]);
      mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(c[0], c[1], c[2]), roughness: 0.55, metalness: 0.1 });
    } else if (t.startsWith('f ')) {
      const idx = t.split(/\s+/).slice(1).map((v) => parseInt(v.split('/')[0], 10) - 1);
      for (let k = 1; k < idx.length - 1; k++) {
        for (const j of [idx[0], idx[k], idx[k + 1]]) {
          if (verts[j]) pos.push(verts[j][0], verts[j][1], verts[j][2]);
        }
      }
    }
  }
  flush();
  return group;
}

async function boot() {
  const stage = document.getElementById('qk-stage');
  if (!stage || typeof WebGLRenderingContext === 'undefined') return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const [objText, mtlText] = await Promise.all([
      fetch('/models/kiosk.obj').then((r) => { if (!r.ok) throw new Error('obj'); return r.text(); }),
      fetch('/models/kiosk.mtl').then((r) => { if (!r.ok) throw new Error('mtl'); return r.text(); })
    ]);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.className = 'qk-canvas';
    stage.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8ff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x74a4ff, 0.7);
    rim.position.set(-5, 2, -4);
    scene.add(rim);
    const model = parseObj(objText, parseMtl(mtlText));
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    const fit = Math.max(size.x, size.y) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(fit * 0.55, fit * 0.35, fit * 1.9);
    camera.lookAt(0, 0, 0);
    const place = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    place();
    window.addEventListener('resize', place);
    let mx = 0, my = 0;
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.35;
      my = (e.clientY / window.innerHeight - 0.5) * 0.2;
    }, { passive: true });
    const t0 = performance.now();
    let first = true;
    renderer.setAnimationLoop(() => {
      const t = (performance.now() - t0) / 1000;
      if (!reduce) {
        pivot.rotation.y = 0.55 + Math.sin(t * 0.35) * 0.4 + mx;
        pivot.rotation.x = my * 0.6;
        pivot.position.y = Math.sin(t * 0.9) * 0.08;
      } else {
        pivot.rotation.y = 0.55;
      }
      renderer.render(scene, camera);
      if (first) {
        first = false;
        const fb = stage.querySelector('.qk-fallback');
        if (fb) fb.style.display = 'none';
      }
    });
  } catch (e) {
    if (window.console && console.warn) console.warn('kiosk 3d off, PNG fallback stays:', e && e.message);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
