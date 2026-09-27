// QwikPrint 3D kiosk module
// Loads the kiosk OBJ/MTL, rotates gently, falls back to PNG if WebGL unavailable

export function register3d() {
  if (!window.THREE) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  const container = document.getElementById('qp-3d-canvas');
  if (!container) return;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Load OBJ + MTL
  const mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('/models/');
  mtlLoader.load('kiosk.mtl', (materials) => {
    materials.preload();
    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('/models/');
    objLoader.load('kiosk.obj', (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          child.material.side = THREE.DoubleSide;
          child.material.depthTest = true;
          child.material.depthWrite = true;
        }
      });
      scene.add(object);

      // Gentle rotation
      object.rotation.y = 0.5;

      // Animate
      const clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        object.rotation.y += delta * 0.5;
        renderer.render(scene, camera);
      }

      animate();

      // Soft fallback: hide 3D, show PNG if error
    }, (xhr) => {
      // Progress
    }, (error) => {
      // Load failed - soft fallback
      console.error('3D model load error, falling back to PNG:', error);
      const fallback = container.querySelector('.qp-fallback');
      if (fallback) fallback.style.display = 'block';
      renderer.domElement.style.display = 'none';
    });
  });
});

// Initialize on load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  register3d();
} else {
  window.addEventListener('load', register3d);
}

// Handle resize
window.addEventListener('resize', () => {
  const cam = camera;
  const ren = renderer;
  if (cam && ren) {
    ren.setSize(window.innerWidth, window.innerHeight);
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
  }
});