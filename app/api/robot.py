from fastapi import APIRouter, Depends

from app.api.deps import get_controller
from app.models.schemas import MoveCommand, MoveResponse, RobotState
from app.services.robot_controller import RobotController

router = APIRouter()


@router.get("/status", response_model=RobotState)
async def get_status(controller: RobotController = Depends(get_controller)):
    return await controller.get_state()


@router.post("/move", response_model=MoveResponse)
async def move_robot(
    command: MoveCommand,
    controller: RobotController = Depends(get_controller),
):
    return await controller.move_to_location(command.location_id)


@router.post("/stop", response_model=MoveResponse)
async def stop_robot(controller: RobotController = Depends(get_controller)):
    return await controller.stop()
