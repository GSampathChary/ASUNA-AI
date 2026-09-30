import inspect
import logging
from typing import Dict, Any, Callable, Optional, List
from pydantic import BaseModel
from app.security.action_validator import action_validator
from app.security.policy import PolicyStatus, SecurityPolicy
from app.security.audit import audit_logger

logger = logging.getLogger("asuna.tools")


class ToolSpec(BaseModel):
    name: str
    description: str
    category: str
    permission_level: int
    input_schema: Dict[str, Any]
    confirmation_required: bool = False
    timeout: int = 30


class ToolExecutionResult(BaseModel):
    tool_name: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    status: str
    confirmation_id: Optional[str] = None


class ToolRegistry:
    """Central registry enforcing typed tool execution, parameter validation, and security policy check."""

    def __init__(self):
        self._tools: Dict[str, ToolSpec] = {}
        self._handlers: Dict[str, Callable] = {}

    def register(
        self,
        name: str,
        description: str,
        category: str,
        input_schema: Dict[str, Any],
        handler: Callable,
        timeout: int = 30
    ):
        level = SecurityPolicy.get_action_level(name)
        spec = ToolSpec(
            name=name,
            description=description,
            category=category,
            permission_level=int(level),
            input_schema=input_schema,
            confirmation_required=(level >= 2),
            timeout=timeout
        )
        self._tools[name] = spec
        self._handlers[name] = handler
        logger.info(f"Registered Tool: {name} [{category}] Level {level}")

    def list_tools() -> List[ToolSpec]:
        return list(self._tools.values())

    def get_tool(self, name: str) -> Optional[ToolSpec]:
        return self._tools.get(name)

    async def execute(
        self,
        name: str,
        arguments: Dict[str, Any],
        user_id: Optional[str] = None,
        bypass_confirmation: bool = False
    ) -> ToolExecutionResult:
        spec = self._tools.get(name)
        if not spec:
            return ToolExecutionResult(
                tool_name=name,
                success=False,
                error=f"Tool '{name}' is not registered in ToolRegistry",
                status="NOT_FOUND"
            )

        handler = self._handlers.get(name)

        # Security check
        if not bypass_confirmation:
            policy_status, msg, req = action_validator.validate_action(name, arguments)
            if policy_status == PolicyStatus.CONFIRMATION_REQUIRED:
                audit_logger.log_action(name, spec.permission_level, "CONFIRMATION_REQUIRED", user_id=user_id, details=arguments)
                return ToolExecutionResult(
                    tool_name=name,
                    success=False,
                    error=msg,
                    status="CONFIRMATION_REQUIRED",
                    confirmation_id=req.request_id if req else None
                )

        try:
            if inspect.iscoroutinefunction(handler):
                res = await handler(**arguments)
            else:
                res = handler(**arguments)

            audit_logger.log_action(name, spec.permission_level, "SUCCESS", user_id=user_id, details=arguments)
            return ToolExecutionResult(
                tool_name=name,
                success=True,
                result=res,
                status="EXECUTED"
            )
        except Exception as e:
            logger.error(f"Error executing tool '{name}': {e}", exc_info=True)
            audit_logger.log_action(name, spec.permission_level, "FAILED", user_id=user_id, details={"error": str(e)})
            return ToolExecutionResult(
                tool_name=name,
                success=False,
                error=str(e),
                status="EXECUTION_ERROR"
            )


tool_registry = ToolRegistry()
