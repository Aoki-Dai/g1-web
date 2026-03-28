import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.api.deps import get_controller
from app.models.schemas import RobotState

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def broadcast(self, state: RobotState) -> None:
        data = state.model_dump_json()
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.discard(ws)


manager = ConnectionManager()


async def on_state_change(state: RobotState) -> None:
    await manager.broadcast(state)


@router.websocket("/ws/robot/status")
async def websocket_status(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        controller = get_controller()
        state = await controller.get_state()
        await websocket.send_text(state.model_dump_json())

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
