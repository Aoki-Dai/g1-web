"""Placeholder for real Unitree G1 controller using unitree_sdk2py.

This will be implemented when connecting to the actual G1 hardware.
Set ROBOT_MODE=real to use this controller.
"""

from collections.abc import Awaitable, Callable

from app.models.schemas import MoveResponse, RobotState
from app.services.robot_controller import RobotController


class G1RobotController(RobotController):
    async def initialize(self) -> None:
        raise NotImplementedError("G1 controller not yet implemented")

    async def shutdown(self) -> None:
        pass

    async def move_to_location(self, location_id: str) -> MoveResponse:
        raise NotImplementedError

    async def stop(self) -> MoveResponse:
        raise NotImplementedError

    async def get_state(self) -> RobotState:
        raise NotImplementedError

    def set_state_callback(
        self, callback: Callable[[RobotState], Awaitable[None]]
    ) -> None:
        raise NotImplementedError
