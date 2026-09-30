from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.tools.registry import tool_registry, ToolExecutionResult
from app.ai.intent.intent_engine import intent_engine


class PlanStep(BaseModel):
    step_number: int
    action_description: str
    tool_name: str
    arguments: Dict[str, Any]
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED, CONFIRMATION_REQUIRED
    result: Optional[Any] = None
    error: Optional[str] = None
    confirmation_id: Optional[str] = None


class ExecutionPlan(BaseModel):
    user_query: str
    steps: List[PlanStep]
    current_step_index: int = 0
    is_completed: bool = False
    has_failed: bool = False


class AgentPlanner:
    """Decomposes multi-step user prompts into sequential tool plans and manages execution loop."""

    def create_plan(self, user_query: str) -> ExecutionPlan:
        # Step 1: Intent extraction
        extracted = intent_engine.process_query(user_query)

        # Multi-step query check (e.g. "Open Chrome, search Telangana tourism, open first result and zoom in")
        lower = user_query.lower()
        steps: List[PlanStep] = []

        if "open chrome" in lower and "search" in lower:
            steps.append(PlanStep(
                step_number=1,
                action_description="Open web browser",
                tool_name="open_browser",
                arguments={"url": "https://www.google.com"}
            ))
            query_term = lower.split("search")[-1].replace("and zoom in", "").replace("and open", "").strip()
            steps.append(PlanStep(
                step_number=2,
                action_description=f"Search web for {query_term}",
                tool_name="open_browser",
                arguments={"url": f"https://www.google.com/search?q={query_term}"}
            ))
            if "zoom" in lower:
                steps.append(PlanStep(
                    step_number=3,
                    action_description="Zoom in page content",
                    tool_name="zoom_page",
                    arguments={"mode": "in", "factor": 1.25}
                ))
        elif extracted.tool_name:
            steps.append(PlanStep(
                step_number=1,
                action_description=f"Execute {extracted.tool_name}",
                tool_name=extracted.tool_name,
                arguments=extracted.arguments
            ))
        else:
            # Informational response step
            steps.append(PlanStep(
                step_number=1,
                action_description="Conversational response",
                tool_name="media_control",
                arguments={"command": "info"}
            ))

        return ExecutionPlan(user_query=user_query, steps=steps)

    async def execute_next_step(self, plan: ExecutionPlan, user_id: Optional[str] = None) -> ExecutionPlan:
        if plan.is_completed or plan.has_failed or plan.current_step_index >= len(plan.steps):
            plan.is_completed = True
            return plan

        current_step = plan.steps[plan.current_step_index]
        current_step.status = "IN_PROGRESS"

        res: ToolExecutionResult = await tool_registry.execute(
            name=current_step.tool_name,
            arguments=current_step.arguments,
            user_id=user_id
        )

        if res.status == "CONFIRMATION_REQUIRED":
            current_step.status = "CONFIRMATION_REQUIRED"
            current_step.confirmation_id = res.confirmation_id
            current_step.error = res.error
            return plan

        if res.success:
            current_step.status = "COMPLETED"
            current_step.result = res.result
            plan.current_step_index += 1
            if plan.current_step_index >= len(plan.steps):
                plan.is_completed = True
        else:
            current_step.status = "FAILED"
            current_step.error = res.error
            plan.has_failed = True

        return plan


agent_planner = AgentPlanner()
