import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("asuna.audit")
logger.setLevel(logging.INFO)


class AuditLogger:
    """Logs system security events and tool executions to console and storage."""

    @staticmethod
    def log_action(
        action_name: str,
        permission_level: int,
        status: str,
        user_id: Optional[str] = None,
        target_resource: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id or "anonymous",
            "action": action_name,
            "level": permission_level,
            "status": status,
            "target": target_resource,
            "details": details or {},
            "ip": ip_address or "local"
        }
        logger.info(f"AUDIT_LOG: {entry}")


audit_logger = AuditLogger()
