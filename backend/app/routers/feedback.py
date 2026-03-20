import os
import secrets
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.feedback import Feedback
from app.security.deps import get_current_active_user
from app.routers.auth import log_audit

router = APIRouter(prefix="/feedback", tags=["Feedback"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_FILE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
    "text/plain": ".txt"
}
MAX_FILE_SIZE = 2 * 1024 * 1024 # 2 Megabytes
    
@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: Request,
    subject: str = Form(..., max_length=255),
    message: str = Form(..., max_length=5000),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Secure feedback endpoint with optional file upload (Graduate Enhancement).
    """
    client_ip = request.client.host if request.client else "unknown"
    saved_file_path = None
    
    if file:
        # 1. Type Validation (MIME type check instead of just extension)
        if file.content_type not in ALLOWED_FILE_TYPES:
            await log_audit(db, "FILE_UPLOAD_REJECTED", client_ip, f"Invalid file type attempted: {file.content_type}", user_id=current_user.id)
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, PDF, and TXT are allowed.")
            
        # 2. Size Validation (read chunks)
        # Note: FastAPI loads files into memory or temp files automatically, but we can verify size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            await log_audit(db, "FILE_UPLOAD_REJECTED", client_ip, "File too large", user_id=current_user.id)
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB.")
            
        # Reset file cursor for saving
        await file.seek(0)
        
        # 3. Safe Storage (Randomized name, strict directory)
        ext = ALLOWED_FILE_TYPES[file.content_type]
        safe_filename = f"{secrets.token_hex(16)}{ext}"
        saved_file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        try:
            with open(saved_file_path, "wb") as buffer:
                buffer.write(content)
        except Exception as e:
            await log_audit(db, "FILE_UPLOAD_ERROR", client_ip, str(e), user_id=current_user.id)
            raise HTTPException(status_code=500, detail="Could not save file securely.")
            
    # Save Feedback Data
    new_feedback = Feedback(
        user_id=current_user.id,
        subject=subject,
        message=message,
        file_path=saved_file_path
    )
    db.add(new_feedback)
    await db.commit()
    await log_audit(db, "FEEDBACK_SUBMITTED", client_ip, f"Feedback ID {new_feedback.id} submitted.", user_id=current_user.id)
    
    return {"message": "Feedback submitted safely.", "file_saved": bool(saved_file_path)}
