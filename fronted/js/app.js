// 1. Efecto Despiece NASA por Scroll
window.addEventListener('scroll', () => {
    const container = document.querySelector('.scrolly-container');
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
    content.innerHTML = `<p>Cargando especificaciones desde el servidor Python...</p>`;

    try {
        // Petición al backend FastAPI que creamos antes
        const response = await fetch(`http://127.0.0.1:8000/api/components/${componentId}`);
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
        content.innerHTML = `<p style="color: #ff4444;">Error conectando con el backend de Python. Asegúrate de ejecutar uvicorn.</p>`;
    }
}

function closeCustomizer() {
    document.getElementById('customizerPanel').classList.remove('active');
}