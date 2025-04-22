let scene, camera, renderer, cube, controls;

const objetosEditables = {
  'Frontal': null,
  'Posterior': null,
  'Posterior_placa': null,
  'Faldon_derecho': null,
  'Faldon_izquierdo': null,
  'Lateral_derecho': null,
  'Logo_frontal' : null,
  'Lateral_izquierdo': null,
  'Logo_derecho': null,
  'Logo_izquierdo': null
};

init();
generateUI();

function init() {
  // Crear escena y cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    (window.innerWidth * 0.7) / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(2, 2, 3);
  camera.lookAt(0, 0, 0);

  // Configurar renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
  renderer.setClearColor(0x808080);
  document.getElementById('container').appendChild(renderer.domElement);

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;

  // Cargar modelo GLB
  const loader = new THREE.GLTFLoader();
  loader.load(
    'vallamovilTRA.glb',
    function (gltf) {
      cube = gltf.scene;
      scene.add(cube);

      cube.traverse(function (child) {
        if (child.isMesh && objetosEditables.hasOwnProperty(child.name)) {
          child.material = child.material.clone(); // Para que no compartan material
          objetosEditables[child.name] = child;
        }
      });
    },
    undefined,
    function (error) {
      console.error('Error al cargar cubotexture.glb:', error);
    }
  );

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function generateUI() {
  const form = document.getElementById('textureForm');
  const templateControl = document.querySelector('.face-control');

  Object.keys(objetosEditables).forEach((nombre) => {
    const control = templateControl.cloneNode(true);
    control.setAttribute('data-name', nombre);
    control.querySelector('label').textContent = nombre + ':';
    control.querySelector('.color-input').style.display = 'inline-block';
    control.querySelector('.image-input').style.display = 'none';
    form.insertBefore(control, form.querySelector('button'));
  });

  // Eliminar el control base oculto (el que sirvió de plantilla)
  templateControl.remove();

  // Mostrar el input correcto (color o imagen)
  form.querySelectorAll('.face-control').forEach(function (control) {
    const select = control.querySelector('.type-select');
    const colorInput = control.querySelector('.color-input');
    const imageInput = control.querySelector('.image-input');

    select.addEventListener('change', function () {
      if (select.value === 'color') {
        colorInput.style.display = 'inline-block';
        imageInput.style.display = 'none';
      } else {
        colorInput.style.display = 'none';
        imageInput.style.display = 'inline-block';
      }
    });
  });

  form.addEventListener('submit', handleApplyTextures);
}

function handleApplyTextures(e) {
  e.preventDefault();

  document.querySelectorAll('.face-control').forEach(function (control) {
    const name = control.getAttribute('data-name');
    const mesh = objetosEditables[name];
    if (!mesh) return;

    const type = control.querySelector('.type-select').value;

    if (type === 'color') {
      const color = control.querySelector('.color-input').value;
      mesh.material.map = null;
      mesh.material.color.set(color);
      mesh.material.needsUpdate = true;
    } else {
      const file = control.querySelector('.image-input').files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const tex = new THREE.TextureLoader().load(event.target.result, function (texture) {
            texture.flipY = false; // ✅ Evita el espejo vertical
            mesh.material.map = texture;
            mesh.material.color.set(0xffffff);
            mesh.material.needsUpdate = true;
          });
        };
        reader.readAsDataURL(file);
      }
    }
  });
}
