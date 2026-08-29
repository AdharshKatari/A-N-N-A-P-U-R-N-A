from fastapi import APIRouter, Depends
from auth import get_current_user
from db import get_notifications

router = APIRouter(prefix="/api/v5", tags=["Notifications"])

@router.get("/notifications")
def list_notifications(user: dict = Depends(get_current_user)):
    """
    Returns a list of recent notifications.
    """
    return get_notifications()
