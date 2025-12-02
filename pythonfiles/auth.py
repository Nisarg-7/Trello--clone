from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, APIRouter, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from starlette import status
from fastapi.security import OAuth2PasswordBearer
from .database import get_db
from .database_models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl = '/login/')


SECRET_KEY = '16a45ed832ffccbd35cfd9ca4c85e006'
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30

bcrypt_context = CryptContext(schemes =['bcrypt'], deprecated = 'auto')

credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials", headers = {"WWW-Authenticate": "Bearer"})


def get_password_hash(plain_password: str) -> str:
    return bcrypt_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    

    user = db.query(User).filter(User.email_address == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user
    
