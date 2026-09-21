import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "720")
)

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password):
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(password, password_hash):
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8")
    )


def create_access_token(subject, role):
    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": subject,
        "role": role,
        "exp": expire
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token):
    try:
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )


def get_current_principal(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    payload = decode_access_token(credentials.credentials)

    return {
        "id": payload["sub"],
        "role": payload["role"]
    }


def get_current_admin(
    principal: dict = Depends(get_current_principal)
):
    if principal["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    return principal["id"]


def get_current_student(
    principal: dict = Depends(get_current_principal)
):
    if principal["role"] != "student":
        raise HTTPException(
            status_code=403,
            detail="Student access required."
        )

    return principal["id"]


def require_self_or_admin(student_id, principal):
    if principal["role"] == "admin":
        return

    if principal["role"] == "student" and principal["id"] == student_id:
        return

    raise HTTPException(
        status_code=403,
        detail="You may only access your own student record."
    )
