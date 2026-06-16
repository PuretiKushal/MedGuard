from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, User
import hashlib
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "medguard_secret")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: int, facility_id: int) -> str:
    payload = {
        "user_id": user_id,
        "facility_id": facility_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or user.hashed_password != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id, user.facility_id)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "facility_id": user.facility_id}
    }
