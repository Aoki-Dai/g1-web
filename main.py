import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import locations, robot, websocket
from app.api.deps import init_controller, shutdown_controller
from app.api.websocket import on_state_change
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    controller = await init_controller()
    controller.set_state_callback(on_state_change)
    yield
    await shutdown_controller()


app = FastAPI(title="G1 Web Controller", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(robot.router, prefix="/api/robot", tags=["robot"])
app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
app.include_router(websocket.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "mode": settings.robot_mode}


# Serve Vue frontend build if available
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
