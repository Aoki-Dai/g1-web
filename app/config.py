from pydantic_settings import BaseSettings

from app.models.schemas import Location, Position


class Settings(BaseSettings):
    robot_mode: str = "mock"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["*"]
    mock_move_duration: float = 5.0
    mock_battery_drain_rate: float = 0.5
    ws_broadcast_interval: float = 0.5

    model_config = {"env_prefix": ""}


PREDEFINED_LOCATIONS: list[Location] = [
    Location(
        id="kitchen",
        name="Kitchen",
        name_ja="キッチン",
        position=Position(x=3.0, y=1.0, theta=0.0),
    ),
    Location(
        id="table",
        name="Table",
        name_ja="テーブル",
        position=Position(x=1.5, y=2.5, theta=1.57),
    ),
    Location(
        id="toilet",
        name="Toilet",
        name_ja="トイレ",
        position=Position(x=0.0, y=4.0, theta=3.14),
    ),
]

settings = Settings()
