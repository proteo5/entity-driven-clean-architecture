// ====================================================================
// ENTITY-DRIVEN CLEAN ARCHITECTURE - TYPESCRIPT EXAMPLES
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
// ENTITY-DRIVEN CLEAN ARCHITECTURE - TYPESCRIPT IMPLEMENTATION EXAMPLES
// Updated: Namespace structure with DataIn/DataOut/Messages
// ====================================================================

// ====================================================================
// 1. RESULT ENVELOPE PATTERN
// ====================================================================

export interface InvalidPropertyInfo {
    propertyName: string;
    userMessage: string;
    validationMessage: string;
    validationCode: string;
}

export interface Messages {
    apiMessage: string;
    userMessage: string;
}

export class ResultStates {
    static readonly SUCCESS = 'success';
    static readonly UNSUCCESS = 'unsuccess';
    static readonly EMPTY = 'empty';
    static readonly INVALID = 'invalid';
    static readonly ERROR = 'error';
}

export class Result<T> {
    state: string;
    code: string;
    message: Messages;
    data?: T;
    invalidFields?: InvalidPropertyInfo[];
    
    constructor(
        state: string = ResultStates.SUCCESS,
        message: Messages = { apiMessage: '', userMessage: '' },
        code: string = ''
    ) {
        this.state = state;
        this.message = message;
        this.code = code;
    }
}

// ====================================================================
// 2. ENTITY (Persistence Model) - Shared
// ====================================================================

/**
 * User entity - Persistence model shared across all User operations
 */
export interface User {
    userId: bigint;  // Snowflake ID
    email: string;
    name: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: Date;  // Always UTC
    updatedAt?: Date;
    status: string;
    failLoginCount?: number;
    lastLoginAttemptDate?: Date;
}

// ====================================================================
// 3. COMMAND WITH NESTED STRUCTURE (Complete Example - Using Namespace)
// ====================================================================

import * as bcrypt from 'bcrypt';
import { clean } from './helpers/stringExtensions';

/**
 * UserCCreate - Command to create a new user
 * Uses namespace to organize related types
 */
export namespace UserCCreate {
    /**
     * DataIn - Explicit: Data coming INTO the Handler
     */
    export interface DataIn {
        email: string;
        name: string;
        password: string;
    }
    
    /**
     * DataOut - Explicit: Data going OUT of the Handler
     */
    export interface DataOut {
        userId: bigint;
        email: string;
        name: string;
        createdAt: Date;  // UTC
    }
    
    /**
     * Messages - Multilanguage messages for this operation
     */
    export class Messages {
        private static readonly _messages: Record<string, Record<string, Messages>> = {
            en: {
                emailRequired: {
                    apiMessage: 'Email is required',
                    userMessage: 'Please enter your email address'
                },
                emailExists: {
                    apiMessage: 'Email already exists',
                    userMessage: 'This email is already registered'
                },
                passwordTooShort: {
                    apiMessage: 'Password must be at least 8 characters',
                    userMessage: 'Password must be at least 8 characters'
                }
            },
            es: {
                emailRequired: {
                    apiMessage: 'El correo es requerido',
                    userMessage: 'Por favor ingrese su correo electrónico'
                },
                emailExists: {
                    apiMessage: 'El correo ya existe',
                    userMessage: 'Este correo ya está registrado'
                },
                passwordTooShort: {
                    apiMessage: 'La contraseña debe tener al menos 8 caracteres',
                    userMessage: 'La contraseña debe tener al menos 8 caracteres'
                }
            }
        };
        
        static get(language: string, key: string): Messages {
            if (!this._messages[language]) {
                language = 'en';
            }
            return this._messages[language][key] || { apiMessage: '', userMessage: '' };
        }
    }
}

/**
 * UserCCreate implementation class
 */
export class UserCCreate {
    private language: string;
    
    constructor(
        private readonly idGenerator: ISnowflakeIdGenerator,
        private readonly repository: IUserRepository,
        private readonly emailService: IEmailService,
        private readonly dateTimeProvider: IDateTimeProvider,
        language: string = 'en'
    ) {
        this.language = language;
    }
    
    /**
     * Handler - Main entry point for UserCCreate command
     */
    async handler(input: UserCCreate.DataIn): Promise<Result<UserCCreate.DataOut>> {
        try {
            // #region Clean
            input.email = clean(input.email)?.toLowerCase() || '';
            input.name = clean(input.name) || '';
            input.password = input.password?.trim() || '';
            // #endregion
            
            // #region Validation
            const prefix = 'USER_CREATE';
            
            if (!input.email) {
                return new Result<UserCCreate.DataOut>(
                    ResultStates.INVALID,
                    UserCCreate.Messages.get(this.language, 'emailRequired'),
                    `${prefix}:EMAIL_REQUIRED`
                );
            }
            
            if (input.password.length < 8) {
                return new Result<UserCCreate.DataOut>(
                    ResultStates.INVALID,
                    UserCCreate.Messages.get(this.language, 'passwordTooShort'),
                    `${prefix}:PASSWORD_TOO_SHORT`
                );
            }
            // #endregion
            
            // #region Business Rules
            const existingUser = await this.repository.getByEmail(input.email);
            if (existingUser) {
                return new Result<UserCCreate.DataOut>(
                    ResultStates.UNSUCCESS,
                    UserCCreate.Messages.get(this.language, 'emailExists'),
                    `${prefix}:EMAIL_EXISTS`
                );
            }
            // #endregion
            
            // #region Process
            // Generate Snowflake ID
            const userId = this.idGenerator.generateId();
            
            const user: User = {
                userId: userId,
                email: input.email,
                name: input.name,
                passwordHash: await this.hashPassword(input.password),
                passwordSalt: '',
                createdAt: this.dateTimeProvider.utcNow(),  // Always UTC
                status: 'active'
            };
            
            await this.repository.create(user);
            await this.emailService.sendWelcomeEmail(user.email, user.name);
            
            const result = new Result<UserCCreate.DataOut>(
                ResultStates.SUCCESS,
                { apiMessage: '', userMessage: '' },
                `${prefix}:SUCCESS`
            );
            result.data = this.mapToDataOut(user);
            return result;
            // #endregion
            
        } catch (error) {
            return new Result<UserCCreate.DataOut>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' },
                'USER_CREATE:SYSTEM_ERROR'
            );
        }
    }
    
    // #region Private Mappers
    
    private mapToDataOut(user: User): UserCCreate.DataOut {
        return {
            userId: user.userId,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };
    }
    
    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }
    
    // #endregion
}

// ====================================================================
// 4. QUERY WITH NESTED STRUCTURE (Example - Using Namespace)
// ====================================================================

/**
 * UserQGetByID - Query to get user by ID
 * Uses namespace to organize related types
 */
export namespace UserQGetByID {
    /**
     * DataIn - Explicit: Data coming INTO the Handler
     */
    export interface DataIn {
        userId: bigint;
    }
    
    /**
     * DataOut - Explicit: Data going OUT of the Handler
     */
    export interface DataOut {
        userId: bigint;
        email: string;
        name: string;
        createdAt: Date;  // UTC
    }
    
    /**
     * Messages - Multilanguage messages for this operation
     */
    export class Messages {
        private static readonly _messages: Record<string, Record<string, Messages>> = {
            en: {
                userNotFound: {
                    apiMessage: 'User not found',
                    userMessage: 'The requested user was not found'
                }
            },
            es: {
                userNotFound: {
                    apiMessage: 'Usuario no encontrado',
                    userMessage: 'El usuario solicitado no fue encontrado'
                }
            }
        };
        
        static get(language: string, key: string): Messages {
            if (!this._messages[language]) {
                language = 'en';
            }
            return this._messages[language][key] || { apiMessage: '', userMessage: '' };
        }
    }
}

/**
 * UserQGetByID implementation class
 */
export class UserQGetByID {
    private language: string;
    
    constructor(
        private readonly repository: IUserRepository,
        language: string = 'en'
    ) {
        this.language = language;
    }
    
    /**
     * Handler - Main entry point for UserQGetByID query
     */
    async handler(input: UserQGetByID.DataIn): Promise<Result<UserQGetByID.DataOut>> {
        try {
            // #region Process
            const user = await this.repository.getById(input.userId);
            
            if (!user) {
                return new Result<UserQGetByID.DataOut>(
                    ResultStates.EMPTY,
                    { apiMessage: '', userMessage: '' }
                );
            }
            
            const result = new Result<UserQGetByID.DataOut>(
                ResultStates.SUCCESS,
                { apiMessage: '', userMessage: '' }
            );
            result.data = this.mapToDataOut(user);
            return result;
            // #endregion
            
        } catch (error) {
            return new Result<UserQGetByID.DataOut>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' }
            );
        }
    }
    
    // #region Private Mappers
    
    private mapToDataOut(user: User): UserQGetByID.DataOut {
        return {
            userId: user.userId,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };
    }
    
    // #endregion
}

// ====================================================================
// 5. QUERY WITHOUT INPUT (GetAll Example)
// ====================================================================

export namespace UserQGetAll {
    // No DataIn needed for GetAll
    
    export interface DataOut {
        userId: bigint;
        email: string;
        name: string;
        createdAt: Date;
    }
    
    export class Messages {
        // Messages if needed
    }
}

export class UserQGetAll {
    constructor(private readonly repository: IUserRepository) {}
    
    async handler(): Promise<Result<UserQGetAll.DataOut[]>> {
        try {
            // #region Process
            const users = await this.repository.getAll();
            const output = users.map(u => this.mapToDataOut(u));
            
            if (output.length > 0) {
                const result = new Result<UserQGetAll.DataOut[]>(
                    ResultStates.SUCCESS,
                    { apiMessage: '', userMessage: '' }
                );
                result.data = output;
                return result;
            } else {
                return new Result<UserQGetAll.DataOut[]>(
                    ResultStates.EMPTY,
                    { apiMessage: '', userMessage: '' }
                );
            }
            // #endregion
            
        } catch (error) {
            return new Result<UserQGetAll.DataOut[]>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' }
            );
        }
    }
    
    private mapToDataOut(user: User): UserQGetAll.DataOut {
        return {
            userId: user.userId,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };
    }
}

// ====================================================================
// 6. INTERFACES (Core/Interfaces)
// ====================================================================

export interface IUserRepository {
    getById(id: bigint): Promise<User | null>;
    getByEmail(email: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    getAll(): Promise<User[]>;
    create(user: User): Promise<void>;
}

export interface IEmailService {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
}

export interface IDateTimeProvider {
    utcNow(): Date;
}

export interface ISnowflakeIdGenerator {
    generateId(): bigint;
}

// ====================================================================
// 7. INFRASTRUCTURE IMPLEMENTATIONS
// ====================================================================

import { Repository } from 'typeorm';

export class UserRepository implements IUserRepository {
    constructor(private repository: Repository<User>) {}
    
    async getById(id: bigint): Promise<User | null> {
        return await this.repository.findOne({ where: { userId: id } });
    }
    
    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.repository.count({ where: { email } });
        return count > 0;
    }
    
    async create(user: User): Promise<void> {
        await this.repository.save(user);
    }
    
    async getAll(): Promise<User[]> {
        return await this.repository.find();
    }
}

export class DateTimeProvider implements IDateTimeProvider {
    utcNow(): Date {
        return new Date();
    }
}

// ====================================================================
// 8. USAGE IN CONTROLLER (Express)
// ====================================================================

import { Router, Request, Response } from 'express';

export class UsersController {
    router: Router;
    
    constructor(
        private createCommand: UserCCreate,
        private getByIdQuery: UserQGetByID
    ) {
        this.router = Router();
        this.setupRoutes();
    }
    
    private setupRoutes() {
        this.router.post('/api/users', this.create.bind(this));
        this.router.get('/api/users/:id', this.getById.bind(this));
    }
    
    async create(req: Request, res: Response) {
        // ← Explicit namespace type
        const input: UserCCreate.DataIn = req.body;
        const result = await this.createCommand.handler(input);
        
        if (result.state === ResultStates.SUCCESS) {
            res.status(201).json({
                userId: result.data!.userId.toString(),  // Convert bigint to string
                email: result.data!.email,
                name: result.data!.name,
                createdAt: result.data!.createdAt
            });
        } else if (result.state === ResultStates.INVALID) {
            res.status(400).json({
                state: result.state,
                code: result.code,
                message: result.message.userMessage
            });
        } else {
            res.status(400).json({
                state: result.state,
                code: result.code,
                message: result.message.userMessage
            });
        }
    }
    
    async getById(req: Request, res: Response) {
        const userId = BigInt(req.params.id);
        // ← Explicit namespace type
        const input: UserQGetByID.DataIn = { userId };
        
        const result = await this.getByIdQuery.handler(input);
        
        if (result.state === ResultStates.SUCCESS) {
            res.json({
                userId: result.data!.userId.toString(),
                email: result.data!.email,
                name: result.data!.name,
                createdAt: result.data!.createdAt
            });
        } else if (result.state === ResultStates.EMPTY) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

// ====================================================================
// 9. CLEAN HELPERS
// ====================================================================

export function clean(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/\r/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .trim();
}

// ====================================================================
// 10. SNOWFLAKE ID GENERATOR
// ====================================================================

export class SnowflakeIdGenerator implements ISnowflakeIdGenerator {
    private static readonly EPOCH = 1704067200000n;
    
    private nodeId: number;
    private sequence: bigint = 0n;
    private lastTimestamp: bigint = -1n;
    
    constructor(nodeId: number) {
        if (nodeId < 0 || nodeId > 1023) {
            throw new Error('Node ID must be between 0 and 1023');
        }
        this.nodeId = nodeId;
    }
    
    generateId(): bigint {
        let timestamp = this.currentTimestamp();
        
        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards');
        }
        
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & 4095n;
            if (this.sequence === 0n) {
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.currentTimestamp();
                }
            }
        } else {
            this.sequence = 0n;
        }
        
        this.lastTimestamp = timestamp;
        
        return ((timestamp - SnowflakeIdGenerator.EPOCH) << 22n) | 
               (BigInt(this.nodeId) << 12n) | 
               this.sequence;
    }
    
    private currentTimestamp(): bigint {
        return BigInt(Date.now());
    }
}

// ====================================================================
// 11. DEPENDENCY INJECTION SETUP (InversifyJS)
// ====================================================================

import { Container } from 'inversify';

const TYPES = {
    SnowflakeIdGenerator: Symbol.for('SnowflakeIdGenerator'),
    UserRepository: Symbol.for('UserRepository'),
    EmailService: Symbol.for('EmailService'),
    DateTimeProvider: Symbol.for('DateTimeProvider'),
    UserCCreate: Symbol.for('UserCCreate'),
    UserQGetByID: Symbol.for('UserQGetByID')
};

const container = new Container();

// Get nodeId from environment
const nodeId = parseInt(process.env.NODE_ID || '0', 10);

// Snowflake ID Generator
container.bind<ISnowflakeIdGenerator>(TYPES.SnowflakeIdGenerator)
    .toConstantValue(new SnowflakeIdGenerator(nodeId));

// Infrastructure
container.bind<IDateTimeProvider>(TYPES.DateTimeProvider)
    .to(DateTimeProvider)
    .inSingletonScope();

container.bind<IUserRepository>(TYPES.UserRepository)
    .to(UserRepository)
    .inRequestScope();

// Commands and Queries
container.bind<UserCCreate>(TYPES.UserCCreate)
    .toDynamicValue((context) => {
        return new UserCCreate(
            context.container.get<ISnowflakeIdGenerator>(TYPES.SnowflakeIdGenerator),
            context.container.get<IUserRepository>(TYPES.UserRepository),
            context.container.get<IEmailService>(TYPES.EmailService),
            context.container.get<IDateTimeProvider>(TYPES.DateTimeProvider),
            'en'
        );
    })
    .inRequestScope();

container.bind<UserQGetByID>(TYPES.UserQGetByID)
    .toDynamicValue((context) => {
        return new UserQGetByID(
            context.container.get<IUserRepository>(TYPES.UserRepository),
            'en'
        );
    })
    .inRequestScope();

export { container, TYPES };

// ====================================================================
// 12. EXPRESS APP SETUP
// ====================================================================

import express from 'express';
import { createConnection } from 'typeorm';

const app = express();

app.use(express.json());

// Custom JSON serializer for bigint
app.set('json replacer', (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
});

// Initialize database connection
createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'mydb',
    entities: [User],
    synchronize: true
}).then(() => {
    console.log('Database connected');
    console.log(`Node ID: ${nodeId}`);
    
    // Setup controllers
    const createCommand = container.get<UserCCreate>(TYPES.UserCCreate);
    const getByIdQuery = container.get<UserQGetByID>(TYPES.UserQGetByID);
    const usersController = new UsersController(createCommand, getByIdQuery);
    
    app.use(usersController.router);
    
    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}).catch(error => console.log('Database connection error:', error));// ====================================================================
// 15. SNOWFLAKE ID GENERATOR (Strongly Recommended)
// ====================================================================

export interface ISnowflakeIdGenerator {
    generateId(): bigint;
}

export interface SnowflakeInfo {
    id: bigint;
    timestamp: bigint;
    nodeId: number;
    sequence: number;
    generatedAt: Date;
}

export class SnowflakeIdGenerator implements ISnowflakeIdGenerator {
    private static readonly EPOCH = 1704067200000n; // 2024-01-01 00:00:00 UTC
    
    private nodeId: number;
    private sequence: bigint = 0n;
    private lastTimestamp: bigint = -1n;
    
    constructor(nodeId: number) {
        if (nodeId < 0 || nodeId > 1023) {
            throw new Error('Node ID must be between 0 and 1023');
        }
        this.nodeId = nodeId;
    }
    
    generateId(): bigint {
        let timestamp = this.currentTimestamp();
        
        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards');
        }
        
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & 4095n; // 12 bits mask
            if (this.sequence === 0n) {
                // Wait for next millisecond
                timestamp = this.waitNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0n;
        }
        
        this.lastTimestamp = timestamp;
        
        // Combine: timestamp (41 bits) + nodeId (10 bits) + sequence (12 bits)
        return ((timestamp - SnowflakeIdGenerator.EPOCH) << 22n) | 
               (BigInt(this.nodeId) << 12n) | 
               this.sequence;
    }
    
    private currentTimestamp(): bigint {
        return BigInt(Date.now());
    }
    
    private waitNextMillis(lastTimestamp: bigint): bigint {
        let timestamp = this.currentTimestamp();
        while (timestamp <= lastTimestamp) {
            timestamp = this.currentTimestamp();
        }
        return timestamp;
    }
    
    static parse(snowflakeId: bigint): SnowflakeInfo {
        const timestamp = (snowflakeId >> 22n) + SnowflakeIdGenerator.EPOCH;
        const nodeId = Number((snowflakeId >> 12n) & 0x3FFn);
        const sequence = Number(snowflakeId & 0xFFFn);
        
        return {
            id: snowflakeId,
            timestamp,
            nodeId,
            sequence,
            generatedAt: new Date(Number(timestamp))
        };
    }
}

// Alternative: Using flake-idgen library
// npm install flake-idgen

// import FlakeId from 'flake-idgen';
// 
// export class FlakeSnowflakeIdGenerator implements ISnowflakeIdGenerator {
//     private generator: FlakeId;
//     
//     constructor(nodeId: number) {
//         this.generator = new FlakeId({
//             datacenter: nodeId >> 5,  // 5 bits
//             worker: nodeId & 0x1F,    // 5 bits
//             epoch: 1704067200000      // Custom epoch
//         });
//     }
//     
//     generateId(): bigint {
//         const buffer = this.generator.next();
//         return buffer.readBigInt64BE(0);
//     }
// }

// ====================================================================
// 16. ENTITY WITH SNOWFLAKE ID
// ====================================================================

export interface User {
    userId: bigint;  // Snowflake ID, not auto-increment
    email: string;
    name: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: Date;  // Always UTC
    updatedAt?: Date;
    status: string;
}

// ====================================================================
// 17. COMMAND USING SNOWFLAKE ID
// ====================================================================

export class UserCRegisterWithSnowflake {
    private language: string;
    
    constructor(
        private readonly idGenerator: ISnowflakeIdGenerator,
        private readonly repository: IUserRepository,
        private readonly emailService: IEmailService,
        private readonly dateTimeProvider: IDateTimeProvider,
        language: string = 'en'
    ) {
        this.language = language;
    }
    
    async handler(input: UserCRegisterI): Promise<Result<UserCRegisterO>> {
        try {
            // #region Clean
            input.email = clean(input.email)?.toLowerCase() || '';
            input.name = clean(input.name) || '';
            // #endregion
            
            // #region Validation
            const prefix = 'USER_REGISTER';
            
            if (!input.email) {
                return new Result<UserCRegisterO>(
                    ResultStates.INVALID,
                    UserCRegisterM.get(this.language, 'emailRequired'),
                    `${prefix}:EMAIL_REQUIRED`
                );
            }
            // #endregion
            
            // #region Business Rules
            const existingUser = await this.repository.getByEmail(input.email);
            if (existingUser) {
                return new Result<UserCRegisterO>(
                    ResultStates.UNSUCCESS,
                    UserCRegisterM.get(this.language, 'emailAlreadyExists'),
                    `${prefix}:EMAIL_EXISTS`
                );
            }
            // #endregion
            
            // #region Process
            // Generate Snowflake ID BEFORE creating entity
            const userId = this.idGenerator.generateId();
            
            const user: User = {
                userId: userId,  // Pre-generated Snowflake ID
                email: input.email,
                name: input.name,
                passwordHash: await this.hashPassword(input.password),
                passwordSalt: '',
                createdAt: this.dateTimeProvider.utcNow(),
                status: 'active'
            };
            
            await this.repository.create(user);
            await this.emailService.sendWelcomeEmail(user.email, user.name);
            
            const result = new Result<UserCRegisterO>(
                ResultStates.SUCCESS,
                { apiMessage: '', userMessage: '' },
                `${prefix}:SUCCESS`
            );
            result.data = {
                userId: user.userId,  // Return Snowflake ID
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            };
            return result;
            // #endregion
            
        } catch (error) {
            return new Result<UserCRegisterO>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' },
                'USER_REGISTER:SYSTEM_ERROR'
            );
        }
    }
    
    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }
}

// ====================================================================
// 18. DEPENDENCY INJECTION WITH SNOWFLAKE
// ====================================================================

import { Container } from 'inversify';
import 'reflect-metadata';

const TYPES = {
    SnowflakeIdGenerator: Symbol.for('SnowflakeIdGenerator'),
    UserRepository: Symbol.for('UserRepository'),
    EmailService: Symbol.for('EmailService'),
    DateTimeProvider: Symbol.for('DateTimeProvider'),
    UserCRegisterWithSnowflake: Symbol.for('UserCRegisterWithSnowflake')
};

const container = new Container();

// Get nodeId from environment variable (different per server)
const nodeId = parseInt(process.env.NODE_ID || '0', 10);

// Snowflake ID Generator - Singleton
container.bind<ISnowflakeIdGenerator>(TYPES.SnowflakeIdGenerator)
    .toConstantValue(new SnowflakeIdGenerator(nodeId));

// Infrastructure services
container.bind<IDateTimeProvider>(TYPES.DateTimeProvider)
    .to(DateTimeProvider)
    .inSingletonScope();

container.bind<IEmailService>(TYPES.EmailService)
    .to(EmailService)
    .inSingletonScope();

container.bind<IUserRepository>(TYPES.UserRepository)
    .to(UserRepository)
    .inRequestScope();

// Commands with Snowflake
container.bind<UserCRegisterWithSnowflake>(TYPES.UserCRegisterWithSnowflake)
    .toDynamicValue((context) => {
        return new UserCRegisterWithSnowflake(
            context.container.get<ISnowflakeIdGenerator>(TYPES.SnowflakeIdGenerator),
            context.container.get<IUserRepository>(TYPES.UserRepository),
            context.container.get<IEmailService>(TYPES.EmailService),
            context.container.get<IDateTimeProvider>(TYPES.DateTimeProvider),
            'en'
        );
    })
    .inRequestScope();

export { container, TYPES };

// ====================================================================
// 19. EXPRESS CONTROLLER WITH SNOWFLAKE
// ====================================================================

export class UsersControllerWithSnowflake {
    router: Router;
    
    constructor(
        private registerCommand: UserCRegisterWithSnowflake,
        private getByIdQuery: UserQGetByID
    ) {
        this.router = Router();
        this.setupRoutes();
    }
    
    private setupRoutes() {
        this.router.post('/api/users/snowflake', this.register.bind(this));
        this.router.get('/api/users/snowflake/:id', this.getById.bind(this));
    }
    
    async register(req: Request, res: Response) {
        const result = await this.registerCommand.handler(req.body);
        
        if (result.state === ResultStates.SUCCESS) {
            const response = {
                userId: result.data!.userId.toString(),  // Convert bigint to string for JSON
                email: result.data!.email,
                name: result.data!.name,
                createdAt: result.data!.createdAt
            };
            res.status(201).json(response);
        } else {
            res.status(400).json({
                state: result.state,
                code: result.code,
                message: result.message.userMessage
            });
        }
    }
    
    async getById(req: Request, res: Response) {
        const userId = BigInt(req.params.id);  // Parse string to bigint
        
        const result = await this.getByIdQuery.handler({ userId });
        
        if (result.state === ResultStates.SUCCESS) {
            const response = {
                userId: result.data!.userId.toString(),
                email: result.data!.email,
                name: result.data!.name
            };
            res.json(response);
        } else if (result.state === ResultStates.EMPTY) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

// ====================================================================
// 20. APP SETUP WITH SNOWFLAKE
// ====================================================================

import express from 'express';
import { createConnection } from 'typeorm';

const app = express();

app.use(express.json());

// Custom JSON serializer for bigint
app.set('json replacer', (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
});

// Initialize database connection
createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'mydb',
    entities: [User],
    synchronize: true
}).then(() => {
    console.log('Database connected');
    console.log(`Node ID: ${nodeId}`);
    
    // Setup controllers
    const registerCommand = container.get<UserCRegisterWithSnowflake>(
        TYPES.UserCRegisterWithSnowflake
    );
    const getByIdQuery = container.get<UserQGetByID>(TYPES.UserQGetByID);
    const usersController = new UsersControllerWithSnowflake(
        registerCommand, 
        getByIdQuery
    );
    
    app.use(usersController.router);
    
    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}).catch(error => console.log('Database connection error:', error));

// Configuration example
/*
// .env file
NODE_ID=0  # Server 1

// .env.production (Server 2)
NODE_ID=1  # Different nodeId per server

// .env.production (Server 3)
NODE_ID=2

// package.json scripts
{
  "scripts": {
    "start": "NODE_ID=0 ts-node src/index.ts",
    "start:server1": "NODE_ID=0 ts-node src/index.ts",
    "start:server2": "NODE_ID=1 ts-node src/index.ts",
    "start:server3": "NODE_ID=2 ts-node src/index.ts"
  }
}
*/// ====================================================================
// ENTITY-DRIVEN CLEAN ARCHITECTURE - TYPESCRIPT IMPLEMENTATION EXAMPLES
// ====================================================================

// ====================================================================
// 1. RESULT ENVELOPE PATTERN
// ====================================================================

export interface InvalidPropertyInfo {
    propertyName: string;
    userMessage: string;
    validationMessage: string;
    validationCode: string;
}

export interface Messages {
    apiMessage: string;
    userMessage: string;
}

export class ResultStates {
    static readonly SUCCESS = 'success';
    static readonly UNSUCCESS = 'unsuccess';
    static readonly EMPTY = 'empty';
    static readonly INVALID = 'invalid';
    static readonly ERROR = 'error';
}

export class Result<T> {
    state: string;
    code: string;
    message: Messages;
    data?: T;
    invalidFields?: InvalidPropertyInfo[];
    
    constructor(
        state: string = ResultStates.SUCCESS,
        message: Messages = { apiMessage: '', userMessage: '' },
        code: string = ''
    ) {
        this.state = state;
        this.message = message;
        this.code = code;
    }
}

export class ResultCheckData {
    static multiple<T>(dataSet: T[]): Result<T[]> {
        try {
            if (dataSet && dataSet.length > 0) {
                const result = new Result<T[]>(
                    ResultStates.SUCCESS,
                    { apiMessage: '', userMessage: '' }
                );
                result.data = dataSet;
                return result;
            } else {
                return new Result<T[]>(
                    ResultStates.EMPTY,
                    { apiMessage: '', userMessage: '' }
                );
            }
        } catch (ex) {
            return new Result<T[]>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' }
            );
        }
    }
    
    static single<T>(dataSet: T[]): Result<T> {
        try {
            if (dataSet && dataSet.length > 0) {
                const result = new Result<T>(
                    ResultStates.SUCCESS,
                    { apiMessage: '', userMessage: '' }
                );
                result.data = dataSet[0];
                return result;
            } else {
                return new Result<T>(
                    ResultStates.EMPTY,
                    { apiMessage: '', userMessage: '' }
                );
            }
        } catch (ex) {
            return new Result<T>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' }
            );
        }
    }
}

// ====================================================================
// 2. ENTITY (Persistence Model)
// ====================================================================

export interface User {
    userId?: number;
    email: string;
    name: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt: Date;  // Always UTC
    updatedAt?: Date; // Always UTC
    status: string;
    failLoginCount?: number;
    lastLoginAttemptDate?: Date;
}

// ====================================================================
// 3. INPUT DTO
// ====================================================================

export interface UserCRegisterI {
    email: string;
    name: string;
    password: string;
}

// ====================================================================
// 4. OUTPUT DTO
// ====================================================================

export interface UserCRegisterO {
    userId: number;
    email: string;
    name: string;
    createdAt: Date;  // UTC
}

// ====================================================================
// 5. MESSAGES (Multilanguage)
// ====================================================================

export class UserCRegisterM {
    private static messages: Record<string, Record<string, Messages>> = {
        en: {
            emailRequired: {
                apiMessage: 'Email is required',
                userMessage: 'Please enter your email address'
            },
            emailAlreadyExists: {
                apiMessage: 'Email already exists',
                userMessage: 'This email is already registered'
            },
            passwordTooShort: {
                apiMessage: 'Password must be at least 8 characters',
                userMessage: 'Password must be at least 8 characters'
            }
        },
        es: {
            emailRequired: {
                apiMessage: 'El correo es requerido',
                userMessage: 'Por favor ingrese su correo electrónico'
            },
            emailAlreadyExists: {
                apiMessage: 'El correo ya existe',
                userMessage: 'Este correo ya está registrado'
            },
            passwordTooShort: {
                apiMessage: 'La contraseña debe tener al menos 8 caracteres',
                userMessage: 'La contraseña debe tener al menos 8 caracteres'
            }
        }
    };
    
    static get(language: string, key: string): Messages {
        if (!this.messages[language]) {
            language = 'en';
        }
        
        if (!this.messages[language][key]) {
            return { apiMessage: '', userMessage: '' };
        }
        
        return this.messages[language][key];
    }
}

// ====================================================================
// 6. COMMAND WITH HANDLER (Complete Example)
// ====================================================================

import * as bcrypt from 'bcrypt';
import { clean } from './helpers/stringExtensions';

export class UserCRegister {
    private language: string;
    
    constructor(
        private readonly repository: IUserRepository,
        private readonly emailService: IEmailService,
        private readonly dateTimeProvider: IDateTimeProvider,
        language: string = 'en'
    ) {
        this.language = language;
    }
    
    async handler(input: UserCRegisterI): Promise<Result<UserCRegisterO>> {
        try {
            // #region Clean
            input.email = clean(input.email)?.toLowerCase() || '';
            input.name = clean(input.name) || '';
            input.password = input.password?.trim() || '';
            // #endregion
            
            // #region Validation
            const prefix = 'USER_REGISTER';
            
            if (!input.email) {
                return new Result<UserCRegisterO>(
                    ResultStates.INVALID,
                    UserCRegisterM.get(this.language, 'emailRequired'),
                    `${prefix}:EMAIL_REQUIRED`
                );
            }
            
            if (input.password.length < 8) {
                return new Result<UserCRegisterO>(
                    ResultStates.INVALID,
                    UserCRegisterM.get(this.language, 'passwordTooShort'),
                    `${prefix}:PASSWORD_TOO_SHORT`
                );
            }
            // #endregion
            
            // #region Business Rules
            const existingUser = await this.repository.getByEmail(input.email);
            if (existingUser) {
                return new Result<UserCRegisterO>(
                    ResultStates.UNSUCCESS,
                    UserCRegisterM.get(this.language, 'emailAlreadyExists'),
                    `${prefix}:EMAIL_EXISTS`
                );
            }
            // #endregion
            
            // #region Process
            const user: User = {
                email: input.email,
                name: input.name,
                passwordHash: await this.hashPassword(input.password),
                passwordSalt: '',
                createdAt: this.dateTimeProvider.utcNow(),  // Always UTC
                status: 'active'
            };
            
            await this.repository.create(user);
            
            await this.emailService.sendWelcomeEmail(user.email, user.name);
            
            const result = new Result<UserCRegisterO>(
                ResultStates.SUCCESS,
                { apiMessage: '', userMessage: '' },
                `${prefix}:SUCCESS`
            );
            result.data = {
                userId: user.userId!,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt  // UTC
            };
            return result;
            // #endregion
            
        } catch (error) {
            return new Result<UserCRegisterO>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' },
                'USER_REGISTER:SYSTEM_ERROR'
            );
        }
    }
    
    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }
}

// ====================================================================
// 7. QUERY EXAMPLE
// ====================================================================

export interface UserQGetByIDI {
    userId: number;
}

export interface UserQGetByIDO {
    userId: number;
    email: string;
    name: string;
    createdAt: Date;  // UTC
}

export class UserQGetByID {
    constructor(private readonly repository: IUserRepository) {}
    
    async handler(input: UserQGetByIDI): Promise<Result<UserQGetByIDO>> {
        try {
            // #region Process
            const user = await this.repository.getById(input.userId);
            
            if (!user) {
                return new Result<UserQGetByIDO>(
                    ResultStates.EMPTY,
                    { apiMessage: '', userMessage: '' }
                );
            }
            
            const result = new Result<UserQGetByIDO>(
                ResultStates.SUCCESS,
                { apiMessage: '', userMessage: '' }
            );
            result.data = {
                userId: user.userId!,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt  // UTC
            };
            return result;
            // #endregion
            
        } catch (error) {
            return new Result<UserQGetByIDO>(
                ResultStates.ERROR,
                { apiMessage: '', userMessage: '' }
            );
        }
    }
}

// ====================================================================
// 8. INTERFACES (Core/Interfaces)
// ====================================================================

export interface IUserRepository {
    getById(id: number): Promise<User | null>;
    getByEmail(email: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    getAll(): Promise<User[]>;
    create(user: User): Promise<void>;
    update(user: User): Promise<void>;
    delete(id: number): Promise<void>;
}

export interface IEmailService {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
}

export interface IDateTimeProvider {
    utcNow(): Date;
}

export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, expiration?: number): Promise<void>;
    remove(key: string): Promise<void>;
}

// ====================================================================
// 9. INFRASTRUCTURE IMPLEMENTATIONS
// ====================================================================

import { Repository } from 'typeorm';

export class UserRepository implements IUserRepository {
    constructor(private repository: Repository<User>) {}
    
    async getById(id: number): Promise<User | null> {
        return await this.repository.findOne({ where: { userId: id } });
    }
    
    async getByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({ where: { email } });
    }
    
    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.repository.count({ where: { email } });
        return count > 0;
    }
    
    async getAll(): Promise<User[]> {
        return await this.repository.find();
    }
    
    async create(user: User): Promise<void> {
        await this.repository.save(user);
    }
    
    async update(user: User): Promise<void> {
        await this.repository.save(user);
    }
    
    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}

export class DateTimeProvider implements IDateTimeProvider {
    utcNow(): Date {
        return new Date();  // JavaScript Date is always UTC internally
    }
}

import nodemailer from 'nodemailer';

export class EmailService implements IEmailService {
    private transporter: nodemailer.Transporter;
    
    constructor(smtpConfig: any) {
        this.transporter = nodemailer.createTransport(smtpConfig);
    }
    
    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        await this.transporter.sendMail({
            from: 'noreply@example.com',
            to,
            subject,
            html: body
        });
    }
    
    async sendWelcomeEmail(email: string, name: string): Promise<void> {
        const subject = 'Welcome!';
        const body = `<h1>Welcome ${name}!</h1>`;
        await this.sendEmail(email, subject, body);
    }
}

// ====================================================================
// 10. CACHED REPOSITORY (Decorator Pattern)
// ====================================================================

export class CachedUserRepository implements IUserRepository {
    private readonly cacheDuration = 600; // 10 minutes in seconds
    
    constructor(
        private readonly innerRepository: IUserRepository,
        private readonly cache: ICacheService
    ) {}
    
    async getById(id: number): Promise<User | null> {
        const cacheKey = `user:${id}`;
        
        // Try cache first
        const cached = await this.cache.get<User>(cacheKey);
        if (cached) {
            return cached;
        }
        
        // Get from database
        const user = await this.innerRepository.getById(id);
        
        // Save to cache
        if (user) {
            await this.cache.set(cacheKey, user, this.cacheDuration);
        }
        
        return user;
    }
    
    async create(user: User): Promise<void> {
        await this.innerRepository.create(user);
        // Invalidate cache
        await this.cache.remove(`user:${user.userId}`);
    }
    
    async getByEmail(email: string): Promise<User | null> {
        // Don't cache email lookups
        return await this.innerRepository.getByEmail(email);
    }
    
    // Implement other methods similarly...
    async existsByEmail(email: string): Promise<boolean> {
        return await this.innerRepository.existsByEmail(email);
    }
    
    async getAll(): Promise<User[]> {
        return await this.innerRepository.getAll();
    }
    
    async update(user: User): Promise<void> {
        await this.innerRepository.update(user);
        await this.cache.remove(`user:${user.userId}`);
    }
    
    async delete(id: number): Promise<void> {
        await this.innerRepository.delete(id);
        await this.cache.remove(`user:${id}`);
    }
}

// ====================================================================
// 11. CLEAN HELPERS
// ====================================================================

export function clean(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/\r/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .replace(/\b/g, "")
        .replace(/\f/g, "")
        .replace(/\v/g, "")
        .trim();
}

export function cleanPhone(str: string | null | undefined): string {
    if (!str) return "";
    return cleanNumber(str)
        .replace(/\(/g, "")
        .replace(/\)/g, "")
        .replace(/ /g, "")
        .replace(/-/g, "");
}

export function cleanNumber(str: string | null | undefined): string {
    if (!str) return "";
    return clean(str)
        .replace(/,/g, "")
        .replace(/\$/g, "");
}

// ====================================================================
// 12. REST CONTROLLER (Presentation Layer with Express)
// ====================================================================

import { Router, Request, Response } from 'express';
import * as moment from 'moment-timezone';

export class UsersController {
    router: Router;
    
    constructor(
        private registerCommand: UserCRegister,
        private getByIdQuery: UserQGetByID
    ) {
        this.router = Router();
        this.setupRoutes();
    }
    
    private setupRoutes() {
        this.router.post('/api/users', this.register.bind(this));
        this.router.get('/api/users/:id', this.getById.bind(this));
    }
    
    async register(req: Request, res: Response) {
        const userTimezone = req.headers['user-timezone'] as string || 'UTC';
        
        const result = await this.registerCommand.handler(req.body);
        
        if (result.state === ResultStates.SUCCESS) {
            const response = {
                userId: result.data!.userId,
                email: result.data!.email,
                name: result.data!.name,
                createdAt: this.convertToUserTimezone(result.data!.createdAt, userTimezone)
            };
            res.status(201).json(response);
        } else if (result.state === ResultStates.INVALID) {
            res.status(400).json({
                state: result.state,
                code: result.code,
                message: result.message.userMessage
            });
        } else {
            res.status(400).json({
                state: result.state,
                code: result.code,
                message: result.message.userMessage
            });
        }
    }
    
    async getById(req: Request, res: Response) {
        const userId = parseInt(req.params.id);
        const userTimezone = req.headers['user-timezone'] as string || 'UTC';
        
        const result = await this.getByIdQuery.handler({ userId });
        
        if (result.state === ResultStates.SUCCESS) {
            const response = {
                userId: result.data!.userId,
                email: result.data!.email,
                name: result.data!.name,
                createdAt: this.convertToUserTimezone(result.data!.createdAt, userTimezone)
            };
            res.json(response);
        } else if (result.state === ResultStates.EMPTY) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    private convertToUserTimezone(utcDate: Date, timezone: string): Date {
        return moment.utc(utcDate).tz(timezone).toDate();
    }
    
    private convertToUTC(userDate: Date, timezone: string): Date {
        return moment.tz(userDate, timezone).utc().toDate();
    }
}

// ====================================================================
// 13. DEPENDENCY INJECTION SETUP (with InversifyJS)
// ====================================================================

import { Container } from 'inversify';
import 'reflect-metadata';

const TYPES = {
    UserRepository: Symbol.for('UserRepository'),
    UserRepositoryReal: Symbol.for('UserRepositoryReal'),
    EmailService: Symbol.for('EmailService'),
    DateTimeProvider: Symbol.for('DateTimeProvider'),
    CacheService: Symbol.for('CacheService'),
    UserCRegister: Symbol.for('UserCRegister'),
    UserQGetByID: Symbol.for('UserQGetByID')
};

const container = new Container();

// Infrastructure - Database
container.bind<Repository<User>>(TYPES.UserRepositoryReal)
    .toDynamicValue(() => {
        // Get TypeORM repository
        return getRepository(User);
    })
    .inRequestScope();

// Infrastructure - Cache
container.bind<ICacheService>(TYPES.CacheService)
    .to(RedisCacheService)
    .inSingletonScope();

// Infrastructure - Repository with caching
container.bind<IUserRepository>(TYPES.UserRepository)
    .toDynamicValue((context) => {
        const realRepo = new UserRepository(
            context.container.get<Repository<User>>(TYPES.UserRepositoryReal)
        );
        const cache = context.container.get<ICacheService>(TYPES.CacheService);
        return new CachedUserRepository(realRepo, cache);
    })
    .inRequestScope();

// Infrastructure - Services
container.bind<IEmailService>(TYPES.EmailService)
    .toDynamicValue(() => {
        return new EmailService({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    })
    .inSingletonScope();

container.bind<IDateTimeProvider>(TYPES.DateTimeProvider)
    .to(DateTimeProvider)
    .inSingletonScope();

// Core - Commands and Queries
container.bind<UserCRegister>(TYPES.UserCRegister)
    .toDynamicValue((context) => {
        return new UserCRegister(
            context.container.get<IUserRepository>(TYPES.UserRepository),
            context.container.get<IEmailService>(TYPES.EmailService),
            context.container.get<IDateTimeProvider>(TYPES.DateTimeProvider),
            'en'
        );
    })
    .inRequestScope();

container.bind<UserQGetByID>(TYPES.UserQGetByID)
    .toDynamicValue((context) => {
        return new UserQGetByID(
            context.container.get<IUserRepository>(TYPES.UserRepository)
        );
    })
    .inRequestScope();

export { container, TYPES };

// ====================================================================
// 14. EXPRESS APP SETUP
// ====================================================================

import express from 'express';
import { createConnection } from 'typeorm';

const app = express();

app.use(express.json());

// Initialize database connection
createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'mydb',
    entities: [User],
    synchronize: true
}).then(() => {
    console.log('Database connected');
    
    // Setup controllers
    const registerCommand = container.get<UserCRegister>(TYPES.UserCRegister);
    const getByIdQuery = container.get<UserQGetByID>(TYPES.UserQGetByID);
    const usersController = new UsersController(registerCommand, getByIdQuery);
    
    app.use(usersController.router);
    
    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}).catch(error => console.log('Database connection error:', error));

