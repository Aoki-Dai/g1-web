import asyncio
import math
import uuid
from collections.abc import Awaitable, Callable

from app.config import PREDEFINED_LOCATIONS, settings
from app.models.schemas import (
    Location,
    MoveResponse,
    Position,
    RobotState,
    RobotStatus,
)
from app.services.robot_controller import RobotController


class MockRobotController(RobotController):
    def __init__(self) -> None:
        initial_location = next(
            (loc for loc in PREDEFINED_LOCATIONS if loc.id == "table"), None
        )
        initial_pos = initial_location.position if initial_location else Position(x=0, y=0, theta=0)

        self._status = RobotStatus.IDLE
        self._position = initial_pos.model_copy()
        self._current_location: str | None = "table"
        self._target_location: str | None = None
        self._battery: float = 100.0
        self._message: str = ""
        self._move_task: asyncio.Task | None = None
        self._lock = asyncio.Lock()
        self._state_callback: Callable[[RobotState], Awaitable[None]] | None = None
        self._locations: dict[str, Location] = {
            loc.id: loc for loc in PREDEFINED_LOCATIONS
        }

    async def initialize(self) -> None:
        pass

    async def shutdown(self) -> None:
        if self._move_task and not self._move_task.done():
            self._move_task.cancel()
            try:
                await self._move_task
            except asyncio.CancelledError:
                pass

    def set_state_callback(
        self, callback: Callable[[RobotState], Awaitable[None]]
    ) -> None:
        self._state_callback = callback

    async def get_state(self) -> RobotState:
        return RobotState(
            status=self._status,
            current_position=self._position.model_copy(),
            current_location=self._current_location,
            target_location=self._target_location,
            battery_level=self._battery,
            message=self._message,
        )

    async def move_to_location(self, location_id: str) -> MoveResponse:
        async with self._lock:
            if location_id not in self._locations:
                return MoveResponse(
                    success=False,
                    message=f"Unknown location: {location_id}",
                )

            if self._status == RobotStatus.MOVING:
                return MoveResponse(
                    success=False,
                    message="Robot is already moving",
                )

            target = self._locations[location_id]
            task_id = str(uuid.uuid4())
            self._target_location = location_id
            self._status = RobotStatus.MOVING
            self._message = f"Moving to {target.name_ja}"
            self._move_task = asyncio.create_task(
                self._simulate_movement(target)
            )

            await self._notify()
            return MoveResponse(
                success=True,
                message=f"Moving to {target.name_ja}",
                task_id=task_id,
            )

    async def stop(self) -> MoveResponse:
        async with self._lock:
            if self._move_task and not self._move_task.done():
                self._move_task.cancel()
                try:
                    await self._move_task
                except asyncio.CancelledError:
                    pass

            self._status = RobotStatus.EMERGENCY_STOPPED
            self._target_location = None
            self._message = "Emergency stopped"
            await self._notify()

            await asyncio.sleep(1.0)
            self._status = RobotStatus.IDLE
            self._message = ""
            await self._notify()

            return MoveResponse(success=True, message="Emergency stop executed")

    async def _simulate_movement(self, target: Location) -> None:
        try:
            start = self._position.model_copy()
            target_pos = target.position
            duration = settings.mock_move_duration
            steps = int(duration / 0.1)

            dx = target_pos.x - start.x
            dy = target_pos.y - start.y
            dtheta = target_pos.theta - start.theta
            distance = math.sqrt(dx**2 + dy**2)

            self._current_location = None

            for i in range(1, steps + 1):
                t = i / steps
                self._position = Position(
                    x=start.x + dx * t,
                    y=start.y + dy * t,
                    theta=start.theta + dtheta * t,
                )
                await self._notify()
                await asyncio.sleep(0.1)

            self._position = target_pos.model_copy()
            self._current_location = target.id
            self._target_location = None
            self._status = RobotStatus.ARRIVED
            self._message = f"Arrived at {target.name_ja}"
            self._battery = max(0.0, self._battery - settings.mock_battery_drain_rate * distance)
            await self._notify()

            await asyncio.sleep(2.0)
            self._status = RobotStatus.IDLE
            self._message = ""
            await self._notify()

        except asyncio.CancelledError:
            raise

    async def _notify(self) -> None:
        if self._state_callback:
            state = await self.get_state()
            await self._state_callback(state)
