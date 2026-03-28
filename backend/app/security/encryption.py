import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_key = os.getenv("FERNET_KEY")
if not _key:
    raise ValueError("FERNET_KEY environment variable is not set!")

_fernet = Fernet(_key.encode())


def encrypt_field(value: str) -> str:
    """Encrypt a plaintext string and return a base64-encoded token."""
    return _fernet.encrypt(value.encode()).decode()


def decrypt_field(token: str) -> str:
    """Decrypt a Fernet token and return the original plaintext."""
    return _fernet.decrypt(token.encode()).decode()
