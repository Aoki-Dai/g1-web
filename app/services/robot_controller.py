from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable

from app.models.schemas import MoveResponse, RobotState


class RobotController(ABC):
    @abstractmethod
    async def initialize(self) -> None: ...

    @abstractmethod
    async def shutdown(self) -> None: ...

    @abstractmethod
    async def move_to_location(self, location_id: str) -> MoveResponse: ...

    @abstractmethod
    async def stop(self) -> MoveResponse: ...

    @abstractmethod
    async def get_state(self) -> RobotState: ...

    @abstractmethod
    def set_state_callback(
        self, callback: Callable[[RobotState], Awaitable[None]]
    ) -> None: ...
