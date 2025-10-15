# ====================================================================
# ENTITY-DRIVEN CLEAN ARCHITECTURE - PYTHON EXAMPLES
# 
# GitHub: https://github.com/[tu-usuario]/entity-driven-clean-architecture
# License: MIT
# 
# This file contains complete, functional examples of:
# - Result Envelope Pattern
# - Command/Query with nested DataIn/DataOut/Messages
# - Snowflake ID Generator
# - Dependency Injection setup
# - Clean helpers
# 
# For full documentation, see README.md
# ====================================================================

# ====================================================================
# ENTITY-DRIVEN CLEAN ARCHITECTURE - PYTHON IMPLEMENTATION EXAMPLES
# Updated: Nested DataIn/DataOut/Messages Structure
# ====================================================================

# ====================================================================
# 1. RESULT ENVELOPE PATTERN
# ====================================================================

from dataclasses import dataclass, field
from typing import Generic, TypeVar, List, Optional
from datetime import datetime

T = TypeVar('T')

@dataclass
class InvalidPropertyInfo:
    property_name: str
    user_message: str
    validation_message: str
    validation_code: str

@dataclass
class Messages:
    api_message: str = ""
    user_message: str = ""

class ResultStates:
    SUCCESS = "success"
    UNSUCCESS = "unsuccess"
    EMPTY = "empty"
    INVALID = "invalid"
    ERROR = "error"

@dataclass
class Result(Generic[T]):
    state: str = ResultStates.SUCCESS
    code: str = ""
    message: Messages = field(default_factory=Messages)
    data: Optional[T] = None
    invalid_fields: List[InvalidPropertyInfo] = field(default_factory=list)

# ====================================================================
# 2. ENTITY (Persistence Model) - Shared
# ====================================================================

@dataclass
class User:
    """User entity - Persistence model shared across all User operations"""
    user_id: int  # Snowflake ID
    email: str = ""
    name: str = ""
    password_hash: str = ""
    password_salt: str = ""
    created_at: Optional[datetime] = None  # Always UTC
    updated_at: Optional[datetime] = None
    status: str = "active"
    fail_login_count: Optional[int] = 0
    last_login_attempt_date: Optional[datetime] = None

# ====================================================================
# 3. COMMAND WITH NESTED STRUCTURE (Complete Example)
# ====================================================================

import bcrypt

class UserCCreate:
    """
    UserCCreate - Command to create a new user
    Contains all related DTOs and Messages as nested classes
    """
    
    # region Nested Classes - Data Transfer Objects
    
    @dataclass
    class DataIn:
        """DataIn - Explicit: Data coming INTO the Handler"""
        email: str
        name: str
        password: str
    
    @dataclass
    class DataOut:
        """DataOut - Explicit: Data going OUT of the Handler"""
        user_id: int
        email: str
        name: str
        created_at: datetime  # UTC
    
    class Messages:
        """Messages - Multilanguage messages for this operation"""
        
        _messages = {
            "en": {
                "email_required": Messages(
                    api_message="Email is required",
                    user_message="Please enter your email address"
                ),
                "email_exists": Messages(
                    api_message="Email already exists",
                    user_message="This email is already registered"
                ),
                "password_too_short": Messages(
                    api_message="Password must be at least 8 characters",
                    user_message="Password must be at least 8 characters"
                )
            },
            "es": {
                "email_required": Messages(
                    api_message="El correo es requerido",
                    user_message="Por favor ingrese su correo electrónico"
                ),
                "email_exists": Messages(
                    api_message="El correo ya existe",
                    user_message="Este correo ya está registrado"
                ),
                "password_too_short": Messages(
                    api_message="La contraseña debe tener al menos 8 caracteres",
                    user_message="La contraseña debe tener al menos 8 caracteres"
                )
            }
        }
        
        @staticmethod
        def get(language: str, key: str) -> Messages:
            if language not in UserCCreate.Messages._messages:
                language = "en"
            return UserCCreate.Messages._messages[language].get(key, Messages())
    
    # endregion
    
    # region Constructor
    
    def __init__(
        self,
        id_generator,  # ISnowflakeIdGenerator
        repository,  # IUserRepository
        email_service,  # IEmailService
        datetime_provider,  # IDateTimeProvider
        language: str = "en"
    ):
        self._id_generator = id_generator
        self._repository = repository
        self._email_service = email_service
        self._datetime_provider = datetime_provider
        self._language = language
    
    # endregion
    
    # region Handler Method
    
    async def handler(self, input_dto: DataIn) -> Result[DataOut]:
        """Handler - Main entry point for UserCCreate command"""
        
        try:
            # region Clean
            input_dto.email = clean(input_dto.email).lower() if input_dto.email else ""
            input_dto.name = clean(input_dto.name) if input_dto.name else ""
            input_dto.password = input_dto.password.strip() if input_dto.password else ""
            # endregion
            
            # region Validation
            prefix = "USER_CREATE"
            
            if not input_dto.email:
                return Result(
                    state=ResultStates.INVALID,
                    message=self.Messages.get(self._language, "email_required"),
                    code=f"{prefix}:EMAIL_REQUIRED"
                )
            
            if len(input_dto.password) < 8:
                return Result(
                    state=ResultStates.INVALID,
                    message=self.Messages.get(self._language, "password_too_short"),
                    code=f"{prefix}:PASSWORD_TOO_SHORT"
                )
            # endregion
            
            # region Business Rules
            if await self._repository.exists_by_email(input_dto.email):
                return Result(
                    state=ResultStates.UNSUCCESS,
                    message=self.Messages.get(self._language, "email_exists"),
                    code=f"{prefix}:EMAIL_EXISTS"
                )
            # endregion
            
            # region Process
            # Generate Snowflake ID
            user_id = self._id_generator.generate_id()
            
            user = User(
                user_id=user_id,
                email=input_dto.email,
                name=input_dto.name,
                password_hash=self._hash_password(input_dto.password),
                created_at=self._datetime_provider.utc_now(),  # Always UTC
                status="active"
            )
            
            await self._repository.create(user)
            await self._email_service.send_welcome_email(user.email, user.name)
            
            return Result(
                state=ResultStates.SUCCESS,
                message=Messages(),
                code=f"{prefix}:SUCCESS",
                data=self._map_to_data_out(user)
            )
            # endregion
            
        except Exception as ex:
            return Result(
                state=ResultStates.ERROR,
                message=Messages(),
                code="USER_CREATE:SYSTEM_ERROR"
            )
    
    # endregion
    
    # region Private Mappers
    
    def _map_to_data_out(self, user: User) -> DataOut:
        return self.DataOut(
            user_id=user.user_id,
            email=user.email,
            name=user.name,
            created_at=user.created_at
        )
    
    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    # endregion

# ====================================================================
# 4. QUERY WITH NESTED STRUCTURE (Example)
# ====================================================================

class UserQGetByID:
    """
    UserQGetByID - Query to get user by ID
    Contains all related DTOs and Messages as nested classes
    """
    
    # region Nested Classes
    
    @dataclass
    class DataIn:
        """DataIn - Explicit: Data coming INTO the Handler"""
        user_id: int
    
    @dataclass
    class DataOut:
        """DataOut - Explicit: Data going OUT of the Handler"""
        user_id: int
        email: str
        name: str
        created_at: datetime  # UTC
    
    class Messages:
        """Messages - Multilanguage messages for this operation"""
        
        _messages = {
            "en": {
                "user_not_found": Messages(
                    api_message="User not found",
                    user_message="The requested user was not found"
                )
            },
            "es": {
                "user_not_found": Messages(
                    api_message="Usuario no encontrado",
                    user_message="El usuario solicitado no fue encontrado"
                )
            }
        }
        
        @staticmethod
        def get(language: str, key: str) -> Messages:
            if language not in UserQGetByID.Messages._messages:
# ====================================================================
# ENTITY-DRIVEN CLEAN ARCHITECTURE - PYTHON IMPLEMENTATION EXAMPLES
# ====================================================================

# ====================================================================
# 1. RESULT ENVELOPE PATTERN
# ====================================================================

from dataclasses import dataclass, field
from typing import Generic, TypeVar, List, Optional
from datetime import datetime

T = TypeVar('T')

@dataclass
class InvalidPropertyInfo:
    property_name: str
    user_message: str
    validation_message: str
    validation_code: str

@dataclass
class Messages:
    api_message: str = ""
    user_message: str = ""

class ResultStates:
    SUCCESS = "success"
    UNSUCCESS = "unsuccess"
    EMPTY = "empty"
    INVALID = "invalid"
    ERROR = "error"

@dataclass
class Result(Generic[T]):
    state: str = ResultStates.SUCCESS
    code: str = ""
    message: Messages = field(default_factory=Messages)
    data: Optional[T] = None
    invalid_fields: List[InvalidPropertyInfo] = field(default_factory=list)

class ResultCheckData:
    @staticmethod
    def multiple(dataset: List[T]) -> Result[List[T]]:
        try:
            if dataset:
                return Result(
                    state=ResultStates.SUCCESS,
                    message=Messages(),
                    data=dataset
                )
            else:
                return Result(
                    state=ResultStates.EMPTY,
                    message=Messages()
                )
        except Exception as ex:
            return Result(
                state=ResultStates.ERROR,
                message=Messages()
            )
    
    @staticmethod
    def single(dataset: List[T]) -> Result[T]:
        try:
            if dataset:
                return Result(
                    state=ResultStates.SUCCESS,
                    message=Messages(),
                    data=dataset[0] if dataset else None
                )
            else:
                return Result(
                    state=ResultStates.EMPTY,
                    message=Messages()
                )
        except Exception as ex:
            return Result(
                state=ResultStates.ERROR,
                message=Messages()
            )

# ====================================================================
# 2. ENTITY (Persistence Model)
# ====================================================================

@dataclass
class User:
    """User entity - Represents database persistence model"""
    user_id: Optional[int] = None
    email: str = ""
    name: str = ""
    password_hash: str = ""
    password_salt: str = ""
    created_at: Optional[datetime] = None  # Always UTC
    updated_at: Optional[datetime] = None  # Always UTC
    status: str = "active"
    fail_login_count: Optional[int] = 0
    last_login_attempt_date: Optional[datetime] = None

# ====================================================================
# 3. INPUT DTO
# ====================================================================

@dataclass
class UserCRegisterI:
    """Input DTO for UserCRegister command"""
    email: str
    name: str
    password: str

# ====================================================================
# 4. OUTPUT DTO
# ====================================================================

@dataclass
class UserCRegisterO:
    """Output DTO for UserCRegister command"""
    user_id: int
    email: str
    name: str
    created_at: datetime  # UTC

# ====================================================================
# 5. MESSAGES (Multilanguage)
# ====================================================================

class UserCRegisterM:
    """Messages for UserCRegister with multilanguage support"""
    
    _messages = {
        "en": {
            "email_required": Messages(
                api_message="Email is required",
                user_message="Please enter your email address"
            ),
            "email_already_exists": Messages(
                api_message="Email already exists",
                user_message="This email is already registered"
            ),
            "password_too_short": Messages(
                api_message="Password must be at least 8 characters",
                user_message="Password must be at least 8 characters"
            )
        },
        "es": {
            "email_required": Messages(
                api_message="El correo es requerido",
                user_message="Por favor ingrese su correo electrónico"
            ),
            "email_already_exists": Messages(
                api_message="El correo ya existe",
                user_message="Este correo ya está registrado"
            ),
            "password_too_short": Messages(
                api_message="La contraseña debe tener al menos 8 caracteres",
                user_message="La contraseña debe tener al menos 8 caracteres"
            )
        }
    }
    
    @staticmethod
    def get(language: str, key: str) -> Messages:
        if language not in UserCRegisterM._messages:
            language = "en"
        
        if key not in UserCRegisterM._messages[language]:
            return Messages()
        
        return UserCRegisterM._messages[language][key]

# ====================================================================
# 6. COMMAND WITH HANDLER (Complete Example)
# ====================================================================

import bcrypt

class UserCRegister:
    def __init__(
        self,
        repository,  # IUserRepository
        email_service,  # IEmailService
        datetime_provider,  # IDateTimeProvider
        language: str = "en"
    ):
        self._repository = repository
        self._email_service = email_service
        self._datetime_provider = datetime_provider
        self._language = language
    
    async def handler(self, input_dto: UserCRegisterI) -> Result[UserCRegisterO]:
        """Handler method - Main entry point for command execution"""
        
        try:
            # region Clean
            input_dto.email = clean(input_dto.email).lower() if input_dto.email else ""
            input_dto.name = clean(input_dto.name) if input_dto.name else ""
            input_dto.password = input_dto.password.strip() if input_dto.password else ""
            # endregion
            
            # region Validation
            prefix = "USER_REGISTER"
            
            if not input_dto.email:
                return Result(
                    state=ResultStates.INVALID,
                    message=UserCRegisterM.get(self._language, "email_required"),
                    code=f"{prefix}:EMAIL_REQUIRED"
                )
            
            if len(input_dto.password) < 8:
                return Result(
                    state=ResultStates.INVALID,
                    message=UserCRegisterM.get(self._language, "password_too_short"),
                    code=f"{prefix}:PASSWORD_TOO_SHORT"
                )
            # endregion
            
            # region Business Rules
            existing_user = await self._repository.get_by_email(input_dto.email)
            if existing_user:
                return Result(
                    state=ResultStates.UNSUCCESS,
                    message=UserCRegisterM.get(self._language, "email_already_exists"),
                    code=f"{prefix}:EMAIL_EXISTS"
                )
            # endregion
            
            # region Process
            user = User(
                email=input_dto.email,
                name=input_dto.name,
                password_hash=self._hash_password(input_dto.password),
                created_at=self._datetime_provider.utc_now(),  # Always UTC
                status="active"
            )
            
            await self._repository.create(user)
            
            await self._email_service.send_welcome_email(user.email, user.name)
            
            return Result(
                state=ResultStates.SUCCESS,
                message=Messages(),
                code=f"{prefix}:SUCCESS",
                data=UserCRegisterO(
                    user_id=user.user_id,
                    email=user.email,
                    name=user.name,
                    created_at=user.created_at  # UTC
                )
            )
            # endregion
            
        except Exception as ex:
            return Result(
                state=ResultStates.ERROR,
                message=Messages(),
                code="USER_REGISTER:SYSTEM_ERROR"
            )
    
    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# ====================================================================
# 7. QUERY EXAMPLE
# ====================================================================

@dataclass
class UserQGetByIDI:
    user_id: int

@dataclass
class UserQGetByIDO:
    user_id: int
    email: str
    name: str
    created_at: datetime  # UTC

class UserQGetByID:
    def __init__(self, repository):
        self._repository = repository
    
    async def handler(self, input_dto: UserQGetByIDI) -> Result[UserQGetByIDO]:
        """Handler method - Returns user by ID"""
        
        try:
            # region Process
            user = await self._repository.get_by_id(input_dto.user_id)
            
            if not user:
                return Result(
                    state=ResultStates.EMPTY,
                    message=Messages()
                )
            
            return Result(
                state=ResultStates.SUCCESS,
                message=Messages(),
                data=UserQGetByIDO(
                    user_id=user.user_id,
                    email=user.email,
                    name=user.name,
                    created_at=user.created_at  # UTC
                )
            )
            # endregion
            
        except Exception as ex:
            return Result(
                state=ResultStates.ERROR,
                message=Messages()
            )

# ====================================================================
# 8. INTERFACES (Core/Interfaces)
# ====================================================================

from abc import ABC, abstractmethod
from typing import List, Optional

class IUserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        pass
    
    @abstractmethod
    async def exists_by_email(self, email: str) -> bool:
        pass
    
    @abstractmethod
    async def get_all(self) -> List[User]:
        pass
    
    @abstractmethod
    async def create(self, user: User) -> None:
        pass
    
    @abstractmethod
    async def update(self, user: User) -> None:
        pass

class IEmailService(ABC):
    @abstractmethod
    async def send_email(self, to: str, subject: str, body: str) -> None:
        pass
    
    @abstractmethod
    async def send_welcome_email(self, email: str, name: str) -> None:
        pass

class IDateTimeProvider(ABC):
    @abstractmethod
    def utc_now(self) -> datetime:
        pass

class ICacheService(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[any]:
        pass
    
    @abstractmethod
    async def set(self, key: str, value: any, expiration: Optional[int] = None) -> None:
        pass
    
    @abstractmethod
    async def remove(self, key: str) -> None:
        pass

# ====================================================================
# 9. INFRASTRUCTURE IMPLEMENTATIONS
# ====================================================================

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exists
import aiosmtplib
from email.mime.text import MIMEText

class UserRepository(IUserRepository):
    """SQLAlchemy implementation of IUserRepository"""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def exists_by_email(self, email: str) -> bool:
        result = await self._session.execute(
            select(exists().where(User.email == email))
        )
        return result.scalar()
    
    async def create(self, user: User) -> None:
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
    
    async def update(self, user: User) -> None:
        await self._session.commit()
        await self._session.refresh(user)

class DateTimeProvider(IDateTimeProvider):
    """Always returns UTC"""
    
    def utc_now(self) -> datetime:
        return datetime.utcnow()

class EmailService(IEmailService):
    """SMTP implementation of IEmailService"""
    
    def __init__(self, smtp_host: str, smtp_port: int, username: str, password: str):
        self._smtp_host = smtp_host
        self._smtp_port = smtp_port
        self._username = username
        self._password = password
    
    async def send_email(self, to: str, subject: str, body: str) -> None:
        message = MIMEText(body, 'html')
        message["Subject"] = subject
        message["From"] = "noreply@example.com"
        message["To"] = to
        
        await aiosmtplib.send(
            message,
            hostname=self._smtp_host,
            port=self._smtp_port,
            username=self._username,
            password=self._password
        )
    
    async def send_welcome_email(self, email: str, name: str) -> None:
        subject = "Welcome!"
        body = f"<h1>Welcome {name}!</h1>"
        await self.send_email(email, subject, body)

# ====================================================================
# 10. CACHED REPOSITORY (Decorator Pattern)
# ====================================================================

import json
from typing import Optional

class CachedUserRepository(IUserRepository):
    """Decorator that adds caching to repository"""
    
    def __init__(self, inner_repository: IUserRepository, cache: ICacheService):
        self._inner_repository = inner_repository
        self._cache = cache
        self._cache_duration = 600  # 10 minutes
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        cache_key = f"user:{user_id}"
        
        # Try cache first
        cached = await self._cache.get(cache_key)
        if cached:
            return User(**json.loads(cached))
        
        # Get from database
        user = await self._inner_repository.get_by_id(user_id)
        
        # Save to cache
        if user:
            await self._cache.set(
                cache_key, 
                json.dumps(user.__dict__), 
                self._cache_duration
            )
        
        return user
    
    async def create(self, user: User) -> None:
        await self._inner_repository.create(user)
        # Invalidate cache
        await self._cache.remove(f"user:{user.user_id}")
    
    async def get_by_email(self, email: str) -> Optional[User]:
        # Don't cache email lookups
        return await self._inner_repository.get_by_email(email)

# ====================================================================
# 11. CLEAN HELPERS
# ====================================================================

def clean(text: str) -> str:
    """Removes special characters, line breaks, and trims whitespace"""
    if not text:
        return ""
    return text.replace("\r", "")\
               .replace("\n", "")\
               .replace("\t", "")\
               .replace("\b", "")\
               .replace("\a", "")\
               .replace("\f", "")\
               .replace("\v", "")\
               .strip()

def clean_phone(text: str) -> str:
    """Removes phone formatting characters"""
    if not text:
        return ""
    return clean_number(text)\
        .replace("(", "")\
        .replace(")", "")\
        .replace(" ", "")\
        .replace("-", "")

def clean_number(text: str) -> str:
    """Removes formatting from numbers"""
    if not text:
        return ""
    return clean(text).replace(",", "").replace("$", "")

# ====================================================================
# 12. REST CONTROLLER (Presentation Layer with FastAPI)
# ====================================================================

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
import pytz

router = APIRouter(prefix="/api/users", tags=["users"])

class UsersController:
    def __init__(self, register_command: UserCRegister, get_by_id_query: UserQGetByID):
        self.register_command = register_command
        self.get_by_id_query = get_by_id_query

@router.post("/", status_code=201)
async def register(
    request: UserCRegisterI,
    user_timezone: str = Header(default="UTC"),
    controller: UsersController = Depends()
):
    result = await controller.register_command.handler(request)
    
    if result.state == ResultStates.SUCCESS:
        # Convert UTC to user timezone
        return {
            "user_id": result.data.user_id,
            "email": result.data.email,
            "name": result.data.name,
            "created_at": convert_to_user_timezone(result.data.created_at, user_timezone)
        }
    elif result.state == ResultStates.INVALID:
        raise HTTPException(
            status_code=400,
            detail={
                "state": result.state,
                "code": result.code,
                "message": result.message.user_message
            }
        )
    else:
        raise HTTPException(
            status_code=400,
            detail={
                "state": result.state,
                "code": result.code,
                "message": result.message.user_message
            }
        )

@router.get("/{user_id}")
async def get_by_id(
    user_id: int,
    user_timezone: str = Header(default="UTC"),
    controller: UsersController = Depends()
):
    result = await controller.get_by_id_query.handler(
        UserQGetByIDI(user_id=user_id)
    )
    
    if result.state == ResultStates.SUCCESS:
        return {
            "user_id": result.data.user_id,
            "email": result.data.email,
            "name": result.data.name,
            "created_at": convert_to_user_timezone(result.data.created_at, user_timezone)
        }
    elif result.state == ResultStates.EMPTY:
        raise HTTPException(status_code=404, detail="User not found")
    else:
        raise HTTPException(status_code=500, detail="Internal server error")

def convert_to_user_timezone(utc_date: datetime, timezone: str) -> datetime:
    """Convert UTC datetime to user's timezone"""
    user_tz = pytz.timezone(timezone)
    return utc_date.replace(tzinfo=pytz.UTC).astimezone(user_tz)

def convert_to_utc(user_date: datetime, timezone: str) -> datetime:
    """Convert user's timezone datetime to UTC"""
    user_tz = pytz.timezone(timezone)
    localized = user_tz.localize(user_date)
    return localized.astimezone(pytz.UTC)

# ====================================================================
# 13. DEPENDENCY INJECTION SETUP (FastAPI)
# ====================================================================

from functools import lru_cache
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Database setup
engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db_session():
    async with async_session_maker() as session:
        yield session

# Infrastructure dependencies
@lru_cache()
def get_datetime_provider() -> IDateTimeProvider:
    return DateTimeProvider()

@lru_cache()
def get_email_service() -> IEmailService:
    return EmailService(
        smtp_host="smtp.gmail.com",
        smtp_port=587,
        username="user@gmail.com",
        password="password"
    )

@lru_cache()
def get_cache_service() -> ICacheService:
    return RedisCacheService("redis://localhost:6379")

# Repository with caching
def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
    cache: ICacheService = Depends(get_cache_service)
) -> IUserRepository:
    real_repo = UserRepository(session)
    return CachedUserRepository(real_repo, cache)

# Commands and Queries
def get_user_c_register(
    repository: IUserRepository = Depends(get_user_repository),
    email_service: IEmailService = Depends(get_email_service),
    datetime_provider: IDateTimeProvider = Depends(get_datetime_provider)
) -> UserCRegister:
    return UserCRegister(repository, email_service, datetime_provider, "en")

def get_user_q_get_by_id(
    repository: IUserRepository = Depends(get_user_repository)
) -> UserQGetByID:
    return UserQGetByID(repository)

# ====================================================================
# 14. SNOWFLAKE ID GENERATOR (Strongly Recommended)
# ====================================================================

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass

class ISnowflakeIdGenerator(ABC):
    @abstractmethod
    def generate_id(self) -> int:
        pass

@dataclass
class SnowflakeInfo:
    id: int
    timestamp: int
    node_id: int
    sequence: int
    generated_at: datetime

class SnowflakeIdGenerator(ISnowflakeIdGenerator):
    """Twitter Snowflake ID Generator"""
    
    EPOCH = 1704067200000  # 2024-01-01 00:00:00 UTC in milliseconds
    
    def __init__(self, node_id: int):
        if node_id < 0 or node_id > 1023:
            raise ValueError("Node ID must be between 0 and 1023")
        
        self.node_id = node_id
        self.sequence = 0
        self.last_timestamp = -1
        self._lock = threading.Lock()
    
    def generate_id(self) -> int:
        with self._lock:
            timestamp = self._current_timestamp()
            
            if timestamp < self.last_timestamp:
                raise Exception("Clock moved backwards")
            
            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & 4095  # 12 bits mask
                if self.sequence == 0:
                    # Wait for next millisecond
                    timestamp = self._wait_next_millis(self.last_timestamp)
            else:
                self.sequence = 0
            
            self.last_timestamp = timestamp
            
            # Combine: timestamp (41 bits) + node_id (10 bits) + sequence (12 bits)
            return ((timestamp - self.EPOCH) << 22) | (self.node_id << 12) | self.sequence
    
    def _current_timestamp(self) -> int:
        return int(time.time() * 1000)
    
    def _wait_next_millis(self, last_timestamp: int) -> int:
        timestamp = self._current_timestamp()
        while timestamp <= last_timestamp:
            timestamp = self._current_timestamp()
        return timestamp
    
    @staticmethod
    def parse(snowflake_id: int) -> SnowflakeInfo:
        """Parse a Snowflake ID to extract its components"""
        timestamp = (snowflake_id >> 22) + SnowflakeIdGenerator.EPOCH
        node_id = (snowflake_id >> 12) & 0x3FF
        sequence = snowflake_id & 0xFFF
        
        return SnowflakeInfo(
            id=snowflake_id,
            timestamp=timestamp,
            node_id=node_id,
            sequence=sequence,
            generated_at=datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)
        )

# Alternative: Using pysnowflake library
# pip install pysnowflake

# from pysnowflake import SnowflakeGenerator
# 
# class PySnowflakeIdGenerator(ISnowflakeIdGenerator):
#     def __init__(self, node_id: int):
#         self.generator = SnowflakeGenerator(
#             instance=node_id,
#             epoch=1704067200000  # Custom epoch
#         )
#     
#     def generate_id(self) -> int:
#         return next(self.generator)

# ====================================================================
# 15. ENTITY WITH SNOWFLAKE ID
# ====================================================================

@dataclass
class User:
    """User entity with Snowflake ID"""
    user_id: int  # Snowflake ID, not auto-increment
    email: str = ""
    name: str = ""
    password_hash: str = ""
    created_at: Optional[datetime] = None  # Always UTC
    updated_at: Optional[datetime] = None
    status: str = "active"

# ====================================================================
# 16. COMMAND USING SNOWFLAKE ID
# ====================================================================

class UserCRegisterWithSnowflake:
    def __init__(
        self,
        id_generator: ISnowflakeIdGenerator,
        repository,  # IUserRepository
        email_service,  # IEmailService
        datetime_provider,  # IDateTimeProvider
        language: str = "en"
    ):
        self._id_generator = id_generator
        self._repository = repository
        self._email_service = email_service
        self._datetime_provider = datetime_provider
        self._language = language
    
    async def handler(self, input_dto: UserCRegisterI) -> Result[UserCRegisterO]:
        """Handler method with Snowflake ID generation"""
        
        try:
            # region Clean
            input_dto.email = clean(input_dto.email).lower() if input_dto.email else ""
            input_dto.name = clean(input_dto.name) if input_dto.name else ""
            # endregion
            
            # region Validation
            prefix = "USER_REGISTER"
            
            if not input_dto.email:
                return Result(
                    state=ResultStates.INVALID,
                    message=UserCRegisterM.get(self._language, "email_required"),
                    code=f"{prefix}:EMAIL_REQUIRED"
                )
            # endregion
            
            # region Business Rules
            existing_user = await self._repository.get_by_email(input_dto.email)
            if existing_user:
                return Result(
                    state=ResultStates.UNSUCCESS,
                    message=UserCRegisterM.get(self._language, "email_already_exists"),
                    code=f"{prefix}:EMAIL_EXISTS"
                )
            # endregion
            
            # region Process
            # Generate Snowflake ID BEFORE creating entity
            user_id = self._id_generator.generate_id()
            
            user = User(
                user_id=user_id,  # Pre-generated Snowflake ID
                email=input_dto.email,
                name=input_dto.name,
                password_hash=self._hash_password(input_dto.password),
                created_at=self._datetime_provider.utc_now(),
                status="active"
            )
            
            await self._repository.create(user)
            await self._email_service.send_welcome_email(user.email, user.name)
            
            return Result(
                state=ResultStates.SUCCESS,
                message=Messages(),
                code=f"{prefix}:SUCCESS",
                data=UserCRegisterO(
                    user_id=user.user_id,  # Return Snowflake ID
                    email=user.email,
                    name=user.name,
                    created_at=user.created_at
                )
            )
            # endregion
            
        except Exception as ex:
            return Result(
                state=ResultStates.ERROR,
                message=Messages(),
                code="USER_REGISTER:SYSTEM_ERROR"
            )
    
    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# ====================================================================
# 17. DEPENDENCY INJECTION WITH SNOWFLAKE
# ====================================================================

import os
import threading

# Get nodeId from environment variable (different per server)
NODE_ID = int(os.getenv('NODE_ID', '0'))

# Create singleton instance
_snowflake_generator = SnowflakeIdGenerator(NODE_ID)

@lru_cache()
def get_snowflake_id_generator() -> ISnowflakeIdGenerator:
    """Singleton Snowflake ID generator"""
    return _snowflake_generator

# Commands and Queries with Snowflake
def get_user_c_register_with_snowflake(
    id_generator: ISnowflakeIdGenerator = Depends(get_snowflake_id_generator),
    repository: IUserRepository = Depends(get_user_repository),
    email_service: IEmailService = Depends(get_email_service),
    datetime_provider: IDateTimeProvider = Depends(get_datetime_provider)
) -> UserCRegisterWithSnowflake:
    return UserCRegisterWithSnowflake(
        id_generator,
        repository,
        email_service,
        datetime_provider,
        "en"
    )

# FastAPI endpoint using Snowflake
@router.post("/with-snowflake", status_code=201)
async def register_with_snowflake(
    request: UserCRegisterI,
    command: UserCRegisterWithSnowflake = Depends(get_user_c_register_with_snowflake)
):
    result = await command.handler(request)
    
    if result.state == ResultStates.SUCCESS:
        return {
            "user_id": result.data.user_id,  # Snowflake ID
            "email": result.data.email,
            "name": result.data.name
        }
    else:
        raise HTTPException(status_code=400, detail=result.message.user_message)

# Configuration example
"""
# .env file
NODE_ID=0  # Server 1

# .env.production (Server 2)
NODE_ID=1  # Different nodeId per server

# .env.production (Server 3)
NODE_ID=2
"""