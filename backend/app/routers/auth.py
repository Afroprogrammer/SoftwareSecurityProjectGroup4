import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, AuditLog
from app.schemas.user import Token, UserCreate, UserResponse, UserChangePassword
from app.security.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.security.deps import get_current_active_user, get_current_admin_user

# Configure Server & File Logging
audit_logger = logging.getLogger("audit_logger")
audit_logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(formatter)
if not audit_logger.handlers:
    audit_logger.addHandler(stream_handler)

try:
    log_dir = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    file_handler = RotatingFileHandler(os.path.join(log_dir, "audit.log"), maxBytes=10*1024*1024, backupCount=5)
    file_handler.setFormatter(formatter)
    audit_logger.addHandler(file_handler)
except Exception as e:
    audit_logger.warning(f"Failed to initialize file logger: {e}")

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def log_audit(db: AsyncSession, action: str, ip: str, details: str = None, user_id: int = None):
    # Log to flat file & terminal
    audit_logger.info(f"ACTION: {action} | IP: {ip} | USER_ID: {user_id} | DETAILS: {details}")
    # Log to SQL Database
    audit_entry = AuditLog(user_id=user_id, action=action, ip_address=ip, details=details)
    db.add(audit_entry)
    await db.commit()

@router.post("/login")
async def login(response: Response, request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    client_ip = request.client.host if request.client else "unknown"

    if not user:
        await log_audit(db, "LOGIN_FAILURE", client_ip, f"Failed attempt for email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        await log_audit(db, "LOGIN_INACTIVE_DENIED", client_ip, f"Inactive user login attempt: {user.email}", user_id=user.id)
        raise HTTPException(status_code=400, detail="Inactive user")

    # Lockout check
    if user.locked_until:
        if datetime.utcnow() < user.locked_until:
            remaining = int((user.locked_until - datetime.utcnow()).total_seconds())
            await log_audit(db, "LOGIN_LOCKED_DENIED", client_ip, f"Locked account attempt: {user.email}", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked. Try again in {remaining} seconds."
            )
        else:
            # Lock has expired natively, reset failure counters
            user.locked_until = None
            user.failed_login_attempts = 0
            db.add(user)
            await db.commit()

    if not verify_password(form_data.password, user.hashed_password):
        # Log failed attempt and track brute-force lockouts
        user.failed_login_attempts += 1
        audit_msg = f"Failed attempt for email: {form_data.username}"
        
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(seconds=60)
            audit_msg = f"Account locked after 5 failed attempts: {form_data.username}"
        
        db.add(user)
        await db.commit()

        await log_audit(db, "LOGIN_FAILURE", client_ip, audit_msg, user_id=user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, jti = create_access_token(
        data={"email": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Successful Login: Reset bad attempt counters and Bind JTI Concurrent Session!
    user.failed_login_attempts = 0
    user.locked_until = None
    user.active_session_jti = jti
    db.add(user)
    await db.commit()
    
    # Write the HttpOnly Secure Cookie specifically attached to the Response object
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False, # Set to False for localhost HTTP development. Use True in production with TLS!
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    await log_audit(db, "LOGIN_SUCCESS", client_ip, "Successful login", user_id=user.id)
    return {"message": "Login successful"}

@router.post("/logout")
async def logout(response: Response, request: Request, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    # Explicit Server-Side Session revocation
    current_user.active_session_jti = None
    db.add(current_user)
    await db.commit()
    
    # Clear the Cookie physically from the Browser Engine
    response.delete_cookie("access_token")
    
    client_ip = request.client.host if request.client else "unknown"
    await log_audit(db, "LOGOUT", client_ip, f"User {current_user.email} successfully logged out.", user_id=current_user.id)
    return {"message": "Logged out securely"}


@router.post("/change-password", response_model=dict)
async def change_password(
    request: Request,
    password_data: UserChangePassword, 
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.add(current_user)
    
    client_ip = request.client.host if request.client else "unknown"
    await log_audit(db, "PASSWORD_CHANGED", client_ip, "User successfully changed password", user_id=current_user.id)
    await db.commit()
    return {"message": "Password changed successfully"}

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    user_in: UserCreate, 
    current_admin: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Only Administrators can add users (Least Privilege Principle).
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role="user" # Forcing role to always be 'user' to restrict admin escalation
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    client_ip = request.client.host if request.client else "unknown"
    await log_audit(db, "USER_CREATED", client_ip, f"Created new user {new_user.email} with role {new_user.role}", user_id=current_admin.id)
    
    return new_user

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
