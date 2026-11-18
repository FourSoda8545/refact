

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random

app = FastAPI(title="Silicon Core API", version="1.0")

# dominio de GitHub Pages
origins = [
    "https://foursoda8545.github.io",
    "http://127.0.0.1:5500", # Para desarrollo local
    "http://localhost:5500"
]
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COMPONENTS_DB = {
    "cpu": {
        "name": "Procesador (CPU)",
        "architecture": "x86-64 / ARM",
        "specs": "8 Núcleos, 16 Hilos, Caché L3: 32MB",
        "description": "El cerebro del sistema. Ejecuta instrucciones mediante ciclos de reloj."
    },
    "gpu": {
        "name": "Tarjeta Gráfica (GPU)",
        "architecture": "Paralela Masiva",
        "specs": "CUDA Cores / Stream Processors, VRAM GDDR6",
        "description": "Diseñada para procesamiento paralelo masivo y renderizado gráfico."
    },
    "ram": {
        "name": "Memoria RAM",
        "architecture": "DDR4 / DDR5 SDRAM",
        "specs": "Canal Dual, Latencia CAS (CL)",
        "description": "Almacenamiento volátil de alta velocidad."
    },
    "nvme": {
        "name": "Almacenamiento NVMe SSD",
        "architecture": "PCIe Gen 4 / 5 x4",
        "specs": "Lectura hasta 7000 MB/s",
        "description": "Almacenamiento de estado sólido conectado al bus PCIe."
    }
}

@app.get("/api/components/{component_id}")
def get_component_detail(component_id: str):
    return COMPONENTS_DB.get(component_id, {"error": "Componente no encontrado"})

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            telemetry_data = {
                "cpu_temp": round(random.uniform(45.0, 75.0), 1),
                "gpu_load": random.randint(10, 95),
                "ram_usage": round(random.uniform(35.0, 80.0), 1),
                "pcie_bandwidth": round(random.uniform(12.5, 31.5), 2)
            }
            await websocket.send_json(telemetry_data)
            await asyncio.sleep(2)
    except Exception as e:
        print(f"Conexión cerrada: {e}")
            





