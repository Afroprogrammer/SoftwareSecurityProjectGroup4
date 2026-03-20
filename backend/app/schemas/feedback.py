from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    # Field validation directly mitigates mass assignment and restricts unusually large payloads
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=5000)

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    message: str
    file_path: Optional[str] = None

    class Config:
        from_attributes = True
