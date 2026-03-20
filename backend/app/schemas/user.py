from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=12, description="Must be at least 12 characters.") # Strong password enforcement
    role: Optional[str] = "user"

class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=12)

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
