from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=True) # Stores secure reference to uploaded file if any
    created_at = Column(DateTime(timezone=True), server_default=func.now())
