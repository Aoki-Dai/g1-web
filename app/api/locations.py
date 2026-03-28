from fastapi import APIRouter

from app.config import PREDEFINED_LOCATIONS
from app.models.schemas import LocationListResponse

router = APIRouter()


@router.get("", response_model=LocationListResponse)
async def list_locations():
    return LocationListResponse(locations=PREDEFINED_LOCATIONS)
