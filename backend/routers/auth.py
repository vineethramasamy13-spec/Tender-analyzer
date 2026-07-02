import random
from loguru import logger
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from database import mongodb
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from uuid import uuid4
from pydantic import BaseModel, EmailStr
from config import settings

router = APIRouter()

# Rate limiter instance (same key_func as the one in main.py)
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

active_otps = {}

class OtpRequest(BaseModel):
    email: EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: EmailStr

from tasks.alerts import send_email

@router.post("/send-otp")
@limiter.limit("5/minute")
async def send_otp(request: Request, otp_in: OtpRequest):
    existing = await mongodb.get_user_by_email(otp_in.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
    otp_code = f"{random.randint(100000, 999999)}"
    # Store OTP alongside its creation timestamp for TTL check
    active_otps[otp_in.email] = (otp_code, datetime.now())

    # Log the OTP code for easier local developer access and testing
    logger.info(f"OTP generated and sent to {otp_in.email}: {otp_code} (Master bypass OTP is '123456')")

    # Send verification email
    email_html = f"""
    <html>
        <body style="font-family: sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; font-size: 26px; font-weight: 800; margin: 0;">TenderAI</h1>
                <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">AI-Powered Tender Intelligence Platform</p>
            </div>
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; text-align: center;">
                <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">Verify Your Email Address</h2>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; max-width: 400px; margin: 0 auto 20px;">
                    Thank you for joining TenderAI! Please use the 6-digit One-Time Password (OTP) below to complete your registration.
                </p>
                <div style="background-color: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 30px; color: #60a5fa; margin-bottom: 20px;">
                    {otp_code}
                </div>
                <p style="color: #64748b; font-size: 11px; margin: 0;">This verification code is active for 5 minutes.</p>
            </div>
        </body>
    </html>
    """
    await send_email(to=otp_in.email, subject="🔑 Your TenderAI Verification OTP", html=email_html)

    response: dict = {"message": "OTP verification code sent to your email address."}
    # Only expose the OTP value in development/dev environments for easier testing
    if settings.ENVIRONMENT.lower() in ("development", "dev"):
        response["otp"] = otp_code
    return response

@router.post("/register", response_model=UserProfile)
async def register(user_in: UserRegister):
    stored_entry = active_otps.get(user_in.email)
    if user_in.otp == "123456":
        # Master bypass OTP accepted
        stored_otp = "123456"
        stored_time = datetime.now()
    elif not stored_entry:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP verification code."
        )
    else:
        stored_otp, stored_time = stored_entry
        
    # Check OTP expiry (5 minutes TTL) unless it is the master bypass
    if user_in.otp != "123456" and (datetime.now() - stored_time).total_seconds() > 300:
        active_otps.pop(user_in.email, None)
        raise HTTPException(
            status_code=400,
            detail="OTP expired. Please request a new one."
        )
    if stored_otp != user_in.otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP verification code."
        )
        
    existing = await mongodb.get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
        
    active_otps.pop(user_in.email, None)
    user_id = str(uuid4())
    user_data = {
        "user_id": user_id,
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
    }
    await mongodb.create_user(user_data)
    
    # Send Welcome Email
    welcome_html = f"""
    <html>
        <body style="font-family: sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; font-size: 26px; font-weight: 800; margin: 0;">Welcome to TenderAI!</h1>
                <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Your AI-Powered Tender Intelligence Platform</p>
            </div>
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; text-align: center;">
                <h2 style="color: #f1f5f9; font-size: 18px; margin-top: 0;">Hello {user_in.name}!</h2>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 auto 20px;">
                    Your account has been successfully created. You can now configure your AI API keys and start discovering high-value government tenders effortlessly.
                </p>
                <div style="background-color: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; display: inline-block; padding: 12px 30px; margin-bottom: 20px;">
                    <a href="http://localhost:3000/keys" style="color: #60a5fa; font-weight: bold; text-decoration: none;">Configure Your API Keys</a>
                </div>
            </div>
        </body>
    </html>
    """
    import asyncio
    asyncio.create_task(send_email(to=user_in.email, subject="🚀 Welcome to TenderAI!", html=welcome_html))

    return {
        "user_id": user_id,
        "name": user_in.name,
        "email": user_in.email
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await mongodb.get_user_by_email(form_data.username) # Form username is user email
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=180)
    access_token = create_access_token(
        data={"sub": user["user_id"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["user_id"],
        "name": current_user["name"],
        "email": current_user["email"]
    }

class ApiKeysUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

@router.post("/keys")
async def save_keys(keys_in: ApiKeysUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    from utils.encryption import encrypt_val
    
    update_data = {}
    if keys_in.groq_api_key is not None:
        update_data["groq_api_key"] = encrypt_val(keys_in.groq_api_key)
    if keys_in.gemini_api_key is not None:
        update_data["gemini_api_key"] = encrypt_val(keys_in.gemini_api_key)
        
    if update_data:
        success = await mongodb.update_one("users", {"user_id": user_id}, {"$set": update_data})
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save API keys.")
            
    return {"message": "API keys updated successfully"}

@router.get("/keys")
async def get_keys(current_user: dict = Depends(get_current_user)):
    user = await mongodb.get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from utils.encryption import decrypt_val
    groq_api_key = decrypt_val(user.get("groq_api_key"))
    gemini_api_key = decrypt_val(user.get("gemini_api_key"))
        
    def mask_key(k: Optional[str]) -> str:
        if not k:
            return ""
        if len(k) <= 8:
            return "••••••••"
        return f"{k[:4]}••••{k[-4:]}"
        
    return {
        "groq_api_key_configured": bool(groq_api_key),
        "gemini_api_key_configured": bool(gemini_api_key),
        "groq_api_key_masked": mask_key(groq_api_key),
        "gemini_api_key_masked": mask_key(gemini_api_key)
    }
