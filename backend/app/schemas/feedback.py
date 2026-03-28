import re
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class FeedbackCreate(BaseModel):
    name: str
    subject: str
    email: EmailStr
    message: str

    @field_validator("name", "subject")
    @classmethod
    def no_special_chars(cls, v: str, info) -> str:
        if not re.match(r"^[a-zA-Z0-9 _\-\.]+$", v):
            raise ValueError(f"{info.field_name} contains invalid characters")
        if len(v) > 150:
            raise ValueError(f"{info.field_name} must be 150 characters or fewer")
        return v.strip()

    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        # Block common injection / XSS characters
        dangerous = re.compile(r"[<>\"';\\-]{2,}|--|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b", re.IGNORECASE)
        if dangerous.search(v):
            raise ValueError("Message contains potentially unsafe content")
        if len(v) > 500:
            raise ValueError("Message must be 500 characters or fewer")
        return v.strip()


class FeedbackResponse(BaseModel):
    id: int
    name: str
    subject: str
    created_at: datetime
    original_filename: str | None = None

    class Config:
        from_attributes = True
