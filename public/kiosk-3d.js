// Local OBJ + its artwork, using the existing Three.js core dependency.

// A contained product view: pointer travel gives a gentle quarter turn.
export function kioskFrame(progress) {
  return { scale:1, rotation:-.75 + Math.max(0, Math.min(1, progress)) * .5 };
}

function parseObj(text, materials, THREE) {
  const model = new THREE.Group(), vertices = [], uvs = [];
  let positions = [], coords = [], material = materials['Material.001'];
  function flush() {
    if (!positions.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(coords, 2));
    geometry.computeVertexNormals();
    model.add(new THREE.Mesh(geometry, material));
    positions = []; coords = [];
  }
  for (const line of text.split('\n')) {
    const [kind, ...data] = line.trim().split(/\s+/);
    if (kind === 'v') vertices.push(data.map(Number));
    if (kind === 'vt') uvs.push(data.map(Number));
    if (kind === 'usemtl') { flush(); material = materials[data[0]]; }
    if (kind === 'f') for (let i = 1; i < data.length - 1; i++) {
      for (const corner of [data[0], data[i], data[i + 1]]) {
        const [v, uv] = corner.split('/').map(Number);
        positions.push(...vertices[v > 0 ? v - 1 : vertices.length + v]);
        coords.push(...(uvs[uv > 0 ? uv - 1 : uvs.length + uv] || [0, 0]).slice(0, 2));
      }
    }
  }
  flush();
  return model;
}

async function boot() {
  const stage = document.getElementById('qk-stage');
  if (!stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.connection?.saveData || /^(slow-2g|2g|3g)$/.test(navigator.connection?.effectiveType || '')) return;
  // Never let intrinsic canvas dimensions drive the layout if the stylesheet fails.
  if (getComputedStyle(stage).position !== 'absolute') return;
  // Load the product renderer and artwork only when their section is nearby.
  if (window.IntersectionObserver) await new Promise(resolve => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); resolve(); }
    }, { rootMargin:'240px' });
    observer.observe(stage);
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const intro = stage.closest('.kiosk-intro');
  let renderer;
  try {
    const THREE = await import('/vendor/three-0.160.0.module.js');
    const read = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.text(); });
    const [obj, mtl] = await Promise.all([read('/models/kiosk.obj'), read('/models/kiosk.mtl')]);
    const materials = {}, textures = [], loader = new THREE.TextureLoader();
    let current, materialName;
    for (const line of mtl.split('\n')) {
      const [kind, ...values] = line.trim().split(/\s+/);
      if (kind === 'newmtl') {
        materialName = values[0];
        current = materials[materialName] = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.85, metalness:0 });
      }
      if (kind === 'Kd') current.color.setRGB(...values.map(Number));
      if (kind === 'map_Kd') {
        // Printed artwork should retain its source colours, independent of studio lights.
        const material = materials[materialName] = new THREE.MeshBasicMaterial({ toneMapped:false });
        textures.push(loader.loadAsync('/models/' + values.join(' ')).then(texture => { texture.colorSpace = THREE.SRGBColorSpace; material.map = texture; material.color.set(0xffffff); }));
      }
    }
    await Promise.all(textures);
    const model = parseObj(obj, materials, THREE);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
    model.position.copy(center).negate();
    const pivot = new THREE.Group(); pivot.add(model);
    const scene = new THREE.Scene(); scene.add(pivot);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8392b0, .8));
    const light = new THREE.DirectionalLight(0xffffff, 1.4); light.position.set(-3, 7, 5); light.castShadow = true; light.shadow.mapSize.set(512,512); light.shadow.radius = 4; light.shadow.normalBias = .025; scene.add(light);
    model.children.forEach(mesh => { mesh.castShadow = true; });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(radius * 4, radius * 4), new THREE.ShadowMaterial({ opacity:.1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -bounds.getSize(new THREE.Vector3()).y / 2; ground.receiveShadow = true; scene.add(ground);
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.domElement.className = 'qk-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.prepend(renderer.domElement);

    let progress = .5, target = .5, frameId = 0, lastTime = 0, failed = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function render(now) {
      frameId = 0;
      const dt = Math.min(50, now - (lastTime || now)); lastTime = now;
      progress += (target - progress) * (1 - Math.exp(-dt / 90));
      if (Math.abs(target - progress) < .0001) progress = target;
      const frame = kioskFrame(progress);
      pivot.scale.setScalar(frame.scale); pivot.rotation.y = frame.rotation;
      renderer.render(scene, camera);
      if (progress !== target) frameId = requestAnimationFrame(render);
    }
    function update() {
      if (failed || document.hidden || reduced.matches) return;
      if (!frameId) { lastTime = 0; frameId = requestAnimationFrame(render); }
    }
    let lastWidth = 0, lastHeight = 0;
    function resize() {
      if (failed) return;
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h || (w === lastWidth && h === lastHeight)) return;
      lastWidth = w; lastHeight = h;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const halfFov = Math.atan(Math.tan(camera.fov * Math.PI / 360) * Math.min(1, camera.aspect));
      camera.position.set(0, radius * .15, radius * kioskFrame(0).scale / Math.sin(halfFov) * 1.03);
      camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); update();
    }
    // Loading swaps only the artwork; section geometry and scroll position stay fixed.
    resize(); render(performance.now()); intro.classList.add('is-3d');
    new ResizeObserver(resize).observe(stage);
    intro.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = intro.getBoundingClientRect(); target = (event.clientX - rect.left) / rect.width; update();
    });
    intro.addEventListener('pointerleave', () => { target = .5; update(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frameId); frameId=0; } else update(); });
    reduced.addEventListener('change', () => {
      intro.classList.toggle('is-3d', !reduced.matches); renderer.domElement.hidden = reduced.matches;
      if (reduced.matches) { cancelAnimationFrame(frameId); frameId=0; } else { resize(); update(); }
    });
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); failed = true; cancelAnimationFrame(frameId); intro.classList.remove('is-3d'); renderer.domElement.remove(); });
  } catch (error) {
    intro.classList.remove('is-3d'); renderer?.domElement.remove(); renderer?.dispose();
    console.warn('Kiosk preview unavailable; showing its image.', error);
  }
}
boot();
