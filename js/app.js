// git commit -m "|| upd: v1.0.2 || FourSoda8545 || act. base web ||"

import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// 1. Configuración dinámica de URLs (Local vs Producción en Render)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://127.0.0.1:8000' : 'https://refact-backend.onrender.com';
const WS_BASE_URL = isLocal ? 'ws://127.0.0.1:8000/ws/telemetry' : 'wss://refact-backend.onrender.com/ws/telemetry';

// 2. Referencias al DOM
const viewer = document.querySelector('.viewer');
const canvas = viewer.querySelector('canvas');
const slider = document.getElementById('teardown');
const stageOut = document.querySelector('.teardown-stage');
const ticks = document.querySelectorAll('.stage-ticks li');
const panel = document.getElementById('customizerPanel');
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const schemeSelect = document.getElementById('scheme');

// 3. Inicialización de Escena Three.js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 5, 8);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 20;

// Iluminación
const ambientLight = new THREE.AmbientLight('#8892b0', 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight('#ffffff', 2.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const neonLight = new THREE.PointLight('#00f3ff', 3, 15);
neonLight.position.set(0, 2, 0);
scene.add(neonLight);

// Grilla de base estilo laboratorio
const grid = new THREE.GridHelper(20, 20, '#00f3ff', '#1a2333');
grid.position.y = -2.2;
grid.material.opacity = 0.25;
grid.material.transparent = true;
scene.add(grid);

// 4. Definición de las 9 Etapas de Hardware (Geometría 3D + Vector de Explosión)
const STAGE_OVERLAP = 0.45;
const STAGE_NAMES = [
  'CPU Core', 'Liquid Cooler', 'VRM Heatsink', 'PCIe Bus & GPU',
  'Motherboard PCB', 'PCIe Lanes', 'Power Supply (PSU)', 'RAM & NVMe', 'Chassis Frame'
];

// cada pieza tiene: id para la API, etapa (1-9), geometría, posición base, vector de despiece (explode) y color
const HARDWARE_PARTS = [
  { id: 'cpu', label: 'Procesador (CPU)', stage: 1, size: [0.9, 0.12, 0.9], pos: [0, 0.15, 0], explode: [0, 2.2, 0], color: '#00f3ff' },
  { id: 'cooler', label: 'Bloque Disipador', stage: 2, size: [1.3, 0.45, 1.3], pos: [0, 0.5, 0], explode: [0, 3.4, 0], color: '#00ff66' },
  { id: 'vrm', label: 'Disipador VRM', stage: 3, size: [0.5, 0.35, 2.2], pos: [-1.3, 0.25, 0], explode: [-2.2, 1.2, 0], color: '#38bdf8' },
  { id: 'gpu', label: 'Tarjeta Gráfica (GPU)', stage: 4, size: [2.6, 0.45, 1.3], pos: [0.2, 0.35, 1.1], explode: [0, 1.4, 2.8], color: '#00f3ff' },
  { id: 'motherboard', label: 'Placa Base X670', stage: 5, size: [3.6, 0.12, 3.6], pos: [0, 0, 0], explode: [0, 0, 0], color: '#1e293b' },
  { id: 'pcie', label: 'Ranuras PCIe Gen5', stage: 6, size: [2.2, 0.12, 0.25], pos: [0.2, 0.1, 1.1], explode: [0, 0.6, 1.4], color: '#64748b' },
  { id: 'psu', label: 'Fuente de Poder (PSU)', stage: 7, size: [1.8, 0.9, 1.6], pos: [-0.9, -0.8, -1.0], explode: [-2.0, -1.8, -1.8], color: '#334155' },
  { id: 'nvme', label: 'RAM DDR5 & NVMe M.2', stage: 8, size: [0.35, 0.4, 2.0], pos: [1.2, 0.25, -0.4], explode: [2.4, 1.1, -0.8], color: '#00ff66' },
  { id: 'chassis', label: 'Chasis Base Tray', stage: 9, size: [4.0, 0.15, 4.0], pos: [0, -1.4, 0], explode: [0, -2.6, 0], color: '#0f172a' }
];

const hardwareGroup = new THREE.Group();
scene.add(hardwareGroup);

const meshes = [];
const poses = [];

HARDWARE_PARTS.forEach(part => {
  const geo = new THREE.BoxGeometry(...part.size);
  const mat = new THREE.MeshStandardMaterial({
    color: part.color,
    metalness: 0.6,
    roughness: 0.3,
    emissive: part.color,
    emissiveIntensity: 0.12
  });
  
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...part.pos);
  mesh.userData = { ...part };

  // Bordes técnicos tipo CAD / Blueprint
  const edges = new THREE.EdgesGeometry(geo);
  const lineMat = new THREE.LineBasicMaterial({ color: '#00f3ff', transparent: true, opacity: 0.45 });
  mesh.add(new THREE.LineSegments(edges, lineMat));

  hardwareGroup.add(mesh);
  meshes.push(mesh);
  poses.push({
    mesh,
    basePos: new THREE.Vector3(...part.pos),
    explodeVec: new THREE.Vector3(...part.explode),
    stage: part.stage
  });
});

// 5. Matemática de Despiece por Etapas (Teardown Logic del CodePen)
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function stageWindow(stage) {
  const n = STAGE_NAMES.length;
  const len = (1 + STAGE_OVERLAP) / (n + STAGE_OVERLAP);
  const start = (stage - 1) / (n + STAGE_OVERLAP);
  return [start, len];
}

function progress(stage, t) {
  const [start, len] = stageWindow(stage);
  return ease(THREE.MathUtils.clamp((t - start) / len, 0, 1));
}

function updateTeardown(t) {
  // Desplazar cada pieza según su ventana de etapa
  poses.forEach(p => {
    const k = progress(p.stage, t);
    p.mesh.position.copy(p.basePos).addScaledVector(p.explodeVec, k);
  });

  // Actualizar etiqueta superior derecha de la barra
  if (t <= 0.001) {
    stageOut.textContent = 'Ensamblado';
  } else if (t >= 0.999) {
    stageOut.textContent = 'Despiece Total (9/9)';
  } else {
    let active = 1;
    for (let k = 1; k <= STAGE_NAMES.length; k++) {
      if (t >= stageWindow(k)[0]) active = k;
    }
    stageOut.textContent = `${active} de ${STAGE_NAMES.length}: ${STAGE_NAMES[active - 1]}`;
  }

  // Iluminar las marcas inferiores (ticks)
  ticks.forEach((li, idx) => {
    const stageNum = idx + 1;
    const [start] = stageWindow(stageNum);
    li.classList.toggle('active', t >= start && t > 0.001);
  });
}

// Evento del Slider
slider.addEventListener('input', (e) => {
  const t = parseFloat(e.target.value) / 1000;
  updateTeardown(t);
});

// Permitir hacer clic en las etiquetas inferiores para saltar a esa etapa
ticks.forEach((li, idx) => {
  li.style.cursor = 'pointer';
  li.addEventListener('click', () => {
    const [start, len] = stageWindow(idx + 1);
    const targetT = Math.min(1, start + len * 0.8);
    slider.value = Math.round(targetT * 1000);
    updateTeardown(targetT);
  });
});

// 6. Selector de Esquema / Perfil de Rendimiento
schemeSelect.addEventListener('change', (e) => {
  const mode = e.target.value;
  const colors = {
    stock: '#00f3ff',
    oc: '#ff0055',
    eco: '#00ff66'
  };
  const accent = colors[mode] || '#00f3ff';
  document.documentElement.style.setProperty('--neon-cyan', accent);
  neonLight.color.set(accent);
});

// 7. Raycasting: Clic en Piezas 3D -> Consulta a FastAPI en Render
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointerup', (e) => {
  // Ignorar si el usuario estaba arrastrando para rotar la cámara
  if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) return;

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(meshes, false);

  if (intersects.length > 0) {
    const selectedMesh = intersects[0].object;
    highlightMesh(selectedMesh);
    openCustomizer(selectedMesh.userData.id, selectedMesh.userData.label);
  }
});

function highlightMesh(targetMesh) {
  meshes.forEach(m => {
    m.material.emissiveIntensity = (m === targetMesh) ? 0.65 : 0.12;
  });
}

// 8. Conexión con el Backend REST en Render
async function openCustomizer(componentId, label) {
  panel.hidden = false;
  panelTitle.innerText = `COMPONENTE: ${label.toUpperCase()}`;
  panelContent.innerHTML = `<p class="part-note">Consultando registros en Render (${componentId})...</p>`;

  try {
    // Mapeamos cualquier pieza a los endpoints existentes en tu backend (cpu, gpu, nvme, motherboard)
    const validEndpoints = ['cpu', 'gpu', 'nvme', 'motherboard'];
    const queryId = validEndpoints.includes(componentId) ? componentId : 'cpu';

    const response = await fetch(`${API_BASE_URL}/api/components/${queryId}`);
    const data = await response.json();

    panelContent.innerHTML = `
      <div style="margin-top: 12px; display: grid; gap: 10px;">
        <p><strong>Arquitectura:</strong> <span style="color: var(--neon-cyan)">${data.architecture || 'x86_64 / PCIe 5.0'}</span></p>
        <p><strong>Especificaciones:</strong> ${data.specs || 'Alto Rendimiento'}</p>
        <p class="part-note">${data.description || 'Módulo verificado por el bus principal.'}</p>
        <div id="live-telemetry-box" style="padding: 8px; border: 1px solid var(--color-line); border-radius: 6px; background: #05070b; font-size: 0.8rem;">
          <span style="color: var(--neon-green);">● TELEMETRÍA WS ACTIVA</span>
          <div id="telemetry-data" style="margin-top: 4px; color: var(--color-muted);">Esperando pulso...</div>
        </div>
      </div>
    `;
  } catch (error) {
    panelContent.innerHTML = `<p style="color: #ff4444; margin-top: 10px;">Error conectando con ${API_BASE_URL}. Verifica que Render esté activo.</p>`;
  }
}

// Exponer función global para el botón de cerrar del HTML
window.closeCustomizer = function() {
  panel.hidden = true;
  highlightMesh(null);
};

// 9. Canal WebSocket de Telemetría en Tiempo Real
function initTelemetrySocket() {
  const ws = new WebSocket(WS_BASE_URL);

  ws.onmessage = (event) => {
    try {
      const telemetry = JSON.parse(event.data);
      const box = document.getElementById('telemetry-data');
      if (box) {
        box.innerHTML = `Temp CPU: <b>${telemetry.cpu_temp || '45°C'}</b> | Carga GPU: <b>${telemetry.gpu_load || '18%'}</b>`;
      }
    } catch (e) {
      // Ignorar paquetes no JSON
    }
  };

  ws.onclose = () => {
    setTimeout(initTelemetrySocket, 5000);
  };
}

initTelemetrySocket();

// 10. Resize y Bucle de Renderizado
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
renderer.setSize(window.innerWidth, window.innerHeight);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();









