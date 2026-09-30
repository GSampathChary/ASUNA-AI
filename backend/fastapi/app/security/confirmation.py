import uuid
import time
from typing import Dict, Optional, Any
from pydantic import BaseModel


class ConfirmationRequest(BaseModel):
    request_id: str
    action_name: str
    target_resource: Optional[str] = None
    arguments: Dict[str, Any]
    level: int
    created_at: float
    expires_at: float


class ConfirmationManager:
    """Handles pending confirmations for sensitive/high-risk tool actions."""

    def __init__(self, timeout_seconds: int = 60):
        self.timeout_seconds = timeout_seconds
        self._pending_requests: Dict[str, ConfirmationRequest] = {}

    def create_request(self, action_name: str, arguments: Dict[str, Any], level: int, target_resource: Optional[str] = None) -> ConfirmationRequest:
        req_id = str(uuid.uuid4())
        now = time.time()
        req = ConfirmationRequest(
            request_id=req_id,
            action_name=action_name,
            target_resource=target_resource,
            arguments=arguments,
            level=level,
            created_at=now,
            expires_at=now + self.timeout_seconds
        )
        self._pending_requests[req_id] = req
        return req

    def get_request(self, request_id: str) -> Optional[ConfirmationRequest]:
        req = self._pending_requests.get(request_id)
        if req and time.time() > req.expires_at:
            del self._pending_requests[request_id]
            return None
        return req

    def approve_request(self, request_id: str) -> Optional[ConfirmationRequest]:
        req = self.get_request(request_id)
        if req:
            del self._pending_requests[request_id]
            return req
        return None

    def reject_request(self, request_id: str) -> bool:
        if request_id in self._pending_requests:
            del self._pending_requests[request_id]
            return True
        return False


confirmation_manager = ConfirmationManager()
