# Entity-Driven Clean Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/[tu-usuario]/entity-driven-clean-architecture)](https://github.com/[tu-usuario]/entity-driven-clean-architecture/stargazers)

> A practical, explicit, and scalable architecture for API-first backends

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

**Version 1.0 - Final**  
**Date:** October 2025

---

## Resumen Ejecutivo

**Entity-Driven Clean Architecture** es una arquitectura para backends API-first, agnóstica de lenguaje, que organiza el código por entidades de negocio utilizando convenciones explícitas para maximizar claridad, testabilidad y mantenibilidad.

### Ventajas Principales
- **Testabilidad Total**: Core 100% independiente de infraestructura
- **Agnóstica**: Funciona con REST, GraphQL, gRPC u otros protocolos
- **Organización Clara**: Estructura por entidades, no por capas técnicas
- **Explícita**: Nombres descriptivos sobre abreviaciones
- **Escalabilidad**: Separación clara entre lógica de negocio e infraestructura
- **Mantenibilidad**: 60% menos archivos con estructura nested cohesiva

### Cuándo Usarla
- Backends API-first (REST, GraphQL, gRPC)
- Proyectos que requieren alta testabilidad
- Sistemas que evolucionarán en complejidad
- Equipos que valoran consistencia y claridad
- Arquitecturas distribuidas y microservicios

---

## Contexto y Motivación

Los backends tradicionales organizados por capas técnicas (Controllers, Services, Repositories) presentan problemas:

- **Dificultad para encontrar código**: ¿Dónde está la lógica de "registrar usuario"?
- **Acoplamiento a infraestructura**: Tests que requieren bases de datos, servicios externos
- **Inconsistencia**: Cada desarrollador estructura el código diferente
- **Cambios en protocolo requieren refactoring**: Cambiar de REST a GraphQL implica reescribir
- **Archivos dispersos**: 5+ archivos para entender una operación

**Entity-Driven Clean Architecture** resuelve estos problemas mediante:
1. Organización por **entidades de negocio** (no por capas técnicas)
2. **Core** completamente independiente de infraestructura
3. **Convención explícita** con estructura nested cohesiva
4. **Snowflake IDs** para sistemas distribuidos
5. **UTC estricto** en toda la lógica de negocio

---

## Principios Fundamentales

### 1. Explícito sobre Implícito - SIEMPRE

**El principio más importante de esta arquitectura.**

```
✅ CORRECTO - Explícito
UserCCreate.DataIn    # Claro: datos que ENTRAN
UserCCreate.DataOut   # Claro: datos que SALEN
UserCCreate.Messages  # Claro: mensajes multiidioma

❌ INCORRECTO - Implícito
UserCRegisterI        # ¿I de qué? ¿Input? ¿Interface?
Input                 # ¿Input de qué?
DTO                   # Demasiado genérico
```

### 2. Separación Core vs Infrastructure

**CORE (Lógica de Negocio)**
- NO conoce REST, GraphQL, gRPC
- NO conoce bases de datos (SQL, MongoDB, etc.)
- NO conoce servicios externos (Email, SMS, WhatsApp)
- NO conoce el reloj del sistema (DateTime.Now)
- ES 100% testeable sin mocks complejos

**INFRASTRUCTURE**
- Adaptadores a protocolos (REST, GraphQL, gRPC)
- Implementaciones de bases de datos
- Clientes de servicios externos
- Autenticación y autorización
- Manejo de fecha/hora del sistema
- Caché (Redis, Memory)

### 3. Organización por Entidad

El código se agrupa por **entidad de negocio**, no por tipo técnico:

```
✅ CORRECTO (Por Entidad)
Core/
  Entities/
    UsersQC/
    CompaniesQC/
    OrdersQC/

❌ INCORRECTO (Por Capa Técnica)
Core/
  Services/
  Repositories/
  DTOs/
```

### 4. Inversión de Control (IoC) y Dependency Injection

**El Core define QUÉ necesita (interfaces), Infrastructure define CÓMO lo hace (implementaciones).**

```
❌ MAL - Core depende de Infrastructure
Core → Infrastructure (acoplamiento directo)

✅ BIEN - Ambos dependen de abstracciones
Core → Interfaces ← Infrastructure
```

**El Core NO sabe:**
- ❌ Si usa SQL Server, PostgreSQL, MongoDB
- ❌ Si hay caché (Redis, MemoryCache)
- ❌ Cómo se envían emails (SMTP, SendGrid, AWS SES)
- ❌ Cómo se envían SMS (Twilio, AWS SNS)

**El Core SOLO pide:**
- ✅ "Dame un usuario por ID"
- ✅ "Guarda este usuario"
- ✅ "Envía un email a esta dirección"

### 5. Convención de Nomenclatura QC

Cada archivo/clase sigue el patrón: `[Entity][Q|C][Action]`

- **Q (Query)**: Lectura de datos, no modifica estado
- **C (Command)**: Escritura, modifica estado del sistema

**Ejemplos:**
- `UserCCreate` - Command para crear usuario
- `UserQGetAll` - Query para obtener todos los usuarios
- `CompanyCCreate` - Command para crear compañía
- `CompanyQGetByID` - Query para obtener compañía por ID

### 6. Result Envelope Pattern

**TODO el Core retorna respuestas envueltas en Result<T>:**

```
Result<T> {
    state: string          // "success" | "unsuccess" | "empty" | "invalid" | "error"
    code: string          // Código único (ej: "USER_CREATE:EMAIL_EXISTS")
    message: Messages     // Mensajes multiidioma
    data: T              // Datos de respuesta (Output DTO)
    invalidFields: []    // Campos inválidos
}
```

**Estados posibles:**
- `success` - Operación exitosa con datos
- `unsuccess` - Operación fallida por regla de negocio
- `empty` - Operación exitosa pero sin datos (Query sin resultados)
- `invalid` - Datos de entrada inválidos
- `error` - Error del sistema/excepción

### 7. Zona Horaria UTC

**TODO el sistema maneja UTC internamente:**
- Core trabaja exclusivamente en UTC
- Infrastructure guarda/lee en UTC
- Presentation Layer convierte de timezone usuario → UTC (entrada)
- Presentation Layer convierte de UTC → timezone usuario (salida)

### 8. Snowflake IDs (Fuertemente Recomendado)

**Se recomienda usar IDs basados en Twitter Snowflake en lugar de auto-increment integers:**

**Estructura de Snowflake ID:**
```
 0                   41           51     64
 |--------------------|-----------|------|
 timestamp (41 bits) | node (10) | seq (12)
```

**Ventajas sobre Auto-Increment:**
- ✅ **Distribución**: Múltiples servidores pueden generar IDs sin conflictos
- ✅ **Performance**: No requiere consultar base de datos para obtener ID
- ✅ **Seguridad**: No revela cantidad de registros
- ✅ **Ordenamiento**: IDs más recientes tienen valores mayores
- ✅ **Microservicios**: Ideal para arquitecturas distribuidas

---

## Arquitectura

### Diagrama de Capas

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│      (REST / GraphQL / gRPC)                │
│  - Autenticación                            │
│  - Autorización                             │
│  - Validación de entrada                    │
│  - Conversión Timezone (User ↔ UTC)         │
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

### Estructura de Proyectos

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

## Estructura de Archivos (Nested Pattern)

### Comparación: Antes vs Ahora

**ANTES (5 archivos por operación):**
```
UsersQC/
  ├── User.cs
  ├── UserCRegister.cs
  ├── UserCRegisterI.cs      ← Archivo separado
  ├── UserCRegisterO.cs      ← Archivo separado
  └── UserCRegisterM.cs      ← Archivo separado

Uso:
var input = new UserCRegisterI { ... };
```

**AHORA (2 archivos - 60% reducción):**
```
UsersQC/
  ├── User.cs                # Entity compartida
  └── UserCCreate.cs         # Todo junto, cohesivo
      ├── class DataIn       # Nested
      ├── class DataOut      # Nested
      ├── class Messages     # Nested
      └── Handler()

Uso (Explícito):
var input = new UserCCreate.DataIn { ... };
var result = await command.Handler(input);
UserCCreate.DataOut output = result.Data;
```

### Anatomía de un Command/Query

**Pseudocódigo:**
```
// UserCCreate.{lang} - Un archivo, todo incluido

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

**Ver implementaciones completas en:**
- **C# Examples**: Artefacto separado con código completo
- **Python Examples**: Artefacto separado con código completo
- **TypeScript Examples**: Artefacto separado con código completo

---

## 4 Secciones del Handler (Commands)

**Los Commands siguen una estructura de 4 secciones en orden:**

### Sección 1: Clean (Sanitización)

**Propósito:** Limpiar y normalizar datos de entrada antes de cualquier validación.

**Responsabilidades:**
- Remover caracteres especiales no deseados
- Trim espacios en blanco
- Normalizar formato (lowercase, uppercase)
- Remover saltos de línea, tabs, etc.
- Limpiar números (remover comas, símbolos de moneda)

**NO hace:**
- Validar datos
- Consultar base de datos
- Lógica de negocio

**Ejemplo:**
```
#region Clean
input.Email = Clean(input.Email).ToLower()
input.Phone = CleanPhone(input.Phone)
input.Name = Clean(input.Name)
#endregion
```

### Sección 2: Validation (Validación de Formato)

**Propósito:** Verificar que los datos cumplan requisitos de formato y estructura.

**Responsabilidades:**
- Campos requeridos
- Longitud mínima/máxima
- Formato de email, teléfono, URL
- Rangos numéricos (min/max)
- Expresiones regulares

**NO hace:**
- Consultar base de datos
- Verificar reglas de negocio complejas
- Modificar datos

**Retorna:** `Result<T>` con `State = Invalid` y **código estructurado**

**Código obligatorio:** `[OPERACION]:VALIDATION:[RAZON_ESPECIFICA]`

**Ejemplo:**
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

**Códigos típicos de validación:**
- `USER_CREATE:VALIDATION:EMAIL_REQUIRED`
- `USER_CREATE:VALIDATION:EMAIL_INVALID_FORMAT`
- `USER_CREATE:VALIDATION:PASSWORD_TOO_SHORT`
- `ORDER_CREATE:VALIDATION:AMOUNT_OUT_OF_RANGE`
- `ORDER_CREATE:VALIDATION:QUANTITY_REQUIRED`

### Sección 3: Business Rules (Reglas de Negocio)

**Propósito:** Verificar reglas de negocio que pueden requerir consultas a la base de datos.

**Responsabilidades:**
- Verificar existencia de registros
- Validar unicidad (email no duplicado)
- Verificar permisos y autorizaciones
- Validar estados (usuario activo, orden cancelable)
- Verificar límites (cuota alcanzada, máximo de registros)
- Validar relaciones entre entidades

**SÍ puede:**
- Consultar base de datos (SOLO lectura)
- Llamar otros Queries
- Verificar condiciones complejas

**NO hace:**
- Modificar base de datos
- Crear/actualizar/eliminar registros
- Ejecutar el proceso principal

**Retorna:** `Result<T>` con `State = Unsuccess` si falla una regla

**Ejemplo:**
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

### Sección 4: Process (Proceso Principal)

**Propósito:** Ejecutar la operación principal si todas las validaciones y reglas pasaron.

**Responsabilidades:**
- Crear/actualizar/eliminar registros
- Ejecutar transacciones
- Llamar servicios externos (email, SMS, etc.)
- Generar tokens, códigos
- Generar Snowflake IDs
- Crear registros relacionados

**Retorna:** `Result<T>` con `State = Success` y `Data` poblada

**Ejemplo:**
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

### Notas Importantes

**¿Son obligatorias todas las secciones?**
- ❌ NO todas son obligatorias en todos los casos
- ✅ SÍ debes seguir el ORDEN si usas las secciones
- ✅ Queries generalmente solo tienen #region Process

**Regla de Oro:**
> Si una sección no es necesaria, omítela. Pero si la usas, respeta el orden: Clean → Validation → Business Rules → Process

---

## Interfaces y Dependency Injection

### Interfaces en el Core

**Pseudocódigo:**
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

### Implementaciones en Infrastructure

**Pseudocódigo:**
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

### Configuración de Dependency Injection

**Pseudocódigo:**
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

## Snowflake IDs - Recomendación Fuerte

### ¿Por qué Snowflake IDs?

**Problemas con Auto-Increment:**
- ❌ Requiere base de datos centralizada
- ❌ Bottleneck en alta concurrencia
- ❌ Revela información del negocio (ID 1000 = 1000 usuarios)
- ❌ Problemas en sistemas distribuidos
- ❌ Conflictos al mergear bases de datos

**Ventajas de Snowflake:**
- ✅ Generación distribuida sin coordinación
- ✅ Performance alta (sin consultar DB)
- ✅ Ordenamiento cronológico automático
- ✅ Único globalmente
- ✅ Ideal para microservicios

### Implementación

**Uso en Commands:**
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

### Configuración por Servidor

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

**CRÍTICO:** Cada servidor/proceso DEBE tener un NODE_ID único para garantizar IDs únicos globalmente.

---

## Helpers de Sanitización

**Pseudocódigo:**
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

## Reglas de Oro

### 🔐 **16 Reglas Inquebrantables**

1. **Explícito sobre Implícito**: SIEMPRE priorizar claridad sobre brevedad
2. **UTC Everywhere in Core**: Core NUNCA maneja otra timezone que no sea UTC
3. **Handler Method**: Toda Query/Command tiene un método `Handler()` como punto de entrada
4. **Result Envelope**: TODO retorna `Result<T>` con estados definidos
5. **Nested Structure per Operation**: DataIn, DataOut, Messages en el mismo archivo
6. **JSON Communication**: Toda comunicación entre capas es JSON
7. **Dependency Inversion**: Core define interfaces, Infrastructure las implementa
8. **No Direct Infrastructure in Core**: Core NUNCA instancia clases de Infrastructure
9. **Dependency Injection**: Todas las dependencias se inyectan
10. **Timezone Conversion Only in Presentation**: API layer maneja conversiones TZ
11. **Messages Required**: Toda operación tiene Messages para multiidioma
12. **Entity = Persistence Model**: Entity representa exactamente el modelo de DB
13. **4 Sections Order**: Clean → Validation → Business Rules → Process
14. **Infrastructure Concerns in Infrastructure**: Cache, logging, métricas = Infrastructure
15. **Core is Pure Business Logic**: Core solo contiene lógica de negocio
16. **Snowflake IDs Strongly Recommended**: Usar Snowflake IDs en entidades principales

---

## Guía de Implementación

### Paso 1: Crear Estructura de Proyectos

1. Crear proyecto **Core** (sin dependencias externas)
2. Crear proyecto **Infrastructure** (referencia Core)
3. Crear proyecto **API** (referencia Core + Infrastructure)
4. Crear proyecto **Helpers** (opcional, utilidades)

### Paso 2: Definir Interfaces en Core

```
Core/Interfaces/
  ├── IUserRepository
  ├── IEmailService
  ├── ISnowflakeIdGenerator
  └── IDateTimeProvider
```

### Paso 3: Crear Entity

```
Core/Entities/UsersQC/User.{lang}

User {
    userId: long  // Snowflake ID
    email: string
    name: string
    createdAt: datetime  // UTC
}
```

### Paso 4: Implementar Command/Query

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

### Paso 5: Implementar Infrastructure

```
Infrastructure/Database/UserRepository.{lang}
Infrastructure/IdGeneration/SnowflakeIdGenerator.{lang}
Infrastructure/Services/DateTimeProvider.{lang}
```

### Paso 6: Configurar Dependency Injection

```
// Get nodeId from configuration
nodeId = Config.Get("NodeId")

// Register infrastructure
services.RegisterSingleton<ISnowflakeIdGenerator>(new SnowflakeIdGenerator(nodeId))
services.RegisterScoped<IUserRepository, UserRepository>()

// Register commands/queries
services.RegisterScoped<UserCCreate>()
```

### Paso 7: Crear Controller

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
- [ ] Proyecto Core creado sin dependencias externas
- [ ] Carpeta `Entities/` creada
- [ ] Carpeta `Interfaces/` creada
- [ ] Por cada entidad, crear carpeta `[Entity]QC/`
- [ ] Entity sin sufijos creada (User.cs, Order.cs)
- [ ] Cada Query/Command tiene estructura nested (DataIn/DataOut/Messages)
- [ ] Método `Handler()` como punto de entrada
- [ ] TODO el sistema maneja fechas en UTC
- [ ] Cero referencias a infraestructura en Core
- [ ] Interfaces definidas para todos los servicios externos
- [ ] Comunicación en JSON

### Infrastructure Layer
- [ ] Implementaciones de repositorios
- [ ] SnowflakeIdGenerator con NODE_ID único por servidor
- [ ] DateTimeProvider siempre retorna UTC
- [ ] Implementaciones de servicios externos
- [ ] Base de datos guarda fechas en UTC
- [ ] No contiene lógica de negocio

### API/Presentation Layer
- [ ] Middleware de autenticación configurado
- [ ] Middleware de autorización configurado
- [ ] Controllers llaman método `Handler()` de Commands/Queries
- [ ] Conversión de fechas: User TZ → UTC (entrada)
- [ ] Conversión de fechas: UTC → User TZ (salida)
- [ ] Validación de entrada implementada
- [ ] Manejo de errores centralizado
- [ ] Documentación API (Swagger/GraphiQL)

### Naming Conventions
- [ ] Archivos/Clases: `[Entity][Q|C][Action]`
- [ ] Nested classes: `DataIn`, `DataOut`, `Messages`
- [ ] Entity: `[Entity]` (sin sufijos)
- [ ] Método principal: `Handler()`

### Testing
- [ ] Tests unitarios de Core (sin mocks complejos)
- [ ] Tests verifican manejo correcto de UTC
- [ ] Tests de conversión timezone en API
- [ ] Tests de mensajes multiidioma
- [ ] Tests verifican Snowflake IDs únicos

---

## Preguntas Frecuentes

**Q: ¿Por qué 2 archivos en lugar de 5?**
A: La nueva estructura nested agrupa todo lo relacionado a una operación en un solo archivo, mejorando cohesión y reduciendo navegación. Antes: 5 archivos dispersos. Ahora: Entity + 1 archivo con todo nested = 60% menos archivos, 100% más cohesión.

**Q: ¿Por qué DataIn/DataOut y no Input/Output o Request/Response?**
A: Principio "Explícito sobre Implícito". Input/Output son genéricos y pueden referirse a I/O de sistema. Request/Response implican contexto HTTP. DataIn/DataOut son explícitos: datos que entran/salen del Handler.

**Q: ¿Puedo usar esta arquitectura con lenguajes dinámicos como Python/Node.js?**
A: Sí, los principios son agnósticos. Python usa nested classes, TypeScript usa namespaces. Los ejemplos completos están en los artefactos separados.

**Q: ¿Qué pasa si una operación no necesita Input DTO?**
A: No lo crees. Ejemplo: `UserQGetAll` no necesita parámetros, solo tiene DataOut. La clase Messages sigue siendo necesaria para posibles mensajes de error.

**Q: ¿Dónde van las validaciones de entrada?**
A: Validaciones **técnicas** (formato email, longitud) van en la sección Validation del Handler. Validaciones de **negocio** (email ya existe) van en la sección Business Rules.

**Q: ¿Cómo manejo transacciones de base de datos?**
A: La infraestructura maneja transacciones. El Core define los límites mediante el patrón Unit of Work. El Handler ejecuta operaciones, la infraestructura asegura atomicidad.

**Q: ¿Un Command puede llamar a otro Command?**
A: Sí, pero con precaución. Si la lógica es compleja, considera extraer a clases auxiliares o servicios de dominio. Evita cadenas largas de Commands llamando Commands.

**Q: ¿Cómo traduzco mensajes dinámicamente?**
A: La clase Messages recibe el idioma. El Presentation Layer detecta el idioma del usuario (header, JWT, configuración) y lo pasa al crear el Command/Query.

**Q: ¿Por qué JSON para comunicación interna?**
A: Estandarización y consistencia. Facilita debugging, logging, y hace el sistema agnóstico de tecnología. Puedes serializar/deserializar fácilmente entre capas.

**Q: ¿Qué hago con fechas que el usuario envía?**
A: Si el usuario envía una fecha (ej: "agendar para mañana a las 3pm"), el Presentation Layer DEBE convertirla del timezone del usuario a UTC antes de enviarla al Core. El Core solo trabaja UTC.

**Q: ¿La Entity puede tener lógica de negocio?**
A: La Entity es un modelo de datos simple (POCO/Plain Object). La lógica de negocio va en Commands/Queries. La Entity solo tiene propiedades para persistencia.

**Q: ¿Puedo usar ORMs como Entity Framework, SQLAlchemy, TypeORM?**
A: Sí. Los ORMs van en la capa Infrastructure. El Core solo conoce las interfaces de repositorios, no la implementación concreta.

**Q: ¿Cómo testeo un Command que usa múltiples servicios?**
A: Mock las interfaces. Como el Core depende de abstracciones (IUserRepository, IEmailService), puedes mockearlas fácilmente en tests unitarios sin necesitar bases de datos reales.

**Q: ¿Esta arquitectura funciona con microservicios?**
A: Sí. Cada microservicio puede seguir esta arquitectura internamente. La comunicación entre microservicios ocurre en la capa Infrastructure (HTTP clients, message queues).

**Q: ¿Cuándo NO usar esta arquitectura?**
A: Para proyectos muy simples (< 5 entidades, CRUD básico sin lógica), scripts de una sola vez, prototipos rápidos, o cuando el equipo no puede comprometerse a seguir las convenciones.

**Q: ¿Por qué Snowflake IDs en lugar de auto-increment?**
A: Snowflake IDs son generados localmente sin consultar la base de datos, funcionan en sistemas distribuidos sin coordinación, no revelan información de negocio, y son ideales para microservicios y alta concurrencia.

**Q: ¿Qué pasa si dos servidores generan el mismo Snowflake ID?**
A: Imposible si cada servidor tiene un NODE_ID único. Los primeros 10 bits del ID identifican el nodo, garantizando unicidad global. Es crítico que cada servidor/proceso tenga su propio NODE_ID.

**Q: ¿Cómo migro de auto-increment a Snowflake?**
A: Agrega columna snowflake_id, genera IDs para registros existentes, usa dual-ID temporalmente, migra referencias gradualmente. O simplemente usa Snowflake para todas las entidades nuevas.

**Q: ¿Los Snowflake IDs son compatibles con bases de datos relacionales?**
A: Sí, totalmente. Se almacenan como BIGINT (64 bits). Funcionan perfectamente con PostgreSQL, MySQL, SQL Server, etc. Solo asegúrate de usar el tipo de dato correcto (long/bigint).

**Q: ¿Qué pasa si el reloj del servidor retrocede?**
A: El generador de Snowflake lanza una excepción. Usa NTP para sincronizar relojes y monitorea clock drift. Nunca permitas que el sistema continúe si detecta retroceso de reloj.

---

## Ventajas y Limitaciones

### ✅ Ventajas

1. **Testabilidad Extrema**: Core testeable sin bases de datos o servicios externos
2. **Claridad**: Cualquier desarrollador encuentra el código rápidamente
3. **Flexibilidad de Protocolo**: Cambiar de REST a GraphQL sin tocar Core
4. **Mantenibilidad**: Código organizado por concepto de negocio
5. **Onboarding Rápido**: Convenciones claras facilitan incorporación de nuevos devs
6. **Evolución Independiente**: Core y API evolucionan por separado
7. **Menos Archivos**: 60% reducción con estructura nested
8. **Nombres Explícitos**: DataIn/DataOut son autoexplicativos
9. **Distribución**: Snowflake IDs permiten sistemas distribuidos sin conflictos
10. **Performance**: IDs generados localmente sin consultar DB

### ⚠️ Consideraciones

1. **Curva de Aprendizaje Inicial**: Requiere disciplina en seguir convenciones
2. **Archivos Más Largos**: Estructura nested significa archivos de 200-400 líneas
3. **Boilerplate**: Más código de configuración inicial
4. **Overkill para Proyectos Simples**: CRUD básicos pueden no justificar esta arquitectura
5. **Sincronización de Relojes**: Snowflake IDs requieren NTP para evitar conflictos

### 📊 Trade-offs

| Aspecto | Trade-off |
|---------|-----------|
| Setup inicial | 🔴 Más complejo → 🟢 Paga dividendos en mantenimiento |
| Archivos | 🟢 60% menos archivos → 🔴 Archivos más largos |
| Acoplamiento | 🟢 Bajo acoplamiento → 🔴 Más interfaces |
| Tests | 🟢 Muy fácil → 🔴 Requiere configurar DI |
| Multiidioma | 🟢 Soporte nativo → 🔴 Clase Messages por operación |
| Timezones | 🟢 Consistencia UTC → 🔴 Conversión en cada endpoint |
| IDs | 🟢 Snowflake distribuido → 🔴 Requiere NTP y NODE_ID único |

---

## Escalabilidad

### Proyectos Pequeños (< 10 entidades)
```
MyProject.Core/
MyProject.Infrastructure/
MyProject.API.REST/
```

### Proyectos Medianos (10-50 entidades)
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

### Proyectos Grandes (50+ entidades)
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

### Microservicios

Cada microservicio usa la misma arquitectura:
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

Cada servicio tiene su propio NODE_ID range para Snowflake IDs:
```
UserService:   NODE_ID = 0-99
OrderService:  NODE_ID = 100-199
BillingService: NODE_ID = 200-299
```

---

## Ejemplos de Uso

### Crear Usuario

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

### Consultar Usuario

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

## Recursos y Herramientas

### Sobre el Nombre de la Arquitectura

**"Entity-Driven Clean Architecture"** es único en su combinación específica de:
1. Organización estricta por entidades (no por capas técnicas)
2. Convención de nomenclatura QC explícita
3. Patrón Handler obligatorio
4. Estructura nested con DataIn/DataOut/Messages
5. Sistema UTC estricto
6. Result Envelope estandarizado
7. Snowflake IDs como recomendación
8. Principio "Explícito sobre Implícito"

Conceptos relacionados pero diferentes:
- **Clean Architecture** (Robert C. Martin) - Principios base
- **Domain-Driven Design** (Eric Evans) - Enfoque en dominio
- **CQRS Pattern** - Separación Commands/Queries
- **Hexagonal Architecture** - Ports and Adapters

### Herramientas Recomendadas

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

### Implementaciones de Referencia

Ver artefactos separados con código completo funcional:
- **C# Examples**: ~600 líneas con ASP.NET Core, Entity Framework
- **Python Examples**: ~550 líneas con FastAPI, SQLAlchemy
- **TypeScript Examples**: ~650 líneas con Express, TypeORM

---

## Contribuciones

Este white paper es un documento vivo. Sugerencias de mejora son bienvenidas.

### Cómo Contribuir
1. Fork el repositorio
2. Crea branch con tu mejora
3. Envía Pull Request con descripción clara

---

## Licencia

Este documento y arquitectura están bajo licencia MIT. Libre de usar en proyectos comerciales y open source.

---

## Changelog

### v1.0.0 (2025)
- Versión inicial del white paper
- Estructura nested con DataIn/DataOut/Messages
- Principio "Explícito sobre Implícito"
- Convención QC establecida
- Snowflake IDs recomendados
- Ejemplos en C#, Python, TypeScript
- 16 Reglas de Oro
- Result Envelope Pattern
- UTC estricto documentado
- 4 secciones del Handler
- Reducción de 60% en archivos

---

## Resumen Final

**Entity-Driven Clean Architecture** es una arquitectura práctica, probada y escalable para backends modernos que prioriza:

1. **Claridad**: Explícito sobre implícito en todo momento
2. **Organización**: Por entidades de negocio, no por capas técnicas
3. **Testabilidad**: Core 100% independiente de infraestructura
4. **Mantenibilidad**: Estructura nested cohesiva con 60% menos archivos
5. **Escalabilidad**: Desde proyectos pequeños hasta microservicios
6. **Distribución**: Snowflake IDs para sistemas distribuidos
7. **Consistencia**: UTC en Core, conversión en Presentation
8. **Flexibilidad**: Agnóstica de protocolo (REST/GraphQL/gRPC)

**Filosofía Core:**
> "El código debe ser tan explícito que un desarrollador nuevo pueda entender qué hace una operación simplemente leyendo el nombre del archivo y sus clases nested. La arquitectura debe ayudar, no estorbar."

**Empieza hoy:**
1. Crea tu primer Command con DataIn/DataOut/Messages
2. Implementa Result Envelope
3. Usa Snowflake IDs desde el inicio
4. Mantén UTC estricto en Core
5. Sigue el orden Clean → Validation → Business Rules → Process

---

**¿Preguntas? ¿Feedback?**

Este white paper documenta una arquitectura real, usada en producción, que ha demostrado su valor en múltiples proyectos. Los ejemplos de código en los artefactos separados son funcionales y listos para usar.

**Ver implementaciones completas:**
- [C# Examples](link-to-artifact)
- [Python Examples](link-to-artifact)  
- [TypeScript Examples](link-to-artifact)

---

**Creado con ❤️ para la comunidad de desarrolladores**

*"La mejor arquitectura es aquella que hace el código tan obvio que los comentarios son innecesarios."*
