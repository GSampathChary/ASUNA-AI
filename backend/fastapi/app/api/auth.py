"""FastAPI Unified Authentication & Token Quota API Router"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory user quota store (Syncs across Web & Mobile)
USER_SESSIONS = {
    "demo_user": {
        "user_id": "usr_99812",
        "email": "user@asuna.ai",
        "phone": "+919876543210",
        "token_balance": 240000, # 4 Hours continuous usage = 240,000 tokens
        "max_capacity": 240000,
        "last_renew_timestamp": time.time(),
        "next_renew_timestamp": time.time() + 7200 # 2 Hours auto-renewal
    }
}


class OTPRequest(BaseModel):
    phone_or_email: str


class VerifyOTPRequest(BaseModel):
    phone_or_email: str
    otp_code: str


class GoogleLoginRequest(BaseModel):
    id_token: str


@router.post("/send_otp")
async def send_otp(req: OTPRequest):
    """Sends 6-digit OTP code to Mobile Number or Email"""
    return {
        "status": "success",
        "message": f"6-Digit OTP sent successfully to {req.phone_or_email}!",
        "demo_otp": "123456"
    }


@router.post("/verify_otp")
async def verify_otp(req: VerifyOTPRequest):
    """Verifies OTP code and returns unified session token"""
    if req.otp_code != "123456" and req.otp_code != "999999":
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please try '123456'.")

    return {
        "status": "success",
        "user_id": "usr_99812",
        "session_token": "asuna_sess_tok_99182312",
        "token_quota": USER_SESSIONS["demo_user"]
    }


@router.post("/google_login")
async def google_login(req: GoogleLoginRequest):
    """Authenticates via Google Single Sign-On (SSO)"""
    return {
        "status": "success",
        "user_id": "usr_google_7718",
        "email": "user@gmail.com",
        "session_token": "asuna_sess_tok_google_7718",
        "token_quota": USER_SESSIONS["demo_user"]
    }


@router.get("/quota_status")
async def quota_status(user_id: str = "usr_99812"):
    """Returns real-time token quota balance & 2-hour auto-renewal timer"""
    sess = USER_SESSIONS.get("demo_user")
    now = time.time()

    # Check if 2-hour renewal period has elapsed
    if now >= sess["next_renew_timestamp"]:
        sess["token_balance"] = sess["max_capacity"]
        sess["last_renew_timestamp"] = now
        sess["next_renew_timestamp"] = now + 7200 # Reset 2-hour window

    remaining_seconds = max(0, int(sess["next_renew_timestamp"] - now))

    return {
        "user_id": user_id,
        "token_balance": sess["token_balance"],
        "max_capacity": sess["max_capacity"],
        "percentage": int((sess["token_balance"] / sess["max_capacity"]) * 100),
        "continuous_hours_left": round((sess["token_balance"] / 60000), 1),
        "renews_in_seconds": remaining_seconds,
        "renews_in_minutes": int(remaining_seconds / 60)
    }
