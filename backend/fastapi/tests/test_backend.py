import sys
from pathlib import Path

# Add backend/fastapi to sys.path
FASTAPI_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FASTAPI_DIR))

import pytest
import asyncio
from app.ai.intent.intent_engine import intent_engine
from app.ai.llm.provider import LocalFallbackProvider
from app.security.policy import SecurityPolicy, ActionLevel
from app.security.action_validator import action_validator, PolicyStatus
from app.tools.registry import tool_registry
from app.tools.system_tools import register_standard_tools
from app.gestures.landmarks.landmark_processor import landmark_smoother
from app.gestures.classifier.gesture_classifier import gesture_classifier
from app.ai.planner.agent_planner import agent_planner


def test_trilingual_intent_engine():
    # 1. Telugu (Telangana dialect)
    res_te = intent_engine.process_query("Asuna YouTube open cheyyi")
    assert res_te.normalized_intent == "open_application"
    assert res_te.arguments["application"] == "YouTube"
    assert res_te.primary_language == "te_en"

    # 2. Hindi / Hinglish
    res_hi = intent_engine.process_query("Chrome open karo")
    assert res_hi.normalized_intent == "open_application"
    assert res_hi.primary_language == "hi_en"

    # 3. Phone control intent (Call)
    res_call = intent_engine.process_query("Asuna call karo Rahul to")
    assert res_call.normalized_intent == "make_call"
    assert res_call.tool_name == "make_phone_call"

    # 4. Flashlight control
    res_flash = intent_engine.process_query("flashlight chalu karo")
    assert res_flash.normalized_intent == "toggle_flashlight"
    assert res_flash.arguments["state"] == "on"


def test_cross_device_intent_examples():
    youtube = intent_engine.process_query("Jarvis, open YouTube on my laptop")
    assert youtube.target_device == "laptop"
    assert youtube.normalized_intent == "open_application"
    assert youtube.arguments["application"] == "YouTube"

    volume = intent_engine.process_query("Jarvis, set volume to 80% on my PC")
    assert volume.target_device == "laptop"
    assert volume.normalized_intent == "set_volume"
    assert volume.arguments["level"] == 80


def test_chatgpt_multilingual_llm():
    asyncio.run(_test_chatgpt_multilingual_llm())


async def _test_chatgpt_multilingual_llm():
    provider = LocalFallbackProvider()
    response = await provider.generate_response([{"role": "user", "content": "Hello"}])
    assert "provider is not configured" in response.content


def test_security_policy_levels():
    level1 = SecurityPolicy.get_action_level("open_browser")
    assert level1 == ActionLevel.LEVEL_1_SAFE

    level3 = SecurityPolicy.get_action_level("delete_file")
    assert level3 == ActionLevel.LEVEL_3_HIGH_RISK


def test_gesture_classifier():
    mock_landmarks = [
        {"id": 0, "x": 0.5, "y": 0.5, "z": 0.0},
        {"id": 4, "x": 0.51, "y": 0.51, "z": 0.0},
        {"id": 8, "x": 0.515, "y": 0.512, "z": 0.0},
    ]
    hand_state = landmark_smoother.process(mock_landmarks)
    detected = gesture_classifier.classify(hand_state)
    assert detected is not None
    assert detected.gesture_name == "PINCH"


if __name__ == "__main__":
    test_trilingual_intent_engine()
    asyncio.run(test_chatgpt_multilingual_llm())
    test_security_policy_levels()
    test_gesture_classifier()
    print("ALL 4 TRILINGUAL & MULTIMODAL TEST SUITES PASSED SUCCESSFULLY!")
