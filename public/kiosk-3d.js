// Local OBJ + its artwork, using the existing Three.js core dependency.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function kioskFrame(progress) {
  const ease = (a, b) => { const t = Math.max(0, Math.min(1, (progress - a) / (b - a))); return t * t * (3 - 2 * t); };
  return { scale: 1.6 - .95 * ease(0, .65), rotation: -.35 + 1.25 * ease(0, .8), dissolve: ease(.48, .92), title: 1 - ease(.03, .24), caption: ease(.84, 1) };
}

function parseObj(text, materials) {
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
  const intro = stage.closest('.kiosk-intro');
  let renderer;
  try {
    const read = url => fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.text(); });
    const [obj, mtl] = await Promise.all([read('/models/kiosk.obj'), read('/models/kiosk.mtl')]);
    const materials = {}, textures = [], loader = new THREE.TextureLoader();
    const dissolve = { value: 0 };
    let current;
    // Both the shell and the particles use this same surface threshold.
    const threshold = 'clamp((position.y + 2.3) / 4.7 * .75 + .25 * fract(sin(dot(floor(position * 18.0), vec3(12.9898,78.233,45.164))) * 43758.5453), .001, .999)';
    for (const line of mtl.split('\n')) {
      const [kind, ...values] = line.trim().split(/\s+/);
      if (kind === 'newmtl') {
        current = materials[values[0]] = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.62, metalness:.08 });
        current.onBeforeCompile = shader => {
          shader.uniforms.uDissolve = dissolve;
          shader.vertexShader = 'varying float vThreshold;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvThreshold = ' + threshold + ';');
          shader.fragmentShader = 'uniform float uDissolve; varying float vThreshold;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vThreshold < uDissolve) discard;');
        };
      }
      if (kind === 'Kd') current.color.setRGB(...values.map(Number));
      if (kind === 'map_Kd') {
        const material = current;
        textures.push(loader.loadAsync('/models/' + values.join(' ')).then(texture => { texture.colorSpace = THREE.SRGBColorSpace; material.map = texture; material.color.set(0xffffff); }));
      }
    }
    await Promise.all(textures);
    const model = parseObj(obj, materials);
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    model.position.copy(center).negate();
    const pivot = new THREE.Group(); pivot.add(model);
    const scene = new THREE.Scene(); scene.add(pivot);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa9b9df, 2.4));
    const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(4, 6, 8); scene.add(light);
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.domElement.className = 'qk-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.prepend(renderer.domElement);

    // Sample the actual triangle surfaces by area so particles trace the kiosk.
    const triangles = []; let area = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    model.children.forEach(mesh => {
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
        area += new THREE.Triangle(a, b, c).getArea();
        triangles.push({ a:a.clone(), b:b.clone(), c:c.clone(), area });
      }
    });
    const positions = [], seeds = [];
    for (let i = 0; i < 2400; i++) {
      const sample = Math.random() * area, triangle = triangles.find(t => t.area >= sample);
      const u = Math.sqrt(Math.random()), v = Math.random();
      a.copy(triangle.a).multiplyScalar(1 - u).addScaledVector(triangle.b, u * (1 - v)).addScaledVector(triangle.c, u * v);
      positions.push(a.x, a.y, a.z); seeds.push(Math.random());
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('seed', new THREE.Float32BufferAttribute(seeds, 1));
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms:{ uDissolve:dissolve, uPixelRatio:{value:renderer.getPixelRatio()} }, transparent:true, depthWrite:false,
      vertexShader:`attribute float seed; uniform float uDissolve; uniform float uPixelRatio; varying float vAlpha; varying float vSeed;
        void main() {
          float threshold = ${threshold};
          float age = max(0.0, uDissolve - threshold);
          vAlpha = step(threshold, uDissolve) * (1.0 - smoothstep(0.0, .35, age)) * (1.0 - smoothstep(.87, 1.0, uDissolve));
          vSeed = seed;
          vec3 drift = vec3(sin(seed*45.0)*3.0, 1.0+seed*3.0, cos(seed*30.0)*2.0);
          vec4 mv = modelViewMatrix * vec4(position + drift * age * 5.0, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp((2.0+seed*2.0) * uPixelRatio * 9.0 / -mv.z, 1.0, 8.0);
        }`,
      fragmentShader:`varying float vAlpha; varying float vSeed;
        void main() {
          float dotAlpha = 1.0 - smoothstep(.25,.5,length(gl_PointCoord-.5));
          if(vAlpha < .01) discard;
          gl_FragColor = vec4(mix(vec3(.09,.27,.88),vec3(1.0,.42,0.0),step(.83,vSeed)),dotAlpha*vAlpha);
        }`
    });
    const particles = new THREE.Points(geometry, particleMaterial);
    particles.position.copy(model.position); particles.frustumCulled = false; pivot.add(particles);
    const title = intro.querySelector('.kiosk-title'), caption = intro.querySelector('.kiosk-caption');
    let progress = 0, target = 0, frameId = 0, lastTime = 0, failed = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function render(now) {
      frameId = 0;
      const dt = Math.min(50, now - (lastTime || now)); lastTime = now;
      const previous = progress;
      progress += (target - progress) * (1 - Math.exp(-dt / 75));
      if (Math.abs(target - progress) < .0001) progress = target;
      const f = kioskFrame(progress);
      pivot.scale.setScalar(f.scale); pivot.rotation.set(.05 * Math.sin(progress * Math.PI), f.rotation, -.04 * Math.sin(progress * Math.PI));
      pivot.position.set((camera.aspect > 1.1 ? 1.65 : .15) * (1 - Math.min(1, progress * 2)), (camera.aspect > 1.1 ? -.4 : -1.15) * (1 - progress), 0);
      dissolve.value = f.dissolve;
      title.style.opacity = f.title; title.style.transform = `translateY(${-progress * 120}px)`;
      caption.style.opacity = f.caption;
      renderer.domElement.style.filter = `blur(${Math.min(2.5, Math.abs(progress - previous) * 110).toFixed(2)}px)`;
      renderer.render(scene, camera);
      if (progress !== target) frameId = requestAnimationFrame(render);
    }
    function update() {
      if (failed || document.hidden || reduced.matches) return;
      const rect = intro.getBoundingClientRect();
      target = Math.max(0, Math.min(1, -rect.top / Math.max(1, intro.offsetHeight - stage.clientHeight)));
      if (!frameId) { lastTime = 0; frameId = requestAnimationFrame(render); }
    }
    function resize() {
      if (failed) return;
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.set(0, .4, camera.aspect < 1 ? 14 : 11); camera.lookAt(0, .2, 0); camera.updateProjectionMatrix(); update();
    }
    // Expand the scroll section only after a successful first GPU frame.
    resize(); renderer.render(scene, camera); intro.classList.add('is-3d'); resize();
    addEventListener('scroll', update, {passive:true});
    new ResizeObserver(resize).observe(stage);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frameId); frameId=0; } else update(); });
    reduced.addEventListener('change', () => {
      intro.classList.toggle('is-3d', !reduced.matches); renderer.domElement.hidden = reduced.matches;
      if (reduced.matches) { cancelAnimationFrame(frameId); frameId=0; title.style.opacity=1; } else resize();
    });
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); failed = true; cancelAnimationFrame(frameId); intro.classList.remove('is-3d'); renderer.domElement.remove(); title.style.opacity=1; title.style.transform=''; caption.style.opacity=0; });
  } catch (error) {
    intro.classList.remove('is-3d'); renderer?.domElement.remove(); renderer?.dispose();
    console.warn('Kiosk preview unavailable; showing its image.', error);
  }
}
boot();
