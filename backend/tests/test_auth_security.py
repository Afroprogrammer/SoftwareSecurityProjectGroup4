import pytest
from datetime import timedelta
import jwt

# Import raw security functions for isolated testing
from app.security.auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM

def test_password_hashing_security():
    """
    Test that bcrypt securely destructs a plaintext password 
    and mathematically verifies the crypt-hash accurately.
    """
    raw_password = "SuperSecurePassword123!"
    
    # The hash should physically scramble the password (one-way encryption)
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert len(hashed) > 20  # Bcrypt hashes are robust
    
    # The hashing algorithm must mathematically verify the original string
    assert verify_password(raw_password, hashed) is True
    
    # An incorrect password must structurally fail the hash comparison
    assert verify_password("HackerPassword!", hashed) is False

def test_jwt_creation_and_jti_binding():
    """
    Test that the JWT Engine generates a mathematically signed 
    token alongside a highly-unique JTI UUID for Server-Side Revocation.
    """
    payload = {"email": "admin@university.edu", "role": "admin"}
    expiration = timedelta(minutes=15)
    
    # Generate the token
    token, jti = create_access_token(payload, expires_delta=expiration)
    
    # 1. The token must be an encoded string
    assert isinstance(token, str)
    assert len(token) > 50
    
    # 2. The JTI MUST be a 32-character hexadecimal UUID string
    assert isinstance(jti, str)
    assert len(jti) == 32
    
    # 3. Mathematically decode the token to prove the payload hasn't been corrupted
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["email"] == "admin@university.edu"
    assert decoded["role"] == "admin"
    assert decoded["jti"] == jti  # The Database Revocation Key must be inside the token!
