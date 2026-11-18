// git commit -m "|| upd: v1.0.2 || FourSoda8545 || act. base web ||"

// Configuración dinámica de URLs para entorno local y producción (Render)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://127.0.0.1:8000' : 'https://refact-backend.onrender.com';
const WS_BASE_URL = isLocal ? 'ws://127.0.0.1:8000/ws/telemetry' : 'wss://refact-backend.onrender.com/ws/telemetry';

// 1. Efecto Despiece NASA por Scroll
window.addEventListener('scroll', () => {
    const container = document.querySelector('.scrolly-container');
    if (!container) return;
    
    const scrollTop = window.scrollY - container.offsetTop;
    const scrollHeight = container.offsetHeight - window.innerHeight;
    
    // Progreso del scroll de 0 a 1
    const progress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
  
    // Desplazar cada capa en el eje Z multiplicando por su offset base
    const layers = document.querySelectorAll('.hw-layer');
    layers.forEach((layer, index) => {
        const baseZ = parseFloat(layer.style.getPropertyValue('--z-offset') || (index * 120));
        // El factor de explosión separa las capas hasta 4 veces su distancia al hacer scroll
        const currentZ = baseZ + (progress * baseZ * 2.5);
        
        layer.style.transform = `translateZ(${currentZ}px)`;
    });
});

// 2. Lógica del Panel Interactivo (Modificar Componentes)
async function openCustomizer(componentId) {
    const panel = document.getElementById('customizerPanel');
    const title = document.getElementById('panelTitle');
    const content = document.getElementById('panelContent');
    
    panel.classList.add('active');
    title.innerText = `CONFIGURAR: ${componentId.toUpperCase()}`;
    content.innerHTML = `<p>Cargando especificaciones desde el servidor en la nube...</p>`;

    try {
        // Petición al backend FastAPI utilizando la URL dinámica correcta
        const response = await fetch(`${API_BASE_URL}/api/components/${componentId}`);
        const data = await response.json();

        content.innerHTML = `
            <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 15px;">
                <p><strong>Arquitectura:</strong> ${data.architecture || 'N/A'}</p>
                <p><strong>Specs:</strong> ${data.specs || 'N/A'}</p>
                <p style="color: #8892b0; font-size: 0.85rem;">${data.description}</p>
                <hr style="border-color: #1f242d;">
                <label style="font-size: 0.8rem; color: var(--neon-green);">SELECCIONAR ALTERNATIVA:</label>
                <select style="background: #050507; color: #fff; border: 1px solid var(--neon-cyan); padding: 10px;">
                    <option>Opción Stock (Alto Rendimiento)</option>
                    <option>Opción Overclocked (Extreme Edition)</option>
                    <option>Opción Eco-Silence (Bajo Consumo)</option>
                </select>
                <button onclick="alert('Configuración aplicada al bus del sistema')" style="background: var(--neon-cyan); color: #000; border: none; padding: 10px; font-weight: bold; cursor: pointer; margin-top: 10px;">APLICAR CAMBIOS</button>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<p style="color: #ff4444;">Error conectando con el backend en Render. Verifica que el servicio esté activo.</p>`;
    }
}

function closeCustomizer() {
    document.getElementById('customizerPanel').classList.remove('active');
}

// 3. Conexión WebSocket para Telemetría en Vivo
function initTelemetrySocket() {
    const ws = new WebSocket(WS_BASE_URL);
    
    ws.onopen = () => {
        console.log("Canal WebSocket de telemetría conectado exitosamente.");
    };
    
    ws.onmessage = (event) => {
        const telemetry = JSON.parse(event.data);
        console.log("Métrica de hardware recibida:", telemetry);
        // Aquí puedes inyectar los datos en tiempo real a tu HTML si lo deseas
    };

    ws.onerror = (error) => {
        console.error("Error en el flujo WebSocket:", error);
    };

    ws.onclose = () => {
        console.log("Conexión WebSocket cerrada. Reintentando reconexión en 5 segundos...");
        setTimeout(initTelemetrySocket, 5000);
    };
}

// Inicializar el canal en tiempo real al cargar la app
initTelemetrySocket();