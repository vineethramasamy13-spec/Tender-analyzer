import base64
import hashlib
from cryptography.fernet import Fernet
from config import settings

def get_encryption_key() -> bytes:
    """Derive a stable 32-byte base64 key from the app's SECRET_KEY for Fernet encryption."""
    key_hash = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key_hash)

def encrypt_val(val: str) -> str:
    """Encrypt a plain text string."""
    if not val:
        return ""
    try:
        f = Fernet(get_encryption_key())
        return f.encrypt(val.encode()).decode()
    except Exception:
        return ""

def decrypt_val(encrypted_val: str) -> str:
    """Decrypt an encrypted string, returning the original value on failure (migration support)."""
    if not encrypted_val:
        return ""
    try:
        f = Fernet(get_encryption_key())
        return f.decrypt(encrypted_val.encode()).decode()
    except Exception:
        return encrypted_val
