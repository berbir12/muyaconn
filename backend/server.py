from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from supabase import create_client, Client
import jwt
from auth_service import AuthService
from payment_routes import router as payment_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Supabase client with fallback handling
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = None
supabase_admin: Client = None
supabase_available = False
auth_service: AuthService = None

if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        if SUPABASE_SERVICE_ROLE_KEY:
            supabase_admin = create_client(supabase_url, SUPABASE_SERVICE_ROLE_KEY)
        # Test connection with a simple query
        response = supabase.from_('profiles').select('id').limit(1).execute()
        supabase_available = True
        auth_service = AuthService(supabase)
        print("✅ Supabase client initialized and connected successfully")
    except Exception as e:
        print(f"⚠️ Supabase connection failed: {e}")
        print("📝 Using fallback mode with mock data")
        supabase = None
        supabase_admin = None
        supabase_available = False
        auth_service = None
else:
    print("⚠️ Supabase credentials not found, using fallback mode")
    supabase_available = False
    auth_service = None

# Mock data for when Supabase is unavailable
MOCK_CATEGORIES = [
    {
        "id": "1",
        "name": "Mounting & Installation",
        "slug": "mounting-installation",
        "description": "TV mounting, furniture assembly, and installation services",
        "icon": "hammer-outline",
        "color": "#3B82F6",
        "is_active": True,
        "sort_order": 1
    },
    {
        "id": "2", 
        "name": "Furniture Assembly",
        "slug": "furniture-assembly",
        "description": "IKEA and furniture assembly services",
        "icon": "hammer-outline",
        "color": "#10B981",
        "is_active": True,
        "sort_order": 2
    },
    {
        "id": "3",
        "name": "Moving Help",
        "slug": "moving-help", 
        "description": "Packing, loading, and moving assistance",
        "icon": "car-outline",
        "color": "#F59E0B",
        "is_active": True,
        "sort_order": 3
    },
    {
        "id": "4",
        "name": "Cleaning",
        "slug": "cleaning",
        "description": "House cleaning and deep cleaning services", 
        "icon": "sparkles-outline",
        "color": "#8B5CF6",
        "is_active": True,
        "sort_order": 4
    },
    {
        "id": "5",
        "name": "Delivery",
        "slug": "delivery",
        "description": "Pickup and delivery services",
        "icon": "bicycle-outline", 
        "color": "#06B6D4",
        "is_active": True,
        "sort_order": 5
    },
    {
        "id": "6",
        "name": "Handyman",
        "slug": "handyman",
        "description": "General repairs and maintenance",
        "icon": "build-outline",
        "color": "#84CC16", 
        "is_active": True,
        "sort_order": 6
    },
    {
        "id": "7",
        "name": "Electrical",
        "slug": "electrical",
        "description": "Electrical repairs and installations",
        "icon": "flash-outline",
        "color": "#EF4444",
        "is_active": True,
        "sort_order": 7
    },
    {
        "id": "8",
        "name": "Plumbing", 
        "slug": "plumbing",
        "description": "Plumbing repairs and maintenance",
        "icon": "water-outline",
        "color": "#F97316",
        "is_active": True,
        "sort_order": 8
    },
    {
        "id": "9",
        "name": "Painting",
        "slug": "painting", 
        "description": "Interior and exterior painting",
        "icon": "color-palette-outline",
        "color": "#EC4899",
        "is_active": True,
        "sort_order": 9
    },
    {
        "id": "10",
        "name": "Yard Work",
        "slug": "yard-work",
        "description": "Gardening, landscaping, and yard maintenance", 
        "icon": "leaf-outline",
        "color": "#22C55E",
        "is_active": True,
        "sort_order": 10
    }
]

MOCK_PROFILE = {
    "id": "mock-user-123",
    "full_name": "Demo User",
    "username": "demo_user", 
    "email": "demo@skillhub.app",
    "phone": "+1234567890",
    "role": "customer",
    "avatar_url": None,
    "bio": "Welcome to SkillHub! This is a demo profile.",
    "location": "San Francisco, CA",
    "average_rating": 4.8,
    "total_reviews": 25,
    "available": True,
    "verified": True,
    "created_at": "2024-01-01T00:00:00Z"
}

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(
    title="SkillHub API",
    description="API for the SkillHub service marketplace",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class UserRole(str):
    CUSTOMER = "customer"
    TASKER = "tasker"

class UserProfile(BaseModel):
    id: str
    username: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class ServiceCategory(BaseModel):
    id: str
    name: str
    icon: str
    description: str

class BookingStatus(str):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Booking(BaseModel):
    id: str
    customer_id: str
    technician_id: Optional[str] = None
    service_type: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: str = BookingStatus.PENDING
    created_at: datetime
    updated_at: datetime
    location: Optional[Dict[str, Any]] = None

class CreateBooking(BaseModel):
    service_type: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    location: Optional[Dict[str, Any]] = None

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        if not auth_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable"
            )
        
        token = credentials.credentials
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No token provided"
            )
        
        # Verify token and get user info
        user = await auth_service.get_user_by_token(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or user not found"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

# Role-based access control
def require_role(required_role: str):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if not auth_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable"
            )
        
        user_role = current_user.get("role", "customer")
        if not auth_service.check_permission(user_role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )
        
        return current_user
    return role_checker

# Authentication Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    username: str
    phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Routes
@api_router.get("/")
async def root():
    return {"message": "SkillHub API", "version": "1.0.0"}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """Authenticate user and return tokens"""
    if not auth_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
    
    user = await auth_service.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create tokens
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["profile"].get("role", "customer")
    }
    
    access_token = auth_service.create_access_token(token_data)
    refresh_token = auth_service.create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user
    )

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(register_data: RegisterRequest):
    """Register new user and return tokens"""
    if not auth_service or not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": register_data.email,
            "password": register_data.password
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        # Create user profile
        profile_data = {
            "full_name": register_data.full_name,
            "username": register_data.username,
            "phone": register_data.phone
        }
        
        success = await auth_service.create_user_profile(
            auth_response.user.id,
            register_data.email,
            profile_data
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )
        
        # Get user profile
        profile = await auth_service.get_user_profile(auth_response.user.id)
        
        # Create tokens
        token_data = {
            "sub": auth_response.user.id,
            "email": register_data.email,
            "role": "customer"
        }
        
        access_token = auth_service.create_access_token(token_data)
        refresh_token = auth_service.create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": auth_response.user.id,
                "email": register_data.email,
                "profile": profile
            }
        )
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed"
        )

@api_router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token using refresh token"""
    if not auth_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
    
    new_access_token = await auth_service.refresh_access_token(refresh_token)
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    return {"access_token": new_access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@api_router.get("/health")
async def health_check():
    supabase_status = "connected" if supabase_available else "fallback_mode"
    
    if supabase_available and supabase:
        try:
            # Test Supabase connection
            response = supabase.table('profiles').select('id').limit(1).execute()
            supabase_status = "connected"
        except:
            supabase_status = "fallback_mode"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "supabase": supabase_status,
        "version": "1.0.0"
    }

@api_router.post("/setup-database")
async def setup_database(current_user: dict = Depends(require_role("admin"))):
    """Setup the database schema for TaskRabbit-like app"""
    try:
        # Create profiles table
        profiles_sql = """
        CREATE TABLE IF NOT EXISTS profiles (
          id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email text UNIQUE NOT NULL,
          full_name text NOT NULL,
          username text UNIQUE NOT NULL,
          avatar_url text,
          phone text,
          role text CHECK (role IN ('customer', 'tasker')) NOT NULL DEFAULT 'customer',
          hourly_rate decimal(10,2),
          bio text,
          skills text[],
          available boolean DEFAULT true,
          verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
          address text,
          city text,
          state text,
          zip_code text,
          latitude decimal(10, 8),
          longitude decimal(11, 8),
          total_tasks_completed integer DEFAULT 0,
          average_rating decimal(3,2) DEFAULT 0,
          total_reviews integer DEFAULT 0,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        """
        
        # Execute using service role
        result = supabase_admin.rpc('exec_sql', {'sql': profiles_sql}).execute()
        
        return {"message": "Database setup completed", "result": result.data}
    except Exception as e:
        logger.error(f"Database setup error: {e}")
        return {"message": "Database setup failed", "error": str(e)}

@api_router.get("/service-categories")
async def get_service_categories():
    """Get TaskRabbit-style service categories"""
    if supabase_available and supabase:
        try:
            response = supabase.from_('task_categories').select('*').eq('is_active', True).order('sort_order').execute()
            if response.data:
                return response.data
        except Exception as e:
            print(f"⚠️ Failed to fetch categories from Supabase: {e}")
    
    # Return mock data as fallback
    return MOCK_CATEGORIES

@api_router.get("/profiles/{user_id}")
async def get_profile(user_id: str):
    if supabase_available and supabase:
        try:
            response = supabase.table('profiles').select('*').eq('id', user_id).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            print(f"⚠️ Failed to fetch profile from Supabase: {e}")
    
    # Return mock profile as fallback
    mock_profile = MOCK_PROFILE.copy()
    mock_profile["id"] = user_id  # Use the requested user_id
    return mock_profile

@api_router.get("/bookings")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    try:
        # For demo, return empty list
        # In production, query Supabase based on user role
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/bookings")
async def create_booking(booking: CreateBooking, current_user: dict = Depends(get_current_user)):
    try:
        # For demo, return a mock booking
        # In production, create booking in Supabase
        new_booking = {
            "id": str(uuid.uuid4()),
            "customer_id": current_user["id"],
            "service_type": booking.service_type,
            "description": booking.description,
            "scheduled_at": booking.scheduled_at,
            "status": BookingStatus.PENDING,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "location": booking.location
        }
        return new_booking
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)
app.include_router(payment_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


