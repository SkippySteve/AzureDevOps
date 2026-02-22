from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .auth_handler import decode_jwt
from ..db import SessionDep
from sqlmodel import select
from .. import models

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request, db: SessionDep):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not await self.verify_jwt(credentials.credentials, db):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    async def verify_jwt(self, jwtoken: str, db: SessionDep) -> bool:
        is_token_valid: bool = False

        try:
            payload = decode_jwt(jwtoken)
        except:
            payload = None
        if payload:
            stmt = select(models.User).where(models.User.email == payload["user_id"])
            result = await db.execute(statement=stmt)
            db_user = result.scalars().first()
            if db_user is not None and db_user.active == True:
                is_token_valid = True
        return is_token_valid
    
class AdminJWTBearer(JWTBearer):
    async def __call__(self, request: Request, db: SessionDep):
        token = await super().__call__(request, db)
        if not await self.verify_admin(token, db):
            raise HTTPException(status_code=403, detail="Admin access required")
        return token

    async def verify_admin(self, jwtoken: str, db: SessionDep) -> bool:
        is_admin_token_valid: bool = False

        try:
            payload = decode_jwt(jwtoken)
        except:
            payload = None
        if payload:
            stmt = select(models.User).where(models.User.email == payload["user_id"])
            result = await db.execute(statement=stmt)
            db_user = result.scalars().first()
            if db_user is not None and db_user.admin == True and db_user.active == True:
                is_admin_token_valid = True
        return is_admin_token_valid