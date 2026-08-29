from typing import Optional
from fastapi import APIRouter, Depends
from db import get_recent_scans

router = APIRouter(prefix="/api/v5", tags=["Scans"])

@router.get("/scans")
def list_recent_scans():
    """
    Returns a list of recent pest and soil scans for the dashboard.
    """
    return get_recent_scans()
