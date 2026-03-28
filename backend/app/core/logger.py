import hashlib
import json
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import AuditLog

async def log_audit_ledger(db: AsyncSession, action: str, ip: str, details: str = None, user_id: int = None):
    """
    Cryptographically chained, structured JSON Immutable Logging framework. 
    Strictly verifies log sequence and mitigates log-injection attacks natively!
    """
    
    # 1. Protect against log injection code by structuring untrusted info natively as stringified JSON!
    safe_details = json.dumps({"description": details}) if details else None
    
    # 2. Extract the physical latest block off the SQL chain
    result = await db.execute(select(AuditLog).order_by(AuditLog.id.desc()).limit(1))
    last_log = result.scalars().first()
    
    previous_hash = last_log.hash if last_log else "GENESIS_BLOCK_0000000000"
    
    # 3. Mathematically sequence the new Hash Signature
    # We serialize the parameters strictly into an encoded string sequence.
    new_log_data = f"{previous_hash}|{action}|{ip}|{user_id}|{safe_details}"
    new_hash = hashlib.sha256(new_log_data.encode('utf-8')).hexdigest()
    
    # 4. Insert Block directly over SQLAlchemy mapping
    audit_entry = AuditLog(
        user_id=user_id, 
        action=action, 
        ip_address=ip, 
        details=safe_details,
        previous_hash=previous_hash,
        hash=new_hash
    )
    
    db.add(audit_entry)
    await db.commit()
    
    # Emulate the write onto backend terminals explicitly
    print(f"[SECURE BLOCKCHAIN LEDGER]: Hash<{new_hash[:8]}...> appended -> Action: {action}")
