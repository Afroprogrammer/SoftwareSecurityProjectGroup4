from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, AuditLog
from app.schemas.user import Token, UserCreate, UserResponse, UserChangePassword
from app.security.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.security.deps import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def log_audit(db: AsyncSession, action: str, ip: str, details: str = None, user_id: int = None):
    audit_entry = AuditLog(user_id=user_id, action=action, ip_address=ip, details=details)
    db.add(audit_entry)
    await db.commit()

@router.post("/login", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(form_data.password, user.hashed_password):
        # Log failed attempt (Graduate Enhancement)
        await log_audit(db, "LOGIN_FAILURE", client_ip, f"Failed attempt for email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        await log_audit(db, "LOGIN_INACTIVE_DENIED", client_ip, f"Inactive user login attempt: {user.email}", user_id=user.id)
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"email": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    await log_audit(db, "LOGIN_SUCCESS", client_ip, "Successful login", user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


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
        role=user_in.role
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
