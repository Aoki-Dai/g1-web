from enum import Enum

from pydantic import BaseModel


class RobotStatus(str, Enum):
    IDLE = "idle"
    MOVING = "moving"
    ARRIVED = "arrived"
    ERROR = "error"
    EMERGENCY_STOPPED = "emergency_stopped"


class Position(BaseModel):
    x: float
    y: float
    theta: float


class Location(BaseModel):
    id: str
    name: str
    name_ja: str
    position: Position


class RobotState(BaseModel):
    status: RobotStatus
    current_position: Position
    current_location: str | None = None
    target_location: str | None = None
    battery_level: float = 100.0
    message: str = ""


class MoveCommand(BaseModel):
    location_id: str


class MoveResponse(BaseModel):
    success: bool
    message: str
    task_id: str | None = None


class LocationListResponse(BaseModel):
    locations: list[Location]
