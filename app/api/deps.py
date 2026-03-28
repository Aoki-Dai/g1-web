from app.config import settings
from app.services.robot_controller import RobotController

_controller: RobotController | None = None


async def init_controller() -> RobotController:
    global _controller
    if settings.robot_mode == "real":
        from app.services.g1_controller import G1RobotController

        _controller = G1RobotController()
    else:
        from app.services.mock_controller import MockRobotController

        _controller = MockRobotController()

    await _controller.initialize()
    return _controller


async def shutdown_controller() -> None:
    global _controller
    if _controller:
        await _controller.shutdown()
        _controller = None


def get_controller() -> RobotController:
    if _controller is None:
        raise RuntimeError("Controller not initialized")
    return _controller
