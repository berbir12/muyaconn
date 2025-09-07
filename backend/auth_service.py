import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.jwt_secret = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
        self.jwt_algorithm = 'HS256'
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        
        encoded_jwt = jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create a JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        encoded_jwt = jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            
            # Check if token is expired
            if datetime.utcnow() > datetime.fromtimestamp(payload.get("exp", 0)):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired"
                )
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with Supabase"""
        try:
            # Use Supabase auth to verify credentials
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Get user profile
                profile = await self.get_user_profile(response.user.id)
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "profile": profile
                }
            
            return None
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from database"""
        try:
            response = self.supabase.table('profiles').select('*').eq('id', user_id).single().execute()
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return None

    async def create_user_profile(self, user_id: str, email: str, profile_data: Dict[str, Any]) -> bool:
        """Create user profile in database"""
        try:
            profile = {
                "id": user_id,
                "email": email,
                "role": "customer",  # Default role
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                **profile_data
            }
            
            response = self.supabase.table('profiles').insert(profile).execute()
            return response.data is not None
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return False

    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile in database"""
        try:
            updates["updated_at"] = datetime.utcnow().isoformat()
            response = self.supabase.table('profiles').update(updates).eq('id', user_id).execute()
            return response.data is not None
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False

    async def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information from token"""
        try:
            payload = self.verify_token(token)
            user_id = payload.get("sub")
            
            if not user_id:
                return None
            
            profile = await self.get_user_profile(user_id)
            if not profile:
                return None
            
            return {
                "id": user_id,
                "email": payload.get("email"),
                "role": profile.get("role", "customer"),
                "profile": profile
            }
        except Exception as e:
            logger.error(f"Error getting user by token: {e}")
            return None

    def check_permission(self, user_role: str, required_role: str) -> bool:
        """Check if user has required permission"""
        role_hierarchy = {
            "customer": 1,
            "tasker": 2,
            "admin": 3
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        return user_level >= required_level

    async def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """Refresh access token using refresh token"""
        try:
            payload = self.verify_token(refresh_token)
            
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            user_id = payload.get("sub")
            if not user_id:
                return None
            
            # Create new access token
            token_data = {
                "sub": user_id,
                "email": payload.get("email"),
                "role": payload.get("role", "customer")
            }
            
            return self.create_access_token(token_data)
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
