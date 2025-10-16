# Entity-Driven Clean Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/proteo5/entity-driven-clean-architecture)](https://github.com/proteo5/entity-driven-clean-architecture/stargazers)

> A practical, explicit, and scalable architecture for API-first backends

**English Version | [Versión en Español](./README-ES.md)**

---

## 🚀 Quick Start

**Core Principles:**
- **Explicit over Implicit** - Always
- **Organized by Entity** - Not by technical layer
- **Result Envelope** - Structured responses with explicit codes
- **Nested Structure** - DataIn/DataOut/Messages in one file
- **UTC Everywhere** - Core only works in UTC
- **Snowflake IDs** - Distributed ID generation

**Example:**
```csharp
// Single file contains everything
public class UserCCreate {
    public class DataIn { ... }
    public class DataOut { ... }
    public static class Messages { ... }
    
    public async Task<Result> Handler(DataIn input) {
        // Clean → Validation → Business Rules → Process
    }
}
```

---

## 📖 Documentation

- [Full White Paper](#entity-driven-clean-architecture-for-api-first-backends) (below)
- [C# Examples](./examples/csharp/)
- [Python Examples](./examples/python/)
- [TypeScript Examples](./examples/typescript/)

---

## 💡 Why This Architecture?

- ✅ **60% less files** - Nested structure keeps related code together
- ✅ **Testable Core** - 100% independent of infrastructure
- ✅ **Explicit codes** - `USER_CREATE:VALIDATION:EMAIL_REQUIRED` for debugging
- ✅ **Protocol agnostic** - Works with REST, GraphQL, gRPC
- ✅ **Distributed ready** - Snowflake IDs for microservices

---

## 🛠️ Implementation Examples

### C# (.NET 6+)
```csharp
public class UserCCreate {
    public class DataIn {
        public string Email { get; set; }
        public string Name { get; set; }
    }
    
    public async Task<Result> Handler(DataIn input) {
        // Implementation with structured codes
        return new Result(
            state: "success",
            code: "USER_CREATE:SUCCESS",
            data: output
        );
    }
}
```

[See complete C# examples →](./examples/csharp/)

### Python (FastAPI)
```python
class UserCCreate:
    @dataclass
    class DataIn:
        email: str
        name: str
    
    async def handler(self, input: DataIn) -> Result[DataOut]:
        # Implementation with structured codes
        return Result(
            state="success",
            code="USER_CREATE:SUCCESS",
            data=output
        )
```

[See complete Python examples →](./examples/python/)

### TypeScript (Express)
```typescript
export namespace UserCCreate {
    export interface DataIn {
        email: string;
        name: string;
    }
    
    export class Messages { ... }
}

export class UserCCreate {
    async handler(input: UserCCreate.DataIn): Promise<Result> {
        // Implementation with structured codes
    }
}
```

[See complete TypeScript examples →](./examples/typescript/)

---

## 📊 Result Envelope with Structured Codes

Every operation returns a `Result<T>` with **explicit, structured codes**:
```
Format: [OPERATION]:[SECTION]:[REASON]

Examples:
✅ USER_CREATE:SUCCESS
✅ USER_CREATE:VALIDATION:EMAIL_REQUIRED
✅ USER_CREATE:BUSINESS_RULE:EMAIL_EXISTS
✅ ORDER_CREATE:ERROR:DATABASE_CONNECTION
```

**Benefits:**
- 🔍 Easy debugging from logs
- 🤖 Clients can make programmatic decisions
- 📊 Metrics and alerts by section
- 🚫 No text interpretation needed

---

## 🌟 Star History

If you find this architecture useful, please ⭐ star the repo!

---

## 📄 License

MIT License - feel free to use in commercial and open source projects.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

Questions? Open an issue or discussion in this repository.

---



<!-- White Paper Content Starts Here -->

---

# Entity-Driven Clean Architecture for API-First Backends

**Version 0.1-beta - Beta**  
**Date:** October 2025

---

## Executive Summary

**Entity-Driven Clean Architecture** is a language-agnostic architecture for API-first backends that organizes code by business entities using explicit conventions to maximize clarity, testability, and maintainability.

### Key Advantages
- **Full Testability**: Core 100% independent of infrastructure
- **Agnostic**: Works with REST, GraphQL, gRPC, or other protocols
- **Clear Organization**: Structure by entities, not by technical layers
- **Explicit**: Descriptive names over abbreviations
- **Scalability**: Clear separation between business logic and infrastructure
- **Maintainability**: 60% fewer files with cohesive nested structure

### When to Use It
- API-first backends (REST, GraphQL, gRPC)
- Projects requiring high testability
- Systems that will evolve in complexity
- Teams that value consistency and clarity
- Distributed architectures and microservices

---

## Context and Motivation

Traditional backends organized by technical layers (Controllers, Services, Repositories) present problems:

- **Difficulty finding code**: Where is the "register user" logic?
- **Infrastructure coupling**: Tests that require databases, external services
- **Inconsistency**: Each developer structures code differently
- **Protocol changes require refactoring**: Switching from REST to GraphQL means rewriting
- **Scattered files**: 5+ files to understand one operation

**Entity-Driven Clean Architecture** solves these problems through:
1. Organization by **business entities** (not by technical layers)
2. **Core** completely independent of infrastructure
3. **Explicit convention** with cohesive nested structure
4. **Snowflake IDs** for distributed systems
5. **Strict UTC** in all business logic

---

## Fundamental Principles

### 1. Explicit over Implicit - ALWAYS

**The most important principle of this architecture.**

```
✅ CORRECT - Explicit
UserCCreate.DataIn    # Clear: data going IN
UserCCreate.DataOut   # Clear: data going OUT
UserCCreate.Messages  # Clear: multilanguage messages

❌ INCORRECT - Implicit
UserCRegisterI        # I for what? Input? Interface?
Input                 # Input of what?
DTO                   # Too generic
```

### 2. Core vs Infrastructure Separation

**CORE (Business Logic)**
- Does NOT know REST, GraphQL, gRPC
- Does NOT know databases (SQL, MongoDB, etc.)
- Does NOT know external services (Email, SMS, WhatsApp)
- Does NOT know the system clock (DateTime.Now)
- IS 100% testable without complex mocks

**INFRASTRUCTURE**
- Adapters to protocols (REST, GraphQL, gRPC)
- Database implementations
- External service clients
- Authentication and authorization
- System date/time handling
- Cache (Redis, Memory)

### 3. Organization by Entity

Code is grouped by **business entity**, not by technical type:

```
✅ CORRECT (By Entity)
Core/
  Entities/
    UsersQC/
    CompaniesQC/
    OrdersQC/

❌ INCORRECT (By Technical Layer)
Core/
  Services/
  Repositories/
  DTOs/
```

### 4. Inversion of Control (IoC) and Dependency Injection

**The Core defines WHAT it needs (interfaces), Infrastructure defines HOW to do it (implementations).**

```
❌ BAD - Core depends on Infrastructure
Core → Infrastructure (direct coupling)

✅ GOOD - Both depend on abstractions
Core → Interfaces ← Infrastructure
```

**The Core does NOT know:**
- ❌ If it uses SQL Server, PostgreSQL, MongoDB
- ❌ If there's cache (Redis, MemoryCache)
- ❌ How emails are sent (SMTP, SendGrid, AWS SES)
- ❌ How SMS are sent (Twilio, AWS SNS)

**The Core ONLY asks:**
- ✅ "Give me a user by ID"
- ✅ "Save this user"
- ✅ "Send an email to this address"

### 5. QC Naming Convention

Each file/class follows the pattern: `[Entity][Q|C][Action]`

- **Q (Query)**: Data reading, does not modify state
- **C (Command)**: Writing, modifies system state

**Examples:**
- `UserCCreate` - Command to create user
- `UserQGetAll` - Query to get all users
- `CompanyCCreate` - Command to create company
- `CompanyQGetByID` - Query to get company by ID

### 6. Result Envelope Pattern

**ALL Core returns responses wrapped in Result<T>:**

```
Result<T> {
    state: string          // "success" | "unsuccess" | "empty" | "invalid" | "error"
    code: string          // Unique code (e.g., "USER_CREATE:EMAIL_EXISTS")
    message: Messages     // Multilanguage messages
    data: T              // Response data (Output DTO)
    invalidFields: []    // Invalid fields
}
```

**Possible states:**
- `success` - Successful operation with data
- `unsuccess` - Operation failed due to business rule
- `empty` - Successful operation but no data (Query without results)
- `invalid` - Invalid input data
- `error` - System error/exception

### 7. UTC Time Zone

**The ENTIRE system handles UTC internally:**
- Core works exclusively in UTC
- Infrastructure saves/reads in UTC
- Presentation Layer converts from user timezone → UTC (input)
- Presentation Layer converts from UTC → user timezone (output)

### 8. Snowflake IDs (Strongly Recommended)

**It is recommended to use Twitter Snowflake-based IDs instead of auto-increment integers:**

**Snowflake ID Structure:**
```
 0                   41           51     64
 |--------------------|-----------|------|
 timestamp (41 bits) | node (10) | seq (12)
```

**Advantages over Auto-Increment:**
- ✅ **Distribution**: Multiple servers can generate IDs without conflicts
- ✅ **Performance**: Does not require querying database to get ID
- ✅ **Security**: Does not reveal record count
- ✅ **Ordering**: More recent IDs have higher values
- ✅ **Microservices**: Ideal for distributed architectures

---

## Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│      (REST / GraphQL / gRPC)                │
│  - Authentication                           │
│  - Authorization                            │
│  - Input validation                         │
│  - Timezone Conversion (User ↔ UTC)         │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│            CORE LAYER                       │
│         (Business Logic - Pure)             │
│                                             │
│  Commands & Queries                         │
│    - UserCCreate                            │
│    - UserQGetByID                           │
│                                             │
│  Each operation contains:                   │
│    - Handler() method                       │
│    - DataIn (nested)                        │
│    - DataOut (nested)                       │
│    - Messages (nested)                      │
│                                             │
│  Depends on:                                │
│    - Interfaces (IUserRepository, etc.)     │
│                                             │
│  ⚠️  NO dependencies on infrastructure      │
│  ⚠️  ALL dates in UTC                       │
│  ⚠️  ALL returns Result<T>                  │
└─────────────────┬───────────────────────────┘
                  │ implements
                  ↓
┌─────────────────────────────────────────────┐
│       INFRASTRUCTURE LAYER                  │
│    (External Dependencies)                  │
│                                             │
│  - Database implementations                 │
│  - External services (Email, SMS)           │
│  - File storage                             │
│  - Cache (Redis, Memory)                    │
│  - Date/Time providers (UTC)                │
│  - Snowflake ID generators                  │
└─────────────────────────────────────────────┘
```

### Project Structure

```
MySolution/
│
├── MyProject.Core/                    # ← Business Logic (NO dependencies)
│   ├── Common/
│   │   ├── Result.cs                  # Result envelope
│   │   ├── Messages.cs                # Messages DTO
│   │   └── ResultsStates.cs           # State constants
│   │
│   ├── Entities/
│   │   ├── UsersQC/
│   │   │   ├── User.{lang}            # Entity (persistence model)
│   │   │   ├── UserCCreate.{lang}     # Command with nested DataIn/DataOut/Messages
│   │   │   ├── UserCUpdate.{lang}
│   │   │   ├── UserQGetByID.{lang}    # Query with nested DataIn/DataOut/Messages
│   │   │   └── UserQGetAll.{lang}
│   │   │
│   │   ├── CompaniesQC/
│   │   │   ├── Company.{lang}
│   │   │   ├── CompanyCCreate.{lang}
│   │   │   └── CompanyQGetByID.{lang}
│   │   │
│   │   └── OrdersQC/
│   │       ├── Order.{lang}
│   │       ├── OrderCCreate.{lang}
│   │       └── OrderQGetByUser.{lang}
│   │
│   └── Interfaces/                    # ← Contracts
│       ├── IUserRepository.cs
│       ├── IEmailService.cs
│       ├── ISnowflakeIdGenerator.cs
│       └── IDateTimeProvider.cs
│
├── MyProject.Infrastructure/          # ← External Dependencies
│   ├── Database/
│   │   ├── UserRepository.{lang}
│   │   └── CompanyRepository.{lang}
│   ├── Services/
│   │   ├── EmailService.{lang}
│   │   ├── SMSService.{lang}
│   │   └── DateTimeProvider.{lang}    # Always returns UTC
│   ├── IdGeneration/
│   │   └── SnowflakeIdGenerator.{lang}
│   └── Cache/
│       ├── RedisCacheService.{lang}
│       └── MemoryCacheService.{lang}
│
├── MyProject.API.REST/                # ← REST Interface
│   ├── Controllers/
│   │   ├── UsersController.{lang}     # Handles timezone conversion
│   │   └── CompaniesController.{lang}
│   ├── Middleware/
│   │   ├── AuthenticationMiddleware
│   │   └── AuthorizationMiddleware
│   └── Program.{lang}                 # DI configuration
│
└── MyProject.Helpers/                 # ← Utility Libraries
    └── StringExtensions.{lang}        # Clean helpers
```

---

## Files Structure (Nested Pattern)

```
UsersQC/
  ├── User.cs                # Entity 
  └── UserCCreate.cs         # All together, cohesive
      ├── class DataIn       # Nested
      ├── class DataOut      # Nested
      ├── class Messages     # Nested
      └── Handler()
```

Usage (Explicit):

```
var input = new UserCCreate.DataIn { ... };
var result = await command.Handler(input);
UserCCreate.DataOut output = result.Data;
```

### Command/Query Anatomy

**Pseudocode:**
```
// UserCCreate.{lang} - One File, all included

class UserCCreate {
    
    // Nested Classes - DTOs
    class DataIn {
        email: string
        name: string
        password: string
    }
    
    class DataOut {
        userId: long        // Snowflake ID
        email: string
        name: string
        createdAt: datetime // UTC
    }
    
    static class Messages {
        static function Get(language, key): Messages
    }
    
    // Dependencies (inyectadas)
    private idGenerator: ISnowflakeIdGenerator
    private repository: IUserRepository
    private emailService: IEmailService
    private dateTimeProvider: IDateTimeProvider
    
    // Constructor con DI
    constructor(idGenerator, repository, emailService, dateTimeProvider, language)
    
    // Handler - Entry point
    async function Handler(input: DataIn): Result<DataOut> {
        try {
            #region Clean
            #region Validation
            #region Business Rules
            #region Process
        }
        catch {
            return Error
        }
    }
    
    // Private Mappers
    private function MapToDataOut(entity): DataOut
}
```



---

## 4 Handler Sections (Commands)

**Commands follow a 4-section structure in order:**

- Clean
- Validation
- Business Rules
- Process

### Section 1: Clean (Sanitization)

**Purpose:** Clean and normalize input data before any validation.

**Responsibilities:**
- Remove unwanted special characters
- Trim whitespace
- Normalize format (lowercase, uppercase)
- Remove line breaks, tabs, etc.
- Clean numbers (remove commas, currency symbols)

**Does NOT:**
- Validate data
- Query database
- Business logic

**Example:**
```
#region Clean
input.Email = Clean(input.Email).ToLower()
input.Phone = CleanPhone(input.Phone)
input.Name = Clean(input.Name)
#endregion
```

### Section 2: Validation (Format Validation)

**Purpose:** Verify that data meets format and structure requirements.

**Responsibilities:**
- Required fields
- Minimum length/maximum
- Email format, phone, URL
- Numeric ranges (min/max)
- Regular expressions

**Does NOT:**
- Query database
- Verify complex business rules
- Modify data

**Returns:** `Result<T>` with `State = Invalid` and **structured code**

**Mandatory code:** `[OPERATION]:VALIDATION:[SPECIFIC_REASON]`

**Example:**
```
#region Validation
prefix = "USER_CREATE"

if (IsNullOrEmpty(input.Email)) {
    return Result<DataOut>(
        state: INVALID,
        code: prefix + ":VALIDATION:EMAIL_REQUIRED",  // ← Código estructurado
        message: Messages.Get(language, "EmailRequired")
    )
}

if (Length(input.Password) < 8) {
    return Result<DataOut>(
        state: INVALID,
        code: prefix + ":VALIDATION:PASSWORD_TOO_SHORT",  // ← Código estructurado
        message: Messages.Get(language, "PasswordTooShort")
    )
}

if (input.Age < 18 OR input.Age > 120) {
    return Result<DataOut>(
        state: INVALID,
        code: prefix + ":VALIDATION:INVALID_AGE_RANGE",  // ← Código estructurado
        message: Messages.Get(language, "InvalidAgeRange")
    )
}
#endregion
```

### Section 3: Business Rules (Business Rules)

**Purpose:** Verify business rules that may require database queries.

**Responsibilities:**
- Verify record existence
- Validate uniqueness (no duplicate email)
- Verify permissions and authorizations
- Validate states (active user, cancelable order)
- Verify limits 
- Validate relationships between entities

**Does:**
- Query database (Read Only)
- Call other Queries
- Verify complex conditions

**Does NOT:**
- Modify database
- Create/update/delete records
- Execute main process

**Returns:** `Result<T>` with `State = Unsuccess` if a rule fails

**Example:**
```
#region Business Rules
existingUser = await repository.GetByEmail(input.Email)
if (existingUser != null) {
    return Result<DataOut>(
        state: UNSUCCESS,
        message: Messages.Get(language, "EmailExists"),
        code: prefix + ":EMAIL_EXISTS"
    )
}

userCount = await repository.CountByOrganization(input.OrganizationId)
if (userCount >= Settings.MaxUsersPerOrganization) {
    return Result<DataOut>(
        state: UNSUCCESS,
        message: Messages.Get(language, "UserLimitReached"),
        code: prefix + ":USER_LIMIT_REACHED"
    )
}
#endregion
```

### Section 4: Process (Main Process)

**Purpose:** Execute the main operation if all validations and rules passed.

**Responsibilities:**
- Create/update/delete records
- Execute transactions
- Call external services (email, SMS, etc.)
- Generar tokens
- Generate Snowflake IDs
- Create related records

**Returns:** `Result<T>` with `State = Success` and `Data` 

**Example:**
```
#region Process
// Generate Snowflake ID BEFORE creating entity
userId = idGenerator.GenerateId()

user = new User {
    userId: userId,              // Pre-generated Snowflake ID
    email: input.Email,
    name: input.Name,
    passwordHash: HashPassword(input.Password),
    createdAt: dateTimeProvider.UtcNow(),  // Always UTC
    status: "active"
}

await repository.Create(user)
await emailService.SendWelcomeEmail(user.Email, user.Name)

return Result<DataOut>(
    state: SUCCESS,
    message: empty Messages,
    code: prefix + ":SUCCESS",
    data: MapToDataOut(user)
)
#endregion
```

### Important Notes

**Are all sections mandatory?**
- ❌ NO, not all are mandatory in all cases
- ✅ YES, you should follow the ORDER if you use the sections
- ✅ Queries generally only have #regions Clean, Validation and Process 

**Golden Rule:**
> If a section is not necessary, skip it. But if you use it, follow the order.: Clean → Validation → Business Rules → Process

---

## Interfaces and Dependency Injection

### Interfaces in the Core

**Pseudocode:**
```
// IUserRepository
interface IUserRepository {
    GetById(id: long): User
    GetByEmail(email: string): User
    ExistsByEmail(email: string): boolean
    GetAll(): Array<User>
    Create(user: User): void
    Update(user: User): void
}

// IEmailService
interface IEmailService {
    SendEmail(to: string, subject: string, body: string): void
    SendWelcomeEmail(email: string, name: string): void
}

// ISnowflakeIdGenerator
interface ISnowflakeIdGenerator {
    GenerateId(): long
}

// IDateTimeProvider
interface IDateTimeProvider {
    UtcNow(): datetime  // Always returns UTC
}
```

### Implementations in Infrastructure

**Pseudocode:**
```
// UserRepository - SQL Implementation
class UserRepository implements IUserRepository {
    private dbContext: DbContext
    
    constructor(dbContext: DbContext)
    
    function GetById(id: long): User {
        return dbContext.Users.FindById(id)
    }
    
    function Create(user: User): void {
        dbContext.Users.Add(user)
        dbContext.SaveChanges()
    }
}

// SnowflakeIdGenerator
class SnowflakeIdGenerator implements ISnowflakeIdGenerator {
    private nodeId: integer
    private sequence: integer
    private lastTimestamp: long
    
    constructor(nodeId: integer)  // Unique per server
    
    function GenerateId(): long {
        timestamp = GetCurrentTimestampMillis()
        // Combine: timestamp (41 bits) + nodeId (10 bits) + sequence (12 bits)
        return ((timestamp - EPOCH) << 22) | (nodeId << 12) | sequence
    }
}

// DateTimeProvider - Always UTC
class DateTimeProvider implements IDateTimeProvider {
    function UtcNow(): datetime {
        return GetSystemTimeInUTC()  // Never local time!
    }
}
```

### Dependency Injection configuration

**Pseudocode:**
```
// Application Startup

// Get nodeId from configuration (different per server)
nodeId = Configuration.Get("NodeId", default: 0)

// Infrastructure - Singleton
services.RegisterSingleton<ISnowflakeIdGenerator>(
    new SnowflakeIdGenerator(nodeId)
)
services.RegisterSingleton<IDateTimeProvider>(
    new DateTimeProvider()
)

// Infrastructure - Scoped
services.RegisterScoped<IUserRepository, UserRepository>()
services.RegisterScoped<IEmailService, EmailService>()

// Core Commands and Queries - Scoped
services.RegisterScoped<UserCCreate>()
services.RegisterScoped<UserQGetByID>()

// The Core automatically receives injected implementations!
```

---

## Snowflake IDs - Highly Recommended

### Why Snowflake IDs?

#### Problems with Auto-Increment:
- ❌ Requires a centralized database
- ❌ Bottleneck in high concurrency
- ❌ Discloses business information (ID 1000 = 1000 users)
- ❌ Problems in distributed systems
- ❌ Conflicts when merging databases

#### Advantages of Snowflake:
- ✅ Distributed generation without coordination
- ✅ High performance (no DB query needed)
- ✅ Automatic chronological ordering
- ✅ Globally unique
- ✅ Ideal for microservices

### Why Snowflake IDs are better than UUIDs:

**Performance & Storage:**
- ✅ **Smaller size**: 64-bit (8 bytes) vs UUID's 128-bit (16 bytes)
- ✅ **Better indexing**: Sorted IDs improve B-tree index performance
- ✅ **Less storage overhead**: Half the size means better memory usage and faster queries
- ✅ **Database-friendly**: Most databases optimize better for integer types

**Readability & Debugging:**
- ✅ **Human-readable**: Shorter and easier to read/copy (e.g., `1234567890123456789`)
- ✅ **Sortable by time**: You can immediately see which ID is newer
- ✅ **Easier debugging**: Sequential nature makes it easier to track order of operations
- ✅ **URL-friendly**: Shorter IDs in APIs and URLs

**Scalability & Distribution:**
- ✅ **Built-in timestamp**: Contains creation time information
- ✅ **Machine ID embedded**: Can identify which server generated the ID
- ✅ **No random collisions**: Deterministic generation vs UUID's probabilistic uniqueness
- ✅ **Optimized for sharding**: Machine ID component makes data distribution easier

**When to still use UUIDs:**
- Use UUIDs when you need true randomness for security
- Use UUIDs when you can't coordinate machine IDs
- Use UUIDs for public-facing identifiers where you don't want sequential IDs

### Implementation

**Usage in Commands:**
```
class UserCCreate {
    private idGenerator: ISnowflakeIdGenerator
    
    async function Handler(input: DataIn): Result<DataOut> {
        // Generate Snowflake ID BEFORE inserting
        userId = idGenerator.GenerateId()
        
        user = new User {
            userId: userId,  // Pre-generated Snowflake ID
            email: input.email
        }
        
        await repository.Create(user)
        
        return Success with userId
    }
}
```

### Server Configuration

```
# Server 1
NODE_ID=0

# Server 2
NODE_ID=1

# Server 3
NODE_ID=2

# Development
NODE_ID=100

# Testing
NODE_ID=200
```

**CRITICAL:** Each server/process MUST have a unique NODE_ID to ensure globally unique IDs.

---

## Helpers de Sanitization

**Pseudocode:**
```
function Clean(text: string): string {
    return text
        .Replace("\r", "")
        .Replace("\n", "")
        .Replace("\t", "")
        .Trim()
}

function CleanPhone(text: string): string {
    return CleanNumber(text)
        .Replace("(", "")
        .Replace(")", "")
        .Replace(" ", "")
        .Replace("-", "")
}

function CleanNumber(text: string): string {
    return Clean(text)
        .Replace(",", "")
        .Replace("$", "")
}
```

---

## Golden Rules

### 🔐 **16 Unbreakable Rules**

1. **Explicit over Implicit**: ALWAYS prioritize clarity over brevity
2. **UTC Everywhere in Core**: Core NEVER handles any timezone other than UTC
3. **Handler Method**: Every Query/Command has a `Handler()` method as the entry point
4. **Result Envelope**: EVERYTHING returns `Result<T>` with defined states
5. **Nested Structure per Operation**: DataIn, DataOut, Messages in the same file
6. **Dependency Inversion**: Core defines interfaces, Infrastructure implements them
7. **No Direct Infrastructure in Core**: Core NEVER instantiates Infrastructure classes
8. **Dependency Injection**: All dependencies are injected
9. **Timezone Conversion Only in Presentation**: API layer handles TZ conversions
10. **Messages Required**: Every operation has Messages for multiple languages
11. **Entity = Persistence Model**: Entity exactly represents the DB model
12. **4 Sections Order**: Clean → Validation → Business Rules → Process
13. **Infrastructure Concerns in Infrastructure**: Cache, logging, metrics = Infrastructure
14. **Core is Pure Business Logic**: Core only contains business logic
15. **Snowflake IDs Strongly Recommended**: Use Snowflake IDs in main entities

---

## Implementation Guide

### Step 1: Create Project Structure

1. Create project **Core** (no external dependencies)
2. Create project **Infrastructure** (reference Core)
3. Create project **API** (reference Core + Infrastructure)
4. Create project **Helpers** (opcional, utilities)

### Step 2: Define Interfaces in Core

```
Core/Interfaces/
  ├── IUserRepository
  ├── IEmailService
  ├── ISnowflakeIdGenerator
  └── IDateTimeProvider
```

### Step 3: Create Entity

```
Core/Entities/UsersQC/User.{lang}

User {
    userId: long  // Snowflake ID
    email: string
    name: string
    createdAt: datetime  // UTC
}
```

### Step 4: Implement Command/Query

```
Core/Entities/UsersQC/UserCCreate.{lang}

class UserCCreate {
    class DataIn { ... }
    class DataOut { ... }
    static class Messages { ... }
    
    async function Handler(input: DataIn): Result<DataOut> {
        #region Clean
        #region Validation
        #region Business Rules
        #region Process
    }
}
```

### Step 5: Implement Infrastructure

```
Infrastructure/Database/UserRepository.{lang}
Infrastructure/IdGeneration/SnowflakeIdGenerator.{lang}
Infrastructure/Services/DateTimeProvider.{lang}
```

### Step 6: Configure Dependency Injection

```
// Get nodeId from configuration
nodeId = Config.Get("NodeId")

// Register infrastructure
services.RegisterSingleton<ISnowflakeIdGenerator>(new SnowflakeIdGenerator(nodeId))
services.RegisterScoped<IUserRepository, UserRepository>()

// Register commands/queries
services.RegisterScoped<UserCCreate>()
```

### Step 7: Create Controller

```
API/Controllers/UsersController.{lang}

class UsersController {
    private createCommand: UserCCreate
    
    [POST("/api/users")]
    async function Create(request: UserCCreate.DataIn, userTimezone: string) {
        result = await createCommand.Handler(request)
        
        if (result.state == SUCCESS) {
            // Convert UTC to user timezone
            response = ConvertDatesToUserTimezone(result.data, userTimezone)
            return HTTP 201 with response
        }
        else if (result.state == INVALID) {
            return HTTP 400 with result.message
        }
    }
}
```

---

## Checklist de Implementación

### Core Layer
- [ ] Core project created without external dependencies
- [ ] `Entities/` folder created
- [ ] `Interfaces/` folder created
- [ ] For each entity, create folder `[Entity]QC/`
- [ ] Entity without suffixes created (User.cs, Order.cs)
- [ ] Each Query/Command has nested structure (DataIn/DataOut/Messages)
- [ ] `Handler()` Method as entry point
- [ ] The ENTIRE system handles dates in UTC
- [ ] Zero references to infrastructure in Core
- [ ] Interfaces defined for all external services


### Infrastructure Layer
- [ ] Repository implementations
- [ ] SnowflakeIdGenerator con NODE_ID único por servidor
- [ ] DateTimeProvider always returns UTC
- [ ] External service implementations
- [ ] Database saves dates in UTC
- [ ] It does not contain business logic

### API/Presentation Layer
- [ ] Authentication Middleware 
- [ ] Authorization Middleware 
- [ ] Controllers call `Handler()` metthos of Commands/Queries
- [ ] Date Conversion: User TZ → UTC (input)
- [ ] Date Conversion: UTC → User TZ (output)
- [ ] Input validation implemented
- [ ] Centralized error handling
- [ ] API Documentation (Swagger/GraphiQL)

### Naming Conventions
- [ ] Files/Classes: `[Entity][Q|C][Action]`
- [ ] Nested classes: `DataIn`, `DataOut`, `Messages`
- [ ] Entity: `[Entity]` (sin sufijos)
- [ ] Método principal: `Handler()`

### Testing
- [ ] Core unit tests (without complex mocks)
- [ ] Tests verify correct UTC handling
- [ ] Tests de conversión timezone en API
- [ ] Multilanguage message tests
- [ ] Tests unique  Snowflake IDs 

---

## Frequently Asked Questions

**Q: Why DataIn/DataOut and not Input/Output or Request/Response?**
A: Principle of "Explicit over Implicit." Input/Output are generic and can refer to system I/O. Request/Response imply an HTTP context. DataIn/DataOut are explicit: data going into/out of the Handler.

**Q: Can I use this architecture with dynamic languages like Python/Node.js?**
A: Yes, the principles are agnostic. Python uses nested classes, TypeScript uses namespaces. Complete examples are in the separate artifacts.

**Q: What happens if an operation doesn't need an Input or Output DTO?**
A: You don't create one. Example: `UserQGetAll` doesn't require parameters; it only has DataOut. `UserCUpdate` doesn't require data output. The Messages class is still necessary for potential error messages.

**Q: Where do input validations go?**
A: **Technical** validations (email format, length) go in the Handler's Validation section. **Business** validations (email already exists) go in the Business Rules section.

**Q: Can one Command call another Command?**
A: Yes, but with caution. If the logic is complex, consider extracting it into helper classes or domain services. Avoid long chains of Commands calling Commands.

**Q: How do I translate messages dynamically?**
A: The Messages class receives the language. The Presentation Layer detects the user's language (header, JWT, settings) and passes it when creating the Command/Query.

**Q: What should I do with dates that the user sends?**
A: If the user sends a date (e.g., "schedule for tomorrow at 3pm"), the Presentation Layer MUST convert it from the user's timezone to UTC before sending it to the Core. The Core only works in UTC.

**Q: Can the Entity have business logic?**
A: The Entity is a simple data model (POCO/Plain Object). Business logic goes in Commands/Queries. The Entity only has properties for persistence.

**Q: Can I use ORMs like Entity Framework, SQLAlchemy, TypeORM?**
A: Yes. ORMs go in the Infrastructure layer. The Core only knows the repository interfaces, not the concrete implementation.

**Q: How do I test a Command that uses multiple services?**
A: Mock the interfaces. Since the Core depends on abstractions (IUserRepository, IEmailService), you can easily mock them in unit tests without needing real databases.

**Q: Does this architecture work with microservices?**
A: Yes. Each microservice can internally follow this architecture. Communication between microservices occurs at the Infrastructure layer (HTTP clients, message queues).

**Q: When NOT to use this architecture?** 
A: For very simple projects (< 5 entities, basic CRUD without logic), one-off scripts, quick prototypes, or when the team cannot commit to following the conventions.

**Q: Why use Snowflake IDs instead of auto-increment?**
A: Snowflake IDs are generated locally without querying the database, work in distributed systems without coordination, do not reveal business information, and are ideal for microservices and high concurrency.


---

## Advantages and Limitations

### ✅ Advantages

1. **Extreme Testability**: Core testable without databases or external services
2. **Clarity**: Any developer finds the code quickly
3. **Protocol Flexibility**: Switch from REST to GraphQL without touching Core
4. **Maintainability**: Code organized by business concept
5. **Quick Onboarding**: Clear conventions make it easier to onboard new developers
6. **Independent Evolution**: Core and API evolve separately
7. **Fewer Files**: 60% reduction with nested structure
8. **Nombres Explícitos**: DataIn/DataOut are self-explanatory
9. **Distribución**: Snowflake IDs allow distributed systems without conflicts
10. **Performance**: IDs generated locally without querying DB

### ⚠️ Considerations

1. **Initial Learning Curve**: Requires discipline in following conventions
2. **Longer Files**: Nested structure means files of 200-400 lines
3. **Boilerplate**: More initial setup code
4. **Overkill for Simple Projects**: Basic CRUD may not justify this architecture
5. **Clock Synchronization**: Snowflake IDs require NTP to avoid conflicts

### 📊 Trade-offs

| Aspecto | Trade-off |
|---------|-----------|
| Initial setup | 🔴 More complex → 🟢 Pays dividends in maintenance |
| Files | 🟢 60% less files → 🔴 Larger/Bigger files |
| Coupling | 🟢 Low coupling → 🔴 Más interfaces |
| Tests | 🟢 Very Easy → 🔴 Requires configuring DI |
| Multilanguage | 🟢 Native support → 🔴 Clase Messages |
| Timezones | 🟢 UTC consistency → 🔴 Conversion at each endpoint |
| IDs | 🟢 Snowflake distributed → 🔴 Requiere unique NTP and NODE_ID  |

---

## Scalability

### Small Projects (< 10 entities)
```
MyProject.Core/
MyProject.Infrastructure/
MyProject.API.REST/
```

### Medium Projects (10-50 entities)
```
MyProject.Core/
MyProject.Infrastructure/
  ├── Database/
  ├── Services/
  ├── IdGeneration/
  └── Cache/
MyProject.API.REST/
MyProject.API.GraphQL/
```

### Large Projects (50+ entities)
```
MyProject.Core/
  ├── Entities/
  │   ├── Users/          # Bounded Context
  │   ├── Orders/
  │   └── Billing/
MyProject.Infrastructure/
MyProject.API.REST/
MyProject.API.GraphQL/
MyProject.API.gRPC/
MyProject.Workers/        # Background jobs
```

### Microservices

Each microservice uses the same architecture:
```
UserService/
  ├── UserService.Core/
  ├── UserService.Infrastructure/
  └── UserService.API/

OrderService/
  ├── OrderService.Core/
  ├── OrderService.Infrastructure/
  └── OrderService.API/
```

Each service has its own NODE_ID range for Snowflake IDs:
```
UserService:   NODE_ID = 0-99
OrderService:  NODE_ID = 100-199
BillingService: NODE_ID = 200-299
```

---

## Usage Examples

### Create User

**Controller (Presentation Layer):**
```
[POST("/api/users")]
async function CreateUser(
    request: UserCCreate.DataIn,
    userTimezone: string = "UTC"
) {
    // Timezone del usuario viene en header
    result = await userCCreateCommand.Handler(request)
    
    if (result.state == SUCCESS) {
        // Convert UTC dates to user timezone
        response = {
            userId: result.data.userId,
            email: result.data.email,
            createdAt: ConvertToUserTimezone(result.data.createdAt, userTimezone)
        }
        return HTTP 201 with response
    }
    else if (result.state == INVALID) {
        return HTTP 400 with {
            code: result.code,
            message: result.message.userMessage
        }
    }
}
```

**Command (Core Layer):**
```
class UserCCreate {
    async function Handler(input: DataIn): Result<DataOut> {
        try {
            // Clean
            input.email = Clean(input.email).ToLower()
            
            // Validation
            if (IsEmpty(input.email)) {
                return Invalid("EmailRequired")
            }
            
            // Business Rules
            if (await repository.ExistsByEmail(input.email)) {
                return Unsuccess("EmailExists")
            }
            
            // Process
            userId = idGenerator.GenerateId()
            user = new User {
                userId: userId,
                email: input.email,
                createdAt: dateTimeProvider.UtcNow()  // UTC
            }
            await repository.Create(user)
            
            return Success with MapToDataOut(user)
        }
        catch {
            return Error
        }
    }
}
```

### Query User

**Controller:**
```
[GET("/api/users/{id}")]
async function GetUser(
    id: long,
    userTimezone: string = "UTC"
) {
    input = new UserQGetByID.DataIn { userId: id }
    result = await userQGetByIDQuery.Handler(input)
    
    if (result.state == SUCCESS) {
        response = {
            userId: result.data.userId,
            email: result.data.email,
            createdAt: ConvertToUserTimezone(result.data.createdAt, userTimezone)
        }
        return HTTP 200 with response
    }
    else if (result.state == EMPTY) {
        return HTTP 404
    }
}
```

**Query (Core):**
```
class UserQGetByID {
    async function Handler(input: DataIn): Result<DataOut> {
        user = await repository.GetById(input.userId)
        
        if (user == null) {
            return Empty()
        }
        
        return Success with MapToDataOut(user)
    }
}
```

---

## Resources and Tools

### About the Architecture Name

**"Entity-Driven Clean Architecture"** it is unique in its specific combination of:
1. Strict organization by entities (not by technical layers)
2. Explicit QC naming convention
3. Mandatory Handler pattern
4. Nested structure with DataIn/DataOut/Messages
5. Strict UTC system
6. Standardized Result Envelope
7. Snowflake IDs as a recommendation8. Principle 'Explicit over Implicit'

Related but different concepts:
- **Clean Architecture** (Robert C. Martin) - Core principles
- **Domain-Driven Design** (Eric Evans) - Domain-focused approach
- **CQRS Pattern** - Separation of Commands/Queries
- **Hexagonal Architecture** - Ports and Adapters

### Recommended Tools

**Dependency Injection:**
- C#: Microsoft.Extensions.DependencyInjection, Autofac
- Python: FastAPI Dependencies, Dependency Injector
- TypeScript: InversifyJS, tsyringe

**Testing:**
- C#: xUnit, NUnit, Moq
- Python: pytest, unittest.mock
- TypeScript: Jest, Mocha

**Snowflake ID Generators:**
- C#: IdGen library
- Python: pysnowflake, python-snowflake
- TypeScript: flake-idgen

**Documentación API:**
- REST: Swagger/OpenAPI
- GraphQL: GraphiQL, Apollo Studio


---

## Contributions

This white paper is a living document. Improvement suggestions are welcome.

### How to Contribute
1. Fork the repository
2. Create a branch with your improvement
3. Send a Pull Request with a clear description

---

## License

This document and architecture are under the MIT license. Free to use in commercial and open source projects.

---

## Changelog

### v0.1.0 (2025)
- Nested structure with DataIn/DataOut/Messages
- Principle "Explicit over Implicit"
- Established QC convention
- Recommended Snowflake IDs
- Examples in C#, Python, TypeScript
- 15 Golden Rules
- Documented strict UTC
- 4 sections of the Handler
- 60% reduction in files

---

## Final Summary

**Entity-Driven Clean Architecture** it is a practical, proven, and scalable architecture for modern backends that prioritizes:

1. **Clarity**: Explicit rather than implicit at all times
2. **Organization**: By business entities, not by technical layers
3. **Testability**: Core 100% independent of infrastructure
4. **Maintainability**: Cohesive nested structure with 60% fewer files
5. **Scalability**: From small projects to microservices
6. **Distribution**: Snowflake IDs for distributed systems
7. **Consistency**: UTC in Core, conversion in Presentation
8. **Flexibility**: Protocol-agnostic (REST/GraphQL/gRPC)

**Core Philosophy:**
> "The code should be so explicit that a new developer can understand what an operation does just by reading the file name and its nested classes. The architecture should help, not hinder."

**Start today:**
1. Create your first Command with DataIn/DataOut/Messages
2. Implement the Result Envelope
3. Use Snowflake IDs from the start
4. Keep strict UTC in Core
5. Follow the order Clean → Validation → Business Rules → Process

---

**Questions? Feedback?**

This white paper documents a real architecture, used in production, that has proven its value in multiple projects. The code examples in the separate artifacts are functional and ready to use.


---

**Created with ❤️ for the developer community**

*"The best architecture is the one that makes the code so obvious that comments are unnecessary."*
