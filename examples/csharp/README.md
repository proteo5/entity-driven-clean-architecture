# C# Implementation Examples

## Prerequisites
- .NET 6.0 or higher
- Visual Studio 2022 or VS Code

## Libraries Used
- BCrypt.Net-Next (password hashing)
- IdGen or custom Snowflake generator
- Microsoft.Extensions.DependencyInjection

## Getting Started

1. Install packages:
```bash
dotnet add package BCrypt.Net-Next
dotnet add package IdGen
```

2. Review `EntityDrivenArchitecture.cs` for complete examples

3. Copy patterns to your project

## Key Files
- Result Envelope classes
- UserCCreate (Command example)
- UserQGetByID (Query example)
- SnowflakeIdGenerator
- Dependency Injection setup

See main README.md for architecture documentation.
