// ====================================================================
// ENTITY-DRIVEN CLEAN ARCHITECTURE - C# EXAMPLES
// 
// GitHub: https://github.com/[tu-usuario]/entity-driven-clean-architecture
// License: MIT
// 
// This file contains complete, functional examples of:
// - Result Envelope Pattern
// - Command/Query with nested DataIn/DataOut/Messages
// - Snowflake ID Generator
// - Dependency Injection setup
// - Clean helpers
// 
// For full documentation, see README.md
// ====================================================================

// ====================================================================
// ENTITY-DRIVEN CLEAN ARCHITECTURE - C# IMPLEMENTATION EXAMPLES
// Updated: Nested DataIn/DataOut/Messages Structure
// ====================================================================

// ====================================================================
// 1. RESULT ENVELOPE PATTERN
// ====================================================================

namespace Core.Common;

public class Result
{
    public Result()
    {
        this.State = ResultsStates.Success;
    }
    
    public Result(string state, Messages message, string code = "")
    {
        this.State = state;
        this.Message = message;
        this.Code = code;
    }
    
    public string State { get; set; }
    public string Code { get; set; }
    public Messages Message { get; set; }
    public IReadOnlyList<InvalidPropertyInfo> InvalidFields { get; set; }
}

public class Result<T> : Result
{
    public Result() : base()
    {
        this.State = ResultsStates.Success;
    }
    
    public Result(string state, Messages message, string code = "") 
        : base(state, message, code)
    {
    }
    
    public T Data { get; set; }
}

public static class ResultsStates
{
    public const string Success = "success";
    public const string Unsuccess = "unsuccess";
    public const string Empty = "empty";
    public const string Invalid = "invalid";
    public const string Error = "error";
}

public class InvalidPropertyInfo
{
    public string PropertyName { get; set; }
    public string UserMessage { get; set; }
    public string ValidationMessage { get; set; }
    public string ValidationCode { get; set; }
}

public class Messages
{
    public string ApiMessage { get; set; }
    public string UserMessage { get; set; }
}

public static class ResultCheckData<T>
{
    public static Result<IEnumerable<T>> Multiple(IEnumerable<T> dataSet)
    {
        try
        {
            if (dataSet.Any())
            {
                return new Result<IEnumerable<T>>(
                    ResultsStates.Success, 
                    new Messages()
                ) { 
                    Data = dataSet.ToList() 
                };
            }
            else
            {
                return new Result<IEnumerable<T>>(
                    ResultsStates.Empty, 
                    new Messages()
                );
            }
        }
        catch (Exception ex)
        {
            return new Result<IEnumerable<T>>(
                ResultsStates.Error, 
                new Messages()
            );
        }
    }
    
    public static Result<T> Single(IEnumerable<T> dataSet)
    {
        try
        {
            if (dataSet.Any())
            {
                return new Result<T>(
                    ResultsStates.Success, 
                    new Messages()
                ) { 
                    Data = dataSet.FirstOrDefault() 
                };
            }
            else
            {
                return new Result<T>(
                    ResultsStates.Empty, 
                    new Messages()
                );
            }
        }
        catch (Exception ex)
        {
            return new Result<T>(
                ResultsStates.Error, 
                new Messages()
            );
        }
    }
}

// ====================================================================
// 2. ENTITY (Persistence Model) - Shared
// ====================================================================

namespace Core.Entities.UsersQC;

/// <summary>
/// User entity - Persistence model shared across all User operations
/// </summary>
public class User
{
    public long UserId { get; set; }  // Snowflake ID
    public string Email { get; set; }
    public string Name { get; set; }
    public string PasswordHash { get; set; }
    public string PasswordSalt { get; set; }
    public DateTime CreatedAt { get; set; }  // Always UTC
    public DateTime? UpdatedAt { get; set; } // Always UTC
    public string Status { get; set; }
    public int? FailLoginCount { get; set; }
    public DateTime? LastLoginAttemptDate { get; set; }
}

// ====================================================================
// 3. COMMAND WITH NESTED STRUCTURE (Complete Example)
// ====================================================================

/// <summary>
/// UserCCreate - Command to create a new user
/// Contains all related DTOs and Messages as nested classes
/// </summary>
public class UserCCreate
{
    #region Nested Classes - Data Transfer Objects
    
    /// <summary>
    /// DataIn - Explicit: Data coming INTO the Handler
    /// </summary>
    public class DataIn
    {
        public string Email { get; set; }
        public string Name { get; set; }
        public string Password { get; set; }
    }
    
    /// <summary>
    /// DataOut - Explicit: Data going OUT of the Handler
    /// </summary>
    public class DataOut
    {
        public long UserId { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; }  // UTC
    }
    
    /// <summary>
    /// Messages - Multilanguage messages for this operation
    /// </summary>
    public static class Messages
    {
        private static readonly Dictionary<string, Dictionary<string, Core.Common.Messages>> _messages = new()
        {
            ["en"] = new Dictionary<string, Core.Common.Messages>
            {
                ["EmailRequired"] = new Core.Common.Messages
                {
                    ApiMessage = "Email is required",
                    UserMessage = "Please enter your email address"
                },
                ["EmailExists"] = new Core.Common.Messages
                {
                    ApiMessage = "Email already exists",
                    UserMessage = "This email is already registered"
                },
                ["PasswordTooShort"] = new Core.Common.Messages
                {
                    ApiMessage = "Password must be at least 8 characters",
                    UserMessage = "Password must be at least 8 characters"
                }
            },
            ["es"] = new Dictionary<string, Core.Common.Messages>
            {
                ["EmailRequired"] = new Core.Common.Messages
                {
                    ApiMessage = "El correo es requerido",
                    UserMessage = "Por favor ingrese su correo electrónico"
                },
                ["EmailExists"] = new Core.Common.Messages
                {
                    ApiMessage = "El correo ya existe",
                    UserMessage = "Este correo ya está registrado"
                },
                ["PasswordTooShort"] = new Core.Common.Messages
                {
                    ApiMessage = "La contraseña debe tener al menos 8 caracteres",
                    UserMessage = "La contraseña debe tener al menos 8 caracteres"
                }
            }
        };
        
        public static Core.Common.Messages Get(string language, string key)
        {
            if (!_messages.ContainsKey(language)) language = "en";
            return _messages[language].GetValueOrDefault(key, new Core.Common.Messages());
        }
    }
    
    #endregion
    
    #region Dependencies
    
    private readonly ISnowflakeIdGenerator _idGenerator;
    private readonly IUserRepository _repository;
    private readonly IEmailService _emailService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly string _language;
    
    #endregion
    
    #region Constructor
    
    public UserCCreate(
        ISnowflakeIdGenerator idGenerator,
        IUserRepository repository,
        IEmailService emailService,
        IDateTimeProvider dateTimeProvider,
        string language = "en")
    {
        _idGenerator = idGenerator;
        _repository = repository;
        _emailService = emailService;
        _dateTimeProvider = dateTimeProvider;
        _language = language;
    }
    
    #endregion
    
    #region Handler Method
    
    /// <summary>
    /// Handler - Main entry point for UserCCreate command
    /// </summary>
    public async Task<Result<DataOut>> Handler(DataIn input)
    {
        try
        {
            #region Clean
            input.Email = input.Email?.Clean().ToLower();
            input.Name = input.Name?.Clean();
            input.Password = input.Password?.Trim();
            #endregion
            
            #region Validation
            string prefix = "USER_CREATE";
            
            if (string.IsNullOrWhiteSpace(input.Email))
            {
                return new Result<DataOut>(
                    ResultsStates.Invalid,
                    Messages.Get(_language, "EmailRequired"),
                    $"{prefix}:EMAIL_REQUIRED"
                );
            }
            
            if (input.Password.Length < 8)
            {
                return new Result<DataOut>(
                    ResultsStates.Invalid,
                    Messages.Get(_language, "PasswordTooShort"),
                    $"{prefix}:PASSWORD_TOO_SHORT"
                );
            }
            #endregion
            
            #region Business Rules
            if (await _repository.ExistsByEmailAsync(input.Email))
            {
                return new Result<DataOut>(
                    ResultsStates.Unsuccess,
                    Messages.Get(_language, "EmailExists"),
                    $"{prefix}:EMAIL_EXISTS"
                );
            }
            #endregion
            
            #region Process
            // Generate Snowflake ID
            var userId = _idGenerator.GenerateId();
            
            var user = new User
            {
                UserId = userId,
                Email = input.Email,
                Name = input.Name,
                PasswordHash = HashPassword(input.Password),
                CreatedAt = _dateTimeProvider.UtcNow,  // Always UTC
                Status = "active"
            };
            
            await _repository.CreateAsync(user);
            await _emailService.SendWelcomeEmailAsync(user.Email, user.Name);
            
            return new Result<DataOut>(
                ResultsStates.Success,
                new Core.Common.Messages(),
                $"{prefix}:SUCCESS"
            )
            {
                Data = MapToDataOut(user)
            };
            #endregion
        }
        catch (Exception ex)
        {
            return new Result<DataOut>(
                ResultsStates.Error,
                new Core.Common.Messages(),
                "USER_CREATE:SYSTEM_ERROR"
            );
        }
    }
    
    #endregion
    
    #region Private Mappers
    
    private DataOut MapToDataOut(User user)
    {
        return new DataOut
        {
            UserId = user.UserId,
            Email = user.Email,
            Name = user.Name,
            CreatedAt = user.CreatedAt
        };
    }
    
    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
    
    #endregion
}

// ====================================================================
// 4. QUERY WITH NESTED STRUCTURE (Example)
// ====================================================================

/// <summary>
/// UserQGetByID - Query to get user by ID
/// Contains all related DTOs and Messages as nested classes
/// </summary>
public class UserQGetByID
{
    #region Nested Classes
    
    public class DataIn
    {
        public long UserId { get; set; }
    }
    
    public class DataOut
    {
        public long UserId { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; }  // UTC
    }
    
    public static class Messages
    {
        // Queries typically have fewer messages
        private static readonly Dictionary<string, Dictionary<string, Core.Common.Messages>> _messages = new()
        {
            ["en"] = new Dictionary<string, Core.Common.Messages>
            {
                ["UserNotFound"] = new Core.Common.Messages
                {
                    ApiMessage = "User not found",
                    UserMessage = "The requested user was not found"
                }
            },
            ["es"] = new Dictionary<string, Core.Common.Messages>
            {
                ["UserNotFound"] = new Core.Common.Messages
                {
                    ApiMessage = "Usuario no encontrado",
                    UserMessage = "El usuario solicitado no fue encontrado"
                }
            }
        };
        
        public static Core.Common.Messages Get(string language, string key)
        {
            if (!_messages.ContainsKey(language)) language = "en";
            return _messages[language].GetValueOrDefault(key, new Core.Common.Messages());
        }
    }
    
    #endregion
    
    #region Dependencies
    
    private readonly IUserRepository _repository;
    private readonly string _language;
    
    #endregion
    
    #region Constructor
    
    public UserQGetByID(IUserRepository repository, string language = "en")
    {
        _repository = repository;
        _language = language;
    }
    
    #endregion
    
    #region Handler Method
    
    public async Task<Result<DataOut>> Handler(DataIn input)
    {
        try
        {
            #region Process
            var user = await _repository.GetByIdAsync(input.UserId);
            
            if (user == null)
            {
                return new Result<DataOut>(
                    ResultsStates.Empty,
                    new Core.Common.Messages()
                );
            }
            
            return new Result<DataOut>(
                ResultsStates.Success,
                new Core.Common.Messages()
            )
            {
                Data = MapToDataOut(user)
            };
            #endregion
        }
        catch (Exception ex)
        {
            return new Result<DataOut>(
                ResultsStates.Error,
                new Core.Common.Messages()
            );
        }
    }
    
    #endregion
    
    #region Private Mappers
    
    private DataOut MapToDataOut(User user)
    {
        return new DataOut
        {
            UserId = user.UserId,
            Email = user.Email,
            Name = user.Name,
            CreatedAt = user.CreatedAt
        };
    }
    
    #endregion
}

// ====================================================================
// 5. QUERY WITHOUT INPUT (GetAll Example)
// ====================================================================

public class UserQGetAll
{
    #region Nested Classes
    
    // No DataIn needed for GetAll
    
    public class DataOut
    {
        public long UserId { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    
    public static class Messages
    {
        // Messages if needed
    }
    
    #endregion
    
    private readonly IUserRepository _repository;
    
    public UserQGetAll(IUserRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<Result<IEnumerable<DataOut>>> Handler()
    {
        try
        {
            #region Process
            var users = await _repository.GetAllAsync();
            
            var output = users.Select(MapToDataOut);
            
            return ResultCheckData<DataOut>.Multiple(output);
            #endregion
        }
        catch (Exception ex)
        {
            return new Result<IEnumerable<DataOut>>(
                ResultsStates.Error,
                new Core.Common.Messages()
            );
        }
    }
    
    private DataOut MapToDataOut(User user)
    {
        return new DataOut
        {
            UserId = user.UserId,
            Email = user.Email,
            Name = user.Name,
            CreatedAt = user.CreatedAt
        };
    }
}

// ====================================================================
// 6. INTERFACES (Core/Interfaces)
// ====================================================================

namespace Core.Interfaces;

public interface IUserRepository
{
    Task<User> GetByIdAsync(long id);
    Task<User> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<IEnumerable<User>> GetAllAsync();
    Task CreateAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(long id);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendWelcomeEmailAsync(string email, string name);
}

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}

public interface ISnowflakeIdGenerator
{
    long GenerateId();
}

// ====================================================================
// 7. INFRASTRUCTURE IMPLEMENTATIONS
// ====================================================================

namespace Infrastructure.Database;

public class UserRepository : IUserRepository
{
    private readonly DbContext _context;
    
    public UserRepository(DbContext context)
    {
        _context = context;
    }
    
    public async Task<User> GetByIdAsync(long id)
    {
        return await _context.Users.FindAsync(id);
    }
    
    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email == email);
    }
    
    public async Task CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }
}

// ====================================================================
// 8. USAGE IN CONTROLLER
// ====================================================================

namespace API.REST.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserCCreate _createCommand;
    private readonly UserQGetByID _getByIdQuery;
    
    public UsersController(
        UserCCreate createCommand,
        UserQGetByID getByIdQuery)
    {
        _createCommand = createCommand;
        _getByIdQuery = getByIdQuery;
    }
    
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create(
        [FromBody] UserCCreate.DataIn request)  // ← Explicit nested class
    {
        var result = await _createCommand.Handler(request);
        
        if (result.State == ResultsStates.Success)
        {
            return CreatedAtAction(
                nameof(GetById), 
                new { id = result.Data.UserId }, 
                result.Data
            );
        }
        else if (result.State == ResultsStates.Invalid)
        {
            return BadRequest(new
            {
                state = result.State,
                code = result.Code,
                message = result.Message.UserMessage
            });
        }
        else
        {
            return StatusCode(400, new
            {
                state = result.State,
                code = result.Code,
                message = result.Message.UserMessage
            });
        }
    }
    
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(long id)
    {
        var input = new UserQGetByID.DataIn { UserId = id };  // ← Explicit
        var result = await _getByIdQuery.Handler(input);
        
        if (result.State == ResultsStates.Success)
        {
            return Ok(result.Data);
        }
        else if (result.State == ResultsStates.Empty)
        {
            return NotFound();
        }
        else
        {
            return StatusCode(500);
        }
    }
}

// ====================================================================
// 9. CLEAN HELPERS
// ====================================================================

namespace Helpers;

public static class StringExtensions
{
    public static string Clean(this string str)
    {
        str = str ?? "";
        str = str.Replace("\r", "")
                 .Replace("\n", "")
                 .Replace("\t", "")
                 .Trim();
        return str;
    }
}

// ====================================================================
// 10. SNOWFLAKE ID GENERATOR
// ====================================================================

namespace Infrastructure.IdGeneration;

public class SnowflakeIdGenerator : ISnowflakeIdGenerator
{
    private const long EPOCH = 1704067200000L;
    private readonly int _nodeId;
    private long _sequence = 0L;
    private long _lastTimestamp = -1L;
    private readonly object _lock = new object();
    
    public SnowflakeIdGenerator(int nodeId)
    {
        if (nodeId < 0 || nodeId > 1023)
            throw new ArgumentException("Node ID must be between 0 and 1023");
        _nodeId = nodeId;
    }
    
    public long GenerateId()
    {
        lock (_lock)
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            if (timestamp < _lastTimestamp)
                throw new InvalidOperationException("Clock moved backwards");
            
            if (timestamp == _lastTimestamp)
            {
                _sequence = (_sequence + 1) & 4095;
                if (_sequence == 0)
                {
                    while (timestamp <= _lastTimestamp)
                    {
                        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    }
                }
            }
            else
            {
                _sequence = 0;
            }
            
            _lastTimestamp = timestamp;
            return ((timestamp - EPOCH) << 22) | ((long)_nodeId << 12) | _sequence;
        }
    }
}

// ====================================================================
// 11. DEPENDENCY INJECTION SETUP
// ====================================================================

// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Snowflake ID Generator
var nodeId = builder.Configuration.GetValue<int>("NodeId", 0);
builder.Services.AddSingleton<ISnowflakeIdGenerator>(
    new SnowflakeIdGenerator(nodeId)
);

// Infrastructure
builder.Services.AddDbContext<AppDbContext>();
builder.Services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Core Commands and Queries
builder.Services.AddScoped<UserCCreate>();
builder.Services.AddScoped<UserQGetByID>();
builder.Services.AddScoped<UserQGetAll>();

var app = builder.Build();
app.MapControllers();
app.Run();

namespace Core.Common;

public class Result
{
    public Result()
    {
        this.State = ResultsStates.Success;
    }
    
    public Result(string state, Messages message, string code = "")
    {
        this.State = state;
        this.Message = message;
        this.Code = code;
    }
    
    public string State { get; set; }
    public string Code { get; set; }
    public Messages Message { get; set; }
    public IReadOnlyList<InvalidPropertyInfo> InvalidFields { get; set; }
}

public class Result<T> : Result
{
    public Result() : base()
    {
        this.State = ResultsStates.Success;
    }
    
    public Result(string state, Messages message, string code = "") 
        : base(state, message, code)
    {
    }
    
    public T Data { get; set; }
}

public static class ResultsStates
{
    public const string Success = "success";
    public const string Unsuccess = "unsuccess";
    public const string Empty = "empty";
    public const string Invalid = "invalid";
    public const string Error = "error";
}

public class InvalidPropertyInfo
{
    public string PropertyName { get; set; }
    public string UserMessage { get; set; }
    public string ValidationMessage { get; set; }
    public string ValidationCode { get; set; }
}

public class Messages
{
    public string ApiMessage { get; set; }
    public string UserMessage { get; set; }
}

public static class ResultCheckData<T>
{
    public static Result<IEnumerable<T>> Multiple(IEnumerable<T> dataSet)
    {
        try
        {
            if (dataSet.Any())
            {
                return new Result<IEnumerable<T>>(
                    ResultsStates.Success, 
                    new Messages()
                ) { 
                    Data = dataSet.ToList() 
                };
            }
            else
            {
                return new Result<IEnumerable<T>>(
                    ResultsStates.Empty, 
                    new Messages()
                );
            }
        }
        catch (Exception ex)
        {
            return new Result<IEnumerable<T>>(
                ResultsStates.Error, 
                new Messages()
            );
        }
    }
    
    public static Result<T> Single(IEnumerable<T> dataSet)
    {
        try
        {
            if (dataSet.Any())
            {
                return new Result<T>(
                    ResultsStates.Success, 
                    new Messages()
                ) { 
                    Data = dataSet.FirstOrDefault() 
                };
            }
            else
            {
                return new Result<T>(
                    ResultsStates.Empty, 
                    new Messages()
                );
            }
        }
        catch (Exception ex)
        {
            return new Result<T>(
                ResultsStates.Error, 
                new Messages()
            );
        }
    }
}

// ====================================================================
// 2. ENTITY (Persistence Model)
// ====================================================================

namespace Core.Entities.UsersQC;

public class User
{
    public int UserId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public string PasswordHash { get; set; }
    public string PasswordSalt { get; set; }
    public DateTime CreatedAt { get; set; }  // Always UTC
    public DateTime? UpdatedAt { get; set; } // Always UTC
    public string Status { get; set; }
    public int? FailLoginCount { get; set; }
    public DateTime? LastLoginAttemptDate { get; set; }
}

// ====================================================================
// 3. INPUT DTO
// ====================================================================

public class UserCRegisterI
{
    public string Email { get; set; }
    public string Name { get; set; }
    public string Password { get; set; }
}

// ====================================================================
// 4. OUTPUT DTO
// ====================================================================

public class UserCRegisterO
{
    public int UserId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }  // UTC
}

// ====================================================================
// 5. MESSAGES (Multilanguage)
// ====================================================================

public static class UserCRegisterM
{
    private static readonly Dictionary<string, Dictionary<string, Messages>> _messages = new()
    {
        ["en"] = new Dictionary<string, Messages>
        {
            ["EmailRequired"] = new Messages
            {
                ApiMessage = "Email is required",
                UserMessage = "Please enter your email address"
            },
            ["EmailAlreadyExists"] = new Messages
            {
                ApiMessage = "Email already exists",
                UserMessage = "This email is already registered"
            },
            ["PasswordTooShort"] = new Messages
            {
                ApiMessage = "Password must be at least 8 characters",
                UserMessage = "Password must be at least 8 characters"
            }
        },
        ["es"] = new Dictionary<string, Messages>
        {
            ["EmailRequired"] = new Messages
            {
                ApiMessage = "El correo es requerido",
                UserMessage = "Por favor ingrese su correo electrónico"
            },
            ["EmailAlreadyExists"] = new Messages
            {
                ApiMessage = "El correo ya existe",
                UserMessage = "Este correo ya está registrado"
            },
            ["PasswordTooShort"] = new Messages
            {
                ApiMessage = "La contraseña debe tener al menos 8 caracteres",
                UserMessage = "La contraseña debe tener al menos 8 caracteres"
            }
        }
    };
    
    public static Messages Get(string language, string key)
    {
        if (!_messages.ContainsKey(language))
            language = "en";
            
        if (!_messages[language].ContainsKey(key))
            return new Messages();
            
        return _messages[language][key];
    }
}

// ====================================================================
// 6. COMMAND WITH HANDLER (Complete Example)
// ====================================================================

public class UserCRegister
{
    private readonly IUserRepository _repository;
    private readonly IEmailService _emailService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly string _language;
    
    public UserCRegister(
        IUserRepository repository,
        IEmailService emailService,
        IDateTimeProvider dateTimeProvider,
        string language = "en")
    {
        _repository = repository;
        _emailService = emailService;
        _dateTimeProvider = dateTimeProvider;
        _language = language;
    }
    
    public async Task<Result<UserCRegisterO>> Handler(UserCRegisterI input)
    {
        try
        {
            #region Clean
            input.Email = input.Email?.Clean().ToLower();
            input.Name = input.Name?.Clean();
            input.Password = input.Password?.Trim();
            #endregion
            
            #region Validation
            string prefix = "USER_REGISTER";
            
            if (string.IsNullOrWhiteSpace(input.Email))
            {
                return new Result<UserCRegisterO>(
                    ResultsStates.Invalid,
                    UserCRegisterM.Get(_language, "EmailRequired"),
                    $"{prefix}:EMAIL_REQUIRED"
                );
            }
            
            if (input.Password.Length < 8)
            {
                return new Result<UserCRegisterO>(
                    ResultsStates.Invalid,
                    UserCRegisterM.Get(_language, "PasswordTooShort"),
                    $"{prefix}:PASSWORD_TOO_SHORT"
                );
            }
            #endregion
            
            #region Business Rules
            var existingUser = await _repository.GetByEmailAsync(input.Email);
            if (existingUser != null)
            {
                return new Result<UserCRegisterO>(
                    ResultsStates.Unsuccess,
                    UserCRegisterM.Get(_language, "EmailAlreadyExists"),
                    $"{prefix}:EMAIL_EXISTS"
                );
            }
            #endregion
            
            #region Process
            var user = new User
            {
                Email = input.Email,
                Name = input.Name,
                PasswordHash = HashPassword(input.Password),
                CreatedAt = _dateTimeProvider.UtcNow,  // Always UTC
                Status = "active"
            };
            
            await _repository.CreateAsync(user);
            
            await _emailService.SendWelcomeEmailAsync(user.Email, user.Name);
            
            return new Result<UserCRegisterO>(
                ResultsStates.Success,
                new Messages(),
                $"{prefix}:SUCCESS"
            )
            {
                Data = new UserCRegisterO
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Name = user.Name,
                    CreatedAt = user.CreatedAt  // UTC
                }
            };
            #endregion
        }
        catch (Exception ex)
        {
            return new Result<UserCRegisterO>(
                ResultsStates.Error,
                new Messages(),
                "USER_REGISTER:SYSTEM_ERROR"
            );
        }
    }
    
    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}

// ====================================================================
// 7. QUERY EXAMPLE
// ====================================================================

public class UserQGetByIDI
{
    public int UserId { get; set; }
}

public class UserQGetByIDO
{
    public int UserId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }  // UTC
}

public class UserQGetByID
{
    private readonly IUserRepository _repository;
    
    public UserQGetByID(IUserRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<Result<UserQGetByIDO>> Handler(UserQGetByIDI input)
    {
        try
        {
            #region Process
            var user = await _repository.GetByIdAsync(input.UserId);
            
            if (user == null)
            {
                return new Result<UserQGetByIDO>(
                    ResultsStates.Empty,
                    new Messages()
                );
            }
            
            return new Result<UserQGetByIDO>(
                ResultsStates.Success,
                new Messages()
            )
            {
                Data = new UserQGetByIDO
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Name = user.Name,
                    CreatedAt = user.CreatedAt  // UTC
                }
            };
            #endregion
        }
        catch (Exception ex)
        {
            return new Result<UserQGetByIDO>(
                ResultsStates.Error,
                new Messages()
            );
        }
    }
}

// ====================================================================
// 8. INTERFACES (Core/Interfaces)
// ====================================================================

namespace Core.Interfaces;

public interface IUserRepository
{
    Task<User> GetByIdAsync(int id);
    Task<User> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<IEnumerable<User>> GetAllAsync();
    Task CreateAsync(User user);
    Task UpdateAsync(User user);
    Task DeleteAsync(int id);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendWelcomeEmailAsync(string email, string name);
}

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}

public interface ICacheService
{
    Task<T> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
}

// ====================================================================
// 9. INFRASTRUCTURE IMPLEMENTATIONS
// ====================================================================

namespace Infrastructure.Database;

public class UserRepository : IUserRepository
{
    private readonly DbContext _context;
    
    public UserRepository(DbContext context)
    {
        _context = context;
    }
    
    public async Task<User> GetByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }
    
    public async Task<User> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }
    
    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email == email);
    }
    
    public async Task CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }
}

namespace Infrastructure.Services;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}

public class SendGridEmailService : IEmailService
{
    private readonly SendGridClient _client;
    
    public SendGridEmailService(IConfiguration config)
    {
        var apiKey = config["SendGrid:ApiKey"];
        _client = new SendGridClient(apiKey);
    }
    
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var msg = new SendGridMessage
        {
            From = new EmailAddress("noreply@example.com"),
            Subject = subject,
            HtmlContent = body
        };
        msg.AddTo(new EmailAddress(to));
        
        await _client.SendEmailAsync(msg);
    }
    
    public async Task SendWelcomeEmailAsync(string email, string name)
    {
        var subject = "Welcome!";
        var body = $"<h1>Welcome {name}!</h1>";
        await SendEmailAsync(email, subject, body);
    }
}

// ====================================================================
// 10. CACHED REPOSITORY (Decorator Pattern)
// ====================================================================

public class CachedUserRepository : IUserRepository
{
    private readonly IUserRepository _innerRepository;
    private readonly ICacheService _cache;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);
    
    public CachedUserRepository(
        IUserRepository innerRepository,
        ICacheService cache)
    {
        _innerRepository = innerRepository;
        _cache = cache;
    }
    
    public async Task<User> GetByIdAsync(int id)
    {
        var cacheKey = $"user:{id}";
        
        var cached = await _cache.GetAsync<User>(cacheKey);
        if (cached != null)
            return cached;
        
        var user = await _innerRepository.GetByIdAsync(id);
        
        if (user != null)
            await _cache.SetAsync(cacheKey, user, _cacheDuration);
        
        return user;
    }
    
    public async Task CreateAsync(User user)
    {
        await _innerRepository.CreateAsync(user);
        await _cache.RemoveAsync($"user:{user.UserId}");
    }
}

// ====================================================================
// 11. CLEAN HELPERS
// ====================================================================

namespace Helpers;

public static class StringExtensions
{
    public static string Clean(this string str)
    {
        str = str ?? "";
        str = str.Replace("\r", "")
                 .Replace("\n", "")
                 .Replace("\t", "")
                 .Replace("\b", "")
                 .Replace("\a", "")
                 .Replace("\f", "")
                 .Replace("\v", "")
                 .Trim();
        return str;
    }
    
    public static string CleanPhone(this string str)
    {
        var cleanedValue = (str ?? "")
            .CleanNumber()
            .Replace("(", "")
            .Replace(")", "")
            .Replace(" ", "")
            .Replace("-", "");
        return cleanedValue;
    }
    
    public static string CleanNumber(this string str)
    {
        str = (str ?? "")
            .Clean()
            .Replace(",", "")
            .Replace("$", "");
        return str;
    }
}

// ====================================================================
// 12. REST CONTROLLER (Presentation Layer)
// ====================================================================

namespace API.REST.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserCRegister _registerCommand;
    private readonly UserQGetByID _getByIdQuery;
    
    public UsersController(
        UserCRegister registerCommand,
        UserQGetByID getByIdQuery)
    {
        _registerCommand = registerCommand;
        _getByIdQuery = getByIdQuery;
    }
    
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Register(
        [FromBody] UserCRegisterI request,
        [FromHeader(Name = "User-Timezone")] string userTimezone = "UTC")
    {
        var result = await _registerCommand.Handler(request);
        
        if (result.State == ResultsStates.Success)
        {
            // Convert UTC to user timezone
            var response = new
            {
                UserId = result.Data.UserId,
                Email = result.Data.Email,
                Name = result.Data.Name,
                CreatedAt = ConvertToUserTimezone(result.Data.CreatedAt, userTimezone)
            };
            
            return CreatedAtAction(nameof(GetById), 
                new { id = result.Data.UserId }, response);
        }
        else if (result.State == ResultsStates.Invalid)
        {
            return BadRequest(new
            {
                state = result.State,
                code = result.Code,
                message = result.Message.UserMessage
            });
        }
        else
        {
            return StatusCode(400, new
            {
                state = result.State,
                code = result.Code,
                message = result.Message.UserMessage
            });
        }
    }
    
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(
        int id,
        [FromHeader(Name = "User-Timezone")] string userTimezone = "UTC")
    {
        var result = await _getByIdQuery.Handler(new UserQGetByIDI { UserId = id });
        
        if (result.State == ResultsStates.Success)
        {
            var response = new
            {
                UserId = result.Data.UserId,
                Email = result.Data.Email,
                Name = result.Data.Name,
                CreatedAt = ConvertToUserTimezone(result.Data.CreatedAt, userTimezone)
            };
            
            return Ok(response);
        }
        else if (result.State == ResultsStates.Empty)
        {
            return NotFound();
        }
        else
        {
            return StatusCode(500);
        }
    }
    
    private DateTime ConvertToUserTimezone(DateTime utcDate, string timezone)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        return TimeZoneInfo.ConvertTimeFromUtc(utcDate, tz);
    }
}

// ====================================================================
// 13. DEPENDENCY INJECTION SETUP
// ====================================================================

// ====================================================================
// 14. SNOWFLAKE ID GENERATOR (Strongly Recommended)
// ====================================================================

namespace Infrastructure.IdGeneration;

// Using IdGen library: Install-Package IdGen
using IdGen;

public interface ISnowflakeIdGenerator
{
    long GenerateId();
}

public class SnowflakeIdGenerator : ISnowflakeIdGenerator
{
    private readonly IdGenerator _generator;
    
    public SnowflakeIdGenerator(int nodeId)
    {
        // Custom epoch: 2024-01-01 00:00:00 UTC
        var epoch = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        
        // Configure generator
        var structure = new IdStructure(41, 10, 12);  // timestamp, nodeId, sequence bits
        var options = new IdGeneratorOptions(structure, new DefaultTimeSource(epoch));
        
        _generator = new IdGenerator(nodeId, options);
    }
    
    public long GenerateId()
    {
        return _generator.CreateId();
    }
}

// Alternative: Custom implementation without external library
public class CustomSnowflakeIdGenerator : ISnowflakeIdGenerator
{
    private const long EPOCH = 1704067200000L; // 2024-01-01 00:00:00 UTC in milliseconds
    private readonly int _nodeId;
    private long _sequence = 0L;
    private long _lastTimestamp = -1L;
    private readonly object _lock = new object();
    
    public CustomSnowflakeIdGenerator(int nodeId)
    {
        if (nodeId < 0 || nodeId > 1023)
            throw new ArgumentException("Node ID must be between 0 and 1023");
            
        _nodeId = nodeId;
    }
    
    public long GenerateId()
    {
        lock (_lock)
        {
            var timestamp = GetCurrentTimestamp();
            
            if (timestamp < _lastTimestamp)
                throw new InvalidOperationException("Clock moved backwards");
            
            if (timestamp == _lastTimestamp)
            {
                _sequence = (_sequence + 1) & 4095; // 12 bits mask
                if (_sequence == 0)
                {
                    // Wait for next millisecond
                    timestamp = WaitNextMillis(_lastTimestamp);
                }
            }
            else
            {
                _sequence = 0;
            }
            
            _lastTimestamp = timestamp;
            
            // Combine: timestamp (41 bits) + nodeId (10 bits) + sequence (12 bits)
            return ((timestamp - EPOCH) << 22) | ((long)_nodeId << 12) | _sequence;
        }
    }
    
    private long GetCurrentTimestamp()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }
    
    private long WaitNextMillis(long lastTimestamp)
    {
        var timestamp = GetCurrentTimestamp();
        while (timestamp <= lastTimestamp)
        {
            timestamp = GetCurrentTimestamp();
        }
        return timestamp;
    }
}

// Helper to parse Snowflake IDs
public class SnowflakeIdParser
{
    private const long EPOCH = 1704067200000L;
    
    public static SnowflakeInfo Parse(long id)
    {
        var timestamp = (id >> 22) + EPOCH;
        var nodeId = (int)((id >> 12) & 0x3FF);
        var sequence = (int)(id & 0xFFF);
        
        return new SnowflakeInfo
        {
            Id = id,
            Timestamp = timestamp,
            NodeId = nodeId,
            Sequence = sequence,
            GeneratedAt = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).UtcDateTime
        };
    }
}

public class SnowflakeInfo
{
    public long Id { get; set; }
    public long Timestamp { get; set; }
    public int NodeId { get; set; }
    public int Sequence { get; set; }
    public DateTime GeneratedAt { get; set; }
}

// ====================================================================
// 15. ENTITY WITH SNOWFLAKE ID
// ====================================================================

namespace Core.Entities.UsersQC;

public class User
{
    public long UserId { get; set; }  // Snowflake ID, not auto-increment
    public string Email { get; set; }
    public string Name { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }  // Always UTC
    public DateTime? UpdatedAt { get; set; }
    public string Status { get; set; }
}

// ====================================================================
// 16. COMMAND USING SNOWFLAKE ID
// ====================================================================

public class UserCRegisterWithSnowflake
{
    private readonly ISnowflakeIdGenerator _idGenerator;
    private readonly IUserRepository _repository;
    private readonly IEmailService _emailService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly string _language;
    
    public UserCRegisterWithSnowflake(
        ISnowflakeIdGenerator idGenerator,
        IUserRepository repository,
        IEmailService emailService,
        IDateTimeProvider dateTimeProvider,
        string language = "en")
    {
        _idGenerator = idGenerator;
        _repository = repository;
        _emailService = emailService;
        _dateTimeProvider = dateTimeProvider;
        _language = language;
    }
    
    public async Task<Result<UserCRegisterO>> Handler(UserCRegisterI input)
    {
        try
        {
            #region Clean
            input.Email = input.Email?.Clean().ToLower();
            input.Name = input.Name?.Clean();
            #endregion
            
            #region Validation
            // ... validations
            #endregion
            
            #region Business Rules
            var existingUser = await _repository.GetByEmailAsync(input.Email);
            if (existingUser != null)
            {
                return new Result<UserCRegisterO>(
                    ResultsStates.Unsuccess,
                    UserCRegisterM.Get(_language, "EmailAlreadyExists"),
                    "USER_REGISTER:EMAIL_EXISTS"
                );
            }
            #endregion
            
            #region Process
            // Generate Snowflake ID BEFORE creating entity
            var userId = _idGenerator.GenerateId();
            
            var user = new User
            {
                UserId = userId,  // Pre-generated Snowflake ID
                Email = input.Email,
                Name = input.Name,
                PasswordHash = HashPassword(input.Password),
                CreatedAt = _dateTimeProvider.UtcNow,
                Status = "active"
            };
            
            await _repository.CreateAsync(user);
            await _emailService.SendWelcomeEmailAsync(user.Email, user.Name);
            
            return new Result<UserCRegisterO>(
                ResultsStates.Success,
                new Messages(),
                "USER_REGISTER:SUCCESS"
            )
            {
                Data = new UserCRegisterO
                {
                    UserId = user.UserId,  // Return Snowflake ID
                    Email = user.Email,
                    Name = user.Name,
                    CreatedAt = user.CreatedAt
                }
            };
            #endregion
        }
        catch (Exception ex)
        {
            return new Result<UserCRegisterO>(
                ResultsStates.Error,
                new Messages(),
                "USER_REGISTER:SYSTEM_ERROR"
            );
        }
    }
    
    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}

// ====================================================================
// 17. DEPENDENCY INJECTION WITH SNOWFLAKE
// ====================================================================

// Program.cs or Startup.cs
public class ProgramWithSnowflake
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        
        // Configure Snowflake ID Generator
        // Get nodeId from configuration (different per server)
        var nodeId = builder.Configuration.GetValue<int>("NodeId", 0);
        builder.Services.AddSingleton<ISnowflakeIdGenerator>(
            new SnowflakeIdGenerator(nodeId)
        );
        
        // Or using custom implementation
        // builder.Services.AddSingleton<ISnowflakeIdGenerator>(
        //     new CustomSnowflakeIdGenerator(nodeId)
        // );
        
        // Database
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
        
        // Other services...
        builder.Services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        builder.Services.AddScoped<IEmailService, SendGridEmailService>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        
        // Commands and Queries with Snowflake
        builder.Services.AddScoped<UserCRegisterWithSnowflake>();
        
        var app = builder.Build();
        app.MapControllers();
        app.Run();
    }
}

// appsettings.json
/*
{
  "NodeId": 0,  // Server 1
  "ConnectionStrings": {
    "Default": "..."
  }
}

// appsettings.Production.json (Server 2)
{
  "NodeId": 1  // Different nodeId per server
}
*/