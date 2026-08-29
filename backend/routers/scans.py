from fastapi import APIRouter, Depends
from auth import get_current_user
from db import get_recent_scans

router = APIRouter(prefix="/api/v5", tags=["Scans"])

@router.get("/scans")
def list_recent_scans(user: dict = Depends(get_current_user)):
    """
    Returns a list of recent pest and soil scans.
    """
    return get_recent_scans()
