# Secure Task Management System

Full-stack Task Management System with role-based access control (RBAC) in an Nx monorepo. Features JWT authentication, organization-based multi-tenancy, comprehensive RBAC with role hierarchy, and audit logging.

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [Access Control Implementation](#access-control-implementation)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Future Considerations](#future-considerations)

---

## Setup Instructions

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required for the Angular dashboard; Node 20.15 and below will hit ESM/require errors)
- **npm 8+**
- **PostgreSQL** or **SQLite** (for development)

**Upgrading Node (pick one):**

- **nvm** (if installed): `nvm install 20.19.0` then `nvm use 20.19.0`. Or run `nvm use` in the project root (see `.nvmrc`).
- **macOS with Homebrew:** `brew install node@20` then ensure `node@20` is in your PATH, or install the latest LTS: `brew install node` (often gives 22.x). Then `node -v` should show 20.19+ or 22.x.
- **Direct install:** Download the **LTS** installer (20.x or 22.x) from [nodejs.org](https://nodejs.org/) and run it. Restart the terminal, then run `node -v` to confirm (e.g. `v20.19.0` or `v22.12.0`).

After upgrading, run `npm install` again.

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd msandhu-FD78AF1B-1905-4539-A14D-FA51189DFC93
```

2. **Install dependencies**

```bash
npm install
```

### Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

**Required Environment Variables:**

Edit `.env` and configure the following:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRATION=1h

# Database Configuration (choose one)
# SQLite (for development)
DATABASE_URL=sqlite:./data/tasks.db

# PostgreSQL (for production)
# DATABASE_URL=postgresql://user:password@localhost:5432/taskdb

# API Configuration
API_PORT=3333
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3333/api
```

**Important Security Notes:**
- `JWT_SECRET` must be at least 32 characters long and cryptographically random
- Never commit `.env` file to version control
- Use different secrets for development, staging, and production environments
- In production, use environment-specific secret management (AWS Secrets Manager, Azure Key Vault, etc.)

### Running the Applications

#### Backend (NestJS API)

```bash
# Development mode with hot reload
npm run serve:api

# Or using Nx directly
npx nx serve api
```

The API will be available at `http://localhost:3333`

#### Frontend (Angular Dashboard)

```bash
# Development mode with hot reload
npm run serve:dashboard

# Or using Nx directly
npx nx serve dashboard
```

The dashboard will be available at `http://localhost:4200`

#### Run Both Simultaneously

```bash
# In separate terminals
npm run serve:api
npm run serve:dashboard
```

### Building for Production

```bash
# Build backend
npx nx build api

# Build frontend
npx nx build dashboard

# Build both
npx nx run-many --target=build --all
```

Build artifacts will be in `dist/apps/`

### Testing

```bash
# Run backend tests (94 tests)
npm run test:api

# Run frontend tests (106 tests)
npm run test:dashboard

# Run tests in watch mode
npm run test:api -- --watch
npm run test:dashboard -- --watch

# Run all tests
npx nx run-many --target=test --all
```

---

## Architecture Overview

### Nx Monorepo Layout

This project uses Nx to manage a monorepo containing both backend and frontend applications, along with shared libraries. This architecture promotes code reuse, ensures type safety across the stack, and provides excellent developer experience.

```
msandhu-FD78AF1B-1905-4539-A14D-FA51189DFC93/
├── apps/
│   ├── api/                    # NestJS Backend Application
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module (JWT, guards)
│   │   │   ├── users/         # User management
│   │   │   ├── organizations/ # Organization management
│   │   │   ├── tasks/         # Task CRUD operations
│   │   │   ├── audit/         # Audit logging
│   │   │   └── common/        # Shared guards, decorators, filters
│   │   └── jest.config.cts    # Backend test configuration
│   │
│   └── dashboard/              # Angular Frontend Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/      # Services, guards, interceptors
│       │   │   ├── features/  # Feature modules (auth, tasks)
│       │   │   └── shared/    # Shared components, pipes
│       │   └── environments/  # Environment configurations
│       └── jest.config.cts    # Frontend test configuration
│
├── libs/
│   ├── data/                   # Shared TypeScript Interfaces & DTOs
│   │   └── src/lib/
│   │       └── interfaces.ts  # User, Task, Organization types
│   │
│   └── auth/                   # Reusable RBAC Logic
│       └── src/lib/
│           ├── roles.ts       # Role hierarchy functions
│           └── permissions.ts # Permission mapping logic
│
├── .env.example               # Environment template
├── jest.preset.js            # Shared Jest configuration
├── nx.json                   # Nx workspace configuration
└── tsconfig.base.json       # Shared TypeScript configuration
```

### Architecture Rationale

#### 1. **Monorepo Benefits**
- **Code Sharing**: Shared types ensure backend and frontend stay in sync
- **Single Source of Truth**: DTOs and interfaces defined once, used everywhere
- **Atomic Changes**: Update API and UI together in a single commit
- **Unified Tooling**: One Jest config, one ESLint config, consistent dev experience
- **Simplified Dependency Management**: All packages managed in one place

#### 2. **Shared Libraries**

**`libs/data`** - Type Definitions
- Contains all shared TypeScript interfaces and DTOs
- Used by both API and Dashboard to ensure type safety
- Includes: `User`, `Task`, `Organization`, `Role`, `Permission`, `LoginDto`, `JwtPayloadDto`
- Benefits: Prevents type mismatches, catches errors at compile time

**`libs/auth`** - RBAC Logic
- Centralized authorization logic used by both backend and frontend
- Functions:
  - `hasRoleOrAbove(userRole, requiredRole)` - Check role hierarchy
  - `hasPermission(role, permission)` - Check if role has permission
  - `canViewAuditLog(role)` - Special permission check for audit logs
- Benefits: Consistent RBAC implementation, testable in isolation, reusable

#### 3. **Backend Architecture (NestJS)**

**Why NestJS?**
- TypeScript-first with excellent DI container
- Built-in support for guards, interceptors, and decorators
- TypeORM integration for database operations
- Passport.js integration for authentication strategies

**Key Modules:**
- **Auth Module**: JWT authentication, login/register endpoints
- **Users Module**: User management, profile operations
- **Organizations Module**: Multi-tenant organization management
- **Tasks Module**: Core business logic with RBAC enforcement
- **Audit Module**: Comprehensive audit logging for compliance

**Guards & Decorators:**
- `@UseGuards(JwtAuthGuard)` - Validates JWT token
- `@Roles('admin', 'owner')` - Requires specific roles
- `@RequirePermission('task:create')` - Requires specific permissions
- `RolesGuard` - Enforces role-based access
- `PermissionsGuard` - Enforces permission-based access

#### 4. **Frontend Architecture (Angular)**

**Why Angular?**
- Strong TypeScript support and type safety
- Comprehensive tooling and CLI
- Built-in dependency injection
- Excellent testing infrastructure with Jest
- Standalone components for modern, modular architecture

**Architecture Patterns:**
- **Feature Modules**: Auth, Tasks organized as feature modules
- **Core Module**: Singleton services (AuthService, TaskService)
- **Shared Module**: Reusable components, pipes, directives
- **Component Store**: NgRx Component Store for local state management
- **Guards**: Route protection based on authentication and roles
- **Interceptors**: HTTP request/response transformation (JWT injection, error handling)

**Key Services:**
- `AuthService` - Handles login, logout, token management, role checking
- `TaskService` - Task CRUD operations via HTTP
- `TaskStore` - NgRx Component Store for task state (filtering, sorting, optimistic updates)

**Guards:**
- `authGuard` - Protects routes requiring authentication
- `roleGuard` - Protects routes requiring specific roles

**Interceptors:**
- `authInterceptor` - Automatically adds JWT to requests
- `errorInterceptor` - Global error handling, auto-logout on 401

---

## Data Model

### Entity Relationship Overview

The system uses a multi-tenant architecture with organization-based data isolation and role-based access control.

```
Organization (1) ----< User (N)
     |
     | (1)
     |
     v
  Task (N)
     |
     | (created by)
     v
  User

Organization (1) ----< AuditLog (N)
```

### Core Entities

#### **User**
Represents system users with organizational membership and role assignment.

```typescript
interface User {
  id: string;                    // UUID primary key
  email: string;                 // Unique email address
  password: string;              // Hashed password (bcrypt)
  organizationId: string;        // Foreign key to Organization
  role: 'owner' | 'admin' | 'viewer';  // User's role in organization
  createdAt: Date;
  updatedAt: Date;
}
```

**Constraints:**
- Email must be unique across the system
- Password is hashed using bcrypt (never stored in plain text)
- Each user belongs to exactly one organization
- Role determines permissions within the organization

#### **Organization**
Represents isolated tenants in the multi-tenant system.

```typescript
interface Organization {
  id: string;           // UUID primary key
  name: string;         // Organization name
  parentId?: string;    // Optional: 2-level hierarchy support
  createdAt: Date;
  updatedAt: Date;
}
```

**Hierarchy:**
- Supports 2-level organization hierarchy (parent → child)
- Root organizations have `parentId = null`
- Child organizations reference their parent via `parentId`
- Future: Could expand to support cross-organization task visibility

#### **Task**
Core business entity representing work items.

```typescript
interface Task {
  id: string;                              // UUID primary key
  title: string;                           // Task title
  description?: string;                    // Optional description
  status: 'todo' | 'in_progress' | 'done'; // Workflow status
  category?: string;                       // Optional categorization
  createdById: string;                     // Foreign key to User
  organizationId: string;                  // Foreign key to Organization
  createdAt: Date;
  updatedAt: Date;
}
```

**Access Control:**
- Users can only see tasks in their organization
- Create/Update/Delete permissions based on role
- Task creator is tracked for audit purposes

#### **AuditLog**
Tracks all significant actions for compliance and debugging.

```typescript
interface AuditLog {
  id: string;                // UUID primary key
  action: string;            // Action type (e.g., 'TASK_CREATED')
  userId: string;            // Foreign key to User
  organizationId: string;    // Foreign key to Organization
  resourceType: string;      // Entity type (e.g., 'Task')
  resourceId: string;        // Entity ID
  details?: Record<string, any>;  // Additional context (JSON)
  createdAt: Date;
}
```

**Usage:**
- Automatically logged for all CRUD operations on tasks
- Only accessible to users with 'owner' role
- Provides full audit trail for compliance

### Role Hierarchy

```
owner (highest privilege)
  │
  ├─ Full access to all tasks in organization
  ├─ Can view audit logs
  ├─ Can create, read, update, delete tasks
  │
admin (moderate privilege)
  │
  ├─ Full access to tasks in organization  
  ├─ Can create, read, update, delete tasks
  ├─ Cannot view audit logs
  │
viewer (lowest privilege)
  │
  └─ Read-only access to tasks
     └─ Can only view and list tasks
```

**Role Implementation:**
- Roles follow a strict hierarchy: `owner > admin > viewer`
- `hasRoleOrAbove('admin')` returns true for 'admin' and 'owner'
- Guards enforce roles at both controller and service levels

### Permission Model

Permissions are derived from roles, not assigned individually.

```typescript
type Permission = 
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'audit:read';

// Permission mapping by role
const PERMISSION_BY_ROLE = {
  owner: ['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'],
  admin: ['task:create', 'task:read', 'task:update', 'task:delete'],
  viewer: ['task:read']
};
```

### Database Schema (TypeORM)

**Implementation Details:**
- Using TypeORM with decorator-based entity definitions
- Supports both PostgreSQL (production) and SQLite (development)
- Automatic schema synchronization in development
- Migrations for production deployments

**Indexes:**
- `users.email` - Unique index for fast login lookups
- `tasks.organizationId` - For efficient organization-scoped queries
- `tasks.createdById` - For user-created task queries
- `auditLog.organizationId` - For audit log filtering

**Relationships:**
- User → Organization (Many-to-One)
- Task → Organization (Many-to-One)
- Task → User (createdBy) (Many-to-One)
- AuditLog → Organization (Many-to-One)
- AuditLog → User (Many-to-One)

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organization   │
│─────────────────│
│ id (PK)         │
│ name            │
│ parentId (FK)   │◄─────┐
│ createdAt       │      │
│ updatedAt       │      │ (parent org)
└────────┬────────┘      │
         │               │
         │ (1)           │
         │               │
         ▼ (N)           │
┌─────────────────┐      │
│      User       │      │
│─────────────────│      │
│ id (PK)         │      │
│ email (UNIQUE)  │      │
│ password        │      │
│ organizationId ─┼──────┘
│ role            │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ (creator)
         │
         ▼ (N)
┌─────────────────┐
│      Task       │
│─────────────────│
│ id (PK)         │
│ title           │
│ description     │
│ status          │
│ category        │
│ createdById ────┼──────┐
│ organizationId ─┼──────┤
│ createdAt       │      │
│ updatedAt       │      │
└─────────────────┘      │
                         │
         ┌───────────────┘
         │
         ▼ (N)
┌─────────────────┐
│   AuditLog      │
│─────────────────│
│ id (PK)         │
│ action          │
│ userId ─────────┼──────┐
│ organizationId ─┼──────┤
│ resourceType    │      │
│ resourceId      │      │
│ details (JSON)  │      │
│ createdAt       │      │
└─────────────────┘      │
                         │
         ┌───────────────┘
         │
         └──► (references User & Organization)
```

---

## Access Control Implementation

### Overview

The system implements a comprehensive Role-Based Access Control (RBAC) system with organization-based multi-tenancy. Access control is enforced at multiple layers: JWT authentication, role hierarchy, permission mapping, and organization scoping.

### Authentication Flow

#### 1. **User Registration**

```typescript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "organizationName": "Acme Corp",
  "role": "owner"  // First user is owner
}
```

**Process:**
1. Password is hashed using bcrypt (salt rounds: 10)
2. New organization is created for first user
3. User record created with organizationId and role
4. JWT token returned immediately (auto-login)

#### 2. **User Login**

```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Payload:**
```typescript
interface JwtPayloadDto {
  sub: string;           // User ID
  email: string;         // User email
  organizationId: string; // Organization ID
  role: 'owner' | 'admin' | 'viewer';  // User role
  iat: number;           // Issued at
  exp: number;           // Expiration (default: 1 hour)
}
```

#### 3. **Token Verification**

- Every protected endpoint uses `@UseGuards(JwtAuthGuard)`
- JWT token validated using `passport-jwt` strategy
- Payload extracted and attached to request: `req.user`
- Invalid/expired tokens return `401 Unauthorized`

### Role Hierarchy

Roles follow a strict hierarchy where higher roles inherit all permissions from lower roles:

```
┌─────────────────────────────────────────────┐
│              OWNER                          │
│  • Full organization access                 │
│  • All task operations (CRUD)              │
│  • Audit log access                        │
│  • User management (future)                │
└──────────────────┬──────────────────────────┘
                   │ inherits from ↓
┌─────────────────────────────────────────────┐
│              ADMIN                          │
│  • Full task access (CRUD)                 │
│  • Cannot view audit logs                  │
│  • Cannot manage users                     │
└──────────────────┬──────────────────────────┘
                   │ inherits from ↓
┌─────────────────────────────────────────────┐
│             VIEWER                          │
│  • Read-only task access                   │
│  • Cannot create/update/delete             │
│  • Cannot view audit logs                  │
└─────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// libs/auth/src/lib/roles.ts
export function hasRoleOrAbove(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy = {
    owner: 3,
    admin: 2,
    viewer: 1,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
```

### Permission Model

Permissions are mapped to roles, not assigned individually. This ensures consistency and simplifies management.

```typescript
// libs/auth/src/lib/permissions.ts
type Permission = 
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'audit:read';

const PERMISSION_BY_ROLE: Record<Role, Permission[]> = {
  owner: [
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'audit:read'
  ],
  admin: [
    'task:create',
    'task:read',
    'task:update',
    'task:delete'
  ],
  viewer: [
    'task:read'
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSION_BY_ROLE[role].includes(permission);
}
```

### Organization Hierarchy & Scoping

#### **Multi-Tenancy**
- Each user belongs to exactly one organization
- Users can only access data within their organization
- Database queries automatically filter by `organizationId`

#### **2-Level Hierarchy**
```
Root Organization (parentId: null)
  │
  ├── Child Organization 1
  ├── Child Organization 2
  └── Child Organization 3
```

**Current Implementation:**
- Organizations have optional `parentId`
- Data isolation is enforced at organization level
- No cross-organization access (can be extended in future)

### Backend Guard Implementation

#### **1. JWT Authentication Guard**

```typescript
@Controller('tasks')
@UseGuards(JwtAuthGuard)  // ← All routes require valid JWT
export class TasksController {
  // ...
}
```

**What it does:**
- Validates JWT signature
- Checks expiration
- Extracts user info and attaches to request
- Rejects invalid/expired tokens with 401

#### **2. Role Guard**

```typescript
@Controller('tasks')
export class TasksController {
  @Post()
  @Roles('admin', 'owner')  // ← Only admin/owner can create
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: JwtPayloadDto) {
    return this.tasksService.create(createTaskDto, user);
  }
}
```

**What it does:**
- Reads `@Roles()` decorator metadata
- Checks if `user.role` has required role or higher
- Returns 403 Forbidden if insufficient role

#### **3. Permission Guard**

```typescript
@Delete(':id')
@RequirePermission('task:delete')  // ← Requires specific permission
@UseGuards(JwtAuthGuard, PermissionsGuard)
async remove(@Param('id') id: string, @CurrentUser() user: JwtPayloadDto) {
  return this.tasksService.remove(id, user);
}
```

**What it does:**
- Reads `@RequirePermission()` decorator metadata
- Checks if user's role has the required permission
- Returns 403 Forbidden if permission missing

#### **4. Service-Level RBAC**

Guards aren't enough—services also enforce RBAC:

```typescript
// tasks.service.ts
async update(id: string, updateTaskDto: UpdateTaskDto, user: JwtPayloadDto): Promise<Task> {
  const task = await this.findOne(id, user);
  
  // Verify user has permission
  if (!hasPermission(user.role, 'task:update')) {
    throw new ForbiddenException('Insufficient permissions');
  }
  
  // Verify task belongs to user's organization
  if (task.organizationId !== user.organizationId) {
    throw new ForbiddenException('Cannot modify tasks from other organizations');
  }
  
  // Update task...
}
```

### Frontend Guard Implementation

#### **1. Authentication Guard**

```typescript
// apps/dashboard/src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
```

**Usage:**
```typescript
// Route configuration
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]  // ← Requires authentication
}
```

#### **2. Role Guard**

```typescript
// apps/dashboard/src/app/core/guards/role.guard.ts
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const requiredRoles = route.data['roles'] as Role[];
  
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  
  const user = authService.getCurrentUser();
  const hasRequiredRole = requiredRoles.some(role => 
    authService.hasRole(role)
  );
  
  if (!hasRequiredRole) {
    router.navigate(['/unauthorized']);
    return false;
  }
  
  return true;
};
```

**Usage:**
```typescript
// Route configuration
{
  path: 'audit',
  component: AuditLogComponent,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['owner'] }  // ← Only owners can access
}
```

### JWT Integration with Access Control

#### **Token Flow**

1. **Login** → Server generates JWT with user info
2. **Storage** → Frontend stores in `localStorage` (consider `httpOnly` cookies for production)
3. **Requests** → `authInterceptor` adds token to all API requests
4. **Validation** → Backend validates token on every protected endpoint
5. **Expiration** → Frontend checks expiration, redirects to login if expired
6. **Logout** → Frontend removes token, redirects to login

#### **HTTP Interceptor (Frontend)**

```typescript
// apps/dashboard/src/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // Don't add token to auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }
  
  // Add Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

#### **Error Handling (Frontend)**

```typescript
// apps/dashboard/src/app/core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

### Audit Logging

All significant actions are logged for compliance and debugging:

```typescript
// Automatically logged
await this.auditService.log({
  action: 'TASK_CREATED',
  userId: user.sub,
  organizationId: user.organizationId,
  resourceType: 'Task',
  resourceId: task.id,
  details: { title: task.title, status: task.status }
});
```

**Access:**
- Only users with `'owner'` role can view audit logs
- Filtered by organization (users only see their org's logs)
- Includes full context: who, what, when, where

### Security Best Practices Implemented

✅ **Password Security**
- Passwords hashed with bcrypt (never stored in plain text)
- Salt rounds: 10
- Password validation on login

✅ **JWT Security**
- Signed with secure secret (min 32 characters)
- Short expiration time (1 hour default)
- Payload includes only necessary info

✅ **Authorization Layers**
- Controller guards (first line of defense)
- Service-level checks (defense in depth)
- Database-level filtering by organization

✅ **Organization Isolation**
- All queries scoped by `organizationId`
- Cross-organization access prevented
- Foreign key constraints enforced

✅ **Input Validation**
- DTOs with `class-validator` decorators
- Type checking at compile time
- Runtime validation on API endpoints

---

## API Documentation

### Base URL

```
Development: http://localhost:3333/api
Production: https://your-domain.com/api
```

### Authentication

All endpoints except `/auth/register` and `/auth/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Overview

| Method | Endpoint | Description | Auth | RBAC |
|--------|----------|-------------|------|------|
| POST | `/auth/register` | Register new user | Public | - |
| POST | `/auth/login` | Login user | Public | - |
| GET | `/tasks` | List tasks | Required | All roles |
| POST | `/tasks` | Create task | Required | admin, owner |
| GET | `/tasks/:id` | Get task | Required | All roles |
| PUT | `/tasks/:id` | Update task | Required | admin, owner |
| DELETE | `/tasks/:id` | Delete task | Required | admin, owner |
| GET | `/audit-log` | Get audit logs | Required | owner only |
| GET | `/organizations` | List organizations | Required | All roles |
| GET | `/organizations/:id` | Get organization | Required | All roles |

---

### Authentication Endpoints

#### **POST /auth/register**

Register a new user and create their organization.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "organizationName": "Acme Corporation",
  "role": "owner"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjI3Y..."
}
```

**Validation:**
- Email must be valid format and unique
- Password must be at least 6 characters
- OrganizationName is required
- Role must be one of: 'owner', 'admin', 'viewer'

**Error Responses:**
```json
// 400 Bad Request - Invalid input
{
  "statusCode": 400,
  "message": ["email must be a valid email address"],
  "error": "Bad Request"
}

// 409 Conflict - Email already exists
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

#### **POST /auth/login**

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjI3Y..."
}
```

**JWT Payload (decoded):**
```json
{
  "sub": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
  "email": "john@example.com",
  "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "role": "owner",
  "iat": 1672531200,
  "exp": 1672534800
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### Task Endpoints

#### **GET /tasks**

List all tasks in the user's organization with optional filtering and sorting.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status ('todo', 'in_progress', 'done')
- `category` (optional): Filter by category
- `sortBy` (optional): Sort field ('createdAt', 'updatedAt', 'title')
- `sortOrder` (optional): Sort direction ('asc', 'desc')

**Request:**
```
GET /tasks?status=in_progress&sortBy=createdAt&sortOrder=desc
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Complete project documentation",
    "description": "Add comprehensive README with API docs",
    "status": "in_progress",
    "category": "documentation",
    "createdById": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
    "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Fix authentication bug",
    "description": "Users can't login with special characters in password",
    "status": "in_progress",
    "category": "bug",
    "createdById": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
    "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "createdAt": "2024-01-14T09:15:00.000Z",
    "updatedAt": "2024-01-14T16:45:00.000Z"
  }
]
```

**RBAC:** All authenticated users can list tasks (filtered to their organization)

---

#### **POST /tasks**

Create a new task in the user's organization.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Implement user permissions",
  "description": "Add granular permission system for users",
  "status": "todo",
  "category": "feature"
}
```

**Response:** `201 Created`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "title": "Implement user permissions",
  "description": "Add granular permission system for users",
  "status": "todo",
  "category": "feature",
  "createdById": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
  "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "createdAt": "2024-01-15T15:00:00.000Z",
  "updatedAt": "2024-01-15T15:00:00.000Z"
}
```

**RBAC:** Requires `admin` or `owner` role

**Error Responses:**
```json
// 403 Forbidden - Insufficient role
{
  "statusCode": 403,
  "message": "Insufficient permissions to create tasks",
  "error": "Forbidden"
}
```

---

#### **GET /tasks/:id**

Get a specific task by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
GET /tasks/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project documentation",
  "description": "Add comprehensive README with API docs",
  "status": "in_progress",
  "category": "documentation",
  "createdById": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
  "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:20:00.000Z"
}
```

**RBAC:** All authenticated users can view tasks in their organization

**Error Responses:**
```json
// 404 Not Found - Task doesn't exist or not in user's org
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

---

#### **PUT /tasks/:id**

Update an existing task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
PUT /tasks/550e8400-e29b-41d4-a716-446655440000
```

```json
{
  "title": "Complete project documentation",
  "description": "Add comprehensive README with API docs and examples",
  "status": "done",
  "category": "documentation"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project documentation",
  "description": "Add comprehensive README with API docs and examples",
  "status": "done",
  "category": "documentation",
  "createdById": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
  "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T16:45:00.000Z"
}
```

**RBAC:** Requires `admin` or `owner` role

**Error Responses:**
```json
// 403 Forbidden - Insufficient role or task in different org
{
  "statusCode": 403,
  "message": "Insufficient permissions to update this task",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

---

#### **DELETE /tasks/:id**

Delete a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
DELETE /tasks/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

**RBAC:** Requires `admin` or `owner` role

**Error Responses:**
```json
// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions to delete this task",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

---

### Audit Log Endpoints

#### **GET /audit-log**

Retrieve audit logs for the user's organization.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of records (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Request:**
```
GET /audit-log?limit=50&offset=0
```

**Response:** `200 OK`
```json
[
  {
    "id": "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
    "action": "TASK_CREATED",
    "userId": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
    "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "resourceType": "Task",
    "resourceId": "550e8400-e29b-41d4-a716-446655440000",
    "details": {
      "title": "Complete project documentation",
      "status": "todo"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "b2b2b2b2-c3c3-d4d4-e5e5-f6f6f6f6f6f6",
    "action": "TASK_UPDATED",
    "userId": "9f27c8d4-5e6a-4b7c-8d9e-1f2a3b4c5d6e",
    "organizationId": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "resourceType": "Task",
    "resourceId": "550e8400-e29b-41d4-a716-446655440000",
    "details": {
      "changes": {
        "status": { "from": "todo", "to": "in_progress" }
      }
    },
    "createdAt": "2024-01-15T14:20:00.000Z"
  }
]
```

**RBAC:** Requires `owner` role only

**Error Responses:**
```json
// 403 Forbidden - Non-owner trying to access
{
  "statusCode": 403,
  "message": "Insufficient permissions to view audit log",
  "error": "Forbidden"
}
```

---

### Organization Endpoints

#### **GET /organizations**

List all organizations (currently returns user's organization only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "name": "Acme Corporation",
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### **GET /organizations/:id**

Get a specific organization by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```
GET /organizations/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6
```

**Response:** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
  "name": "Acme Corporation",
  "parentId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "statusCode": 404,
  "message": "Organization not found",
  "error": "Not Found"
}
```

---

### Error Response Format

All error responses follow this structure:

```json
{
  "statusCode": 400,          // HTTP status code
  "message": "Error message", // Human-readable error
  "error": "Bad Request"      // Error type
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Testing

Comprehensive test coverage for both backend and frontend applications using Jest.

### Test Statistics

**Backend (NestJS):** 94 tests across 11 test suites ✅
- Authentication & JWT Strategy
- RBAC Guards (Roles & Permissions)
- Controllers (Auth, Tasks)
- Services (Tasks, Organizations, Audit)

**Frontend (Angular):** 106 tests across 10 test suites ✅
- Services (Auth, Task)
- Guards (Auth, Role)
- State Management (TaskStore with NgRx Component Store)
- Components (Login)
- Interceptors (Auth, Error)
- Pipes (Truncate)

**Total:** 200 tests, 100% passing

### Running Tests

```bash
# Backend tests
npm run test:api

# Frontend tests
npm run test:dashboard

# Run tests in watch mode
npm run test:api -- --watch
npm run test:dashboard -- --watch

# Run all tests
npx nx run-many --target=test --all
```

### Test Coverage

Tests cover:
- ✅ JWT authentication and token validation
- ✅ Role hierarchy (owner > admin > viewer)
- ✅ Permission-based access control
- ✅ Organization-scoped data access
- ✅ CRUD operations with RBAC enforcement
- ✅ Audit logging
- ✅ HTTP interceptors (token injection, error handling)
- ✅ Route guards (authentication, role-based)
- ✅ State management (selectors, effects, optimistic updates)
- ✅ Form validation and submission
- ✅ Error handling and user feedback

### Testing Strategy

**Backend Testing:**
- Unit tests for services with mocked dependencies
- Guard tests with various role/permission scenarios
- Controller tests with mocked services
- Integration tests for auth flow
- TypeORM repository mocking

**Frontend Testing:**
- Component tests with TestBed
- Service tests with HttpClientTestingModule
- Guard tests with mocked services
- Store tests covering all state operations
- Interceptor tests for request/response handling

---

## Future Considerations

### Advanced Role Delegation

**Current State:** Fixed 3-role hierarchy (owner > admin > viewer)

**Future Enhancements:**
1. **Custom Roles**
   - Allow organizations to define custom roles
   - Role templates (e.g., "Project Manager", "Developer", "Auditor")
   - Granular permission assignment per role

2. **Per-Resource Permissions**
   - Override organization-level permissions for specific tasks
   - Task-level access control (share task with specific users)
   - Temporary permission grants with expiration

3. **Team-Based Access**
   - Create teams within organizations
   - Assign roles at team level
   - Cross-team collaboration with controlled access

**Implementation Approach:**
```typescript
// Future schema
interface CustomRole {
  id: string;
  organizationId: string;
  name: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

interface UserRole {
  userId: string;
  roleId: string;
  resourceType?: 'Task' | 'Project' | 'Organization';
  resourceId?: string;
  expiresAt?: Date;
}
```

---

### Production-Ready Security

#### 1. **JWT Refresh Tokens**

**Current Implementation:** Single access token with 1-hour expiration

**Recommended Upgrade:**
- Issue short-lived access tokens (15 minutes)
- Issue long-lived refresh tokens (7 days)
- Store refresh tokens in httpOnly cookies
- Implement token rotation on refresh
- Revocation list for compromised tokens

**Implementation:**
```typescript
// Refresh endpoint
POST /auth/refresh
Headers: Cookie: refresh_token=<token>
Response: { access_token: "..." }

// Store refresh tokens in database
interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}
```

**Benefits:**
- Reduced attack surface (short-lived tokens)
- Better logout control (revoke refresh tokens)
- Improved user experience (less frequent re-auth)

---

#### 2. **CSRF Protection**

**Current State:** No CSRF protection

**Recommended Implementation:**
- Use httpOnly, SameSite cookies for tokens
- Implement CSRF tokens for state-changing operations
- Double-submit cookie pattern
- Synchronizer token pattern for forms

**Options:**
```typescript
// Option 1: SameSite cookies
Set-Cookie: access_token=<token>; HttpOnly; Secure; SameSite=Strict

// Option 2: CSRF tokens
@UseGuards(CsrfGuard)
@Post('tasks')
async create(@Headers('X-CSRF-Token') csrf: string) { ... }
```

**Benefits:**
- Prevents cross-site request forgery attacks
- Protects against malicious sites making requests
- Industry standard for web security

---

#### 3. **RBAC Result Caching**

**Current State:** Every request re-computes permissions

**Recommended Caching Strategy:**

**Client-Side Caching:**
```typescript
// Cache decoded JWT payload
class AuthService {
  private cachedUser: JwtPayloadDto | null = null;
  private cacheExpiry: number = 0;
  
  getCurrentUser(): JwtPayloadDto | null {
    if (Date.now() < this.cacheExpiry) {
      return this.cachedUser;
    }
    // Decode and cache
    this.cachedUser = this.decodeToken();
    this.cacheExpiry = Date.now() + 60000; // 1 minute
    return this.cachedUser;
  }
}
```

**Server-Side Caching:**
```typescript
// Cache permission checks (Redis)
@Injectable()
export class PermissionCacheService {
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const cacheKey = `perm:${userId}:${permission}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached !== null) {
      return cached === 'true';
    }
    
    const result = await this.computePermission(userId, permission);
    await this.redis.setex(cacheKey, 300, result.toString()); // 5 min TTL
    return result;
  }
}
```

**Benefits:**
- Reduced database queries
- Faster response times
- Scalable to millions of requests
- Invalidate cache on role/permission changes

---

#### 4. **Additional Security Measures**

**Rate Limiting:**
```typescript
// Prevent brute force attacks
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
@Post('auth/login')
async login() { ... }
```

**API Key Management:**
```typescript
// For service-to-service auth
interface ApiKey {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  permissions: Permission[];
  lastUsedAt: Date;
}
```

**Audit Log Retention:**
- Archive old logs to cold storage
- Implement log rotation policies
- Comply with data retention regulations (GDPR, SOC2)

**Security Headers:**
```typescript
// helmet.js middleware
app.use(helmet({
  contentSecurityPolicy: true,
  hsts: true,
  noSniff: true,
  xssFilter: true
}));
```

---

### Efficient Scaling of Permission Checks

#### 1. **Database Optimization**

**Current State:** Simple queries without optimization

**Recommended Indexes:**
```sql
-- Task queries by organization
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_created_by_id ON tasks(created_by_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Audit log queries
CREATE INDEX idx_audit_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- User lookups
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
```

**Query Optimization:**
```typescript
// Use select only needed fields
this.tasksRepository.find({
  where: { organizationId },
  select: ['id', 'title', 'status', 'createdAt'],
  order: { createdAt: 'DESC' },
  take: 100
});
```

---

#### 2. **Caching Strategy**

**Multi-Layer Caching:**

**Layer 1: In-Memory (Node.js)**
```typescript
// Cache-aside pattern
const cache = new Map<string, any>();

async findTasks(orgId: string): Promise<Task[]> {
  const cacheKey = `tasks:${orgId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const tasks = await this.tasksRepository.find({ where: { organizationId: orgId } });
  cache.set(cacheKey, tasks);
  setTimeout(() => cache.delete(cacheKey), 60000); // TTL 1 min
  return tasks;
}
```

**Layer 2: Redis (Distributed)**
```typescript
@Injectable()
export class CacheService {
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number = 300): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const value = await factory();
    await this.redis.setex(key, ttl, JSON.stringify(value));
    return value;
  }
}

// Usage
const tasks = await this.cacheService.getOrSet(
  `org:${orgId}:tasks`,
  () => this.tasksRepository.find({ where: { organizationId: orgId } }),
  300 // 5 minutes
);
```

**Cache Invalidation:**
```typescript
// Invalidate on write operations
async updateTask(id: string, data: UpdateTaskDto, user: JwtPayloadDto): Promise<Task> {
  const task = await this.tasksRepository.save({ id, ...data });
  
  // Invalidate caches
  await this.redis.del(`task:${id}`);
  await this.redis.del(`org:${user.organizationId}:tasks`);
  
  return task;
}
```

---

#### 3. **Horizontal Scaling**

**Load Balancing:**
- Use Nginx or AWS ALB for load balancing
- Stateless backend servers (JWT in headers, not sessions)
- Sticky sessions not required

**Database Scaling:**
- Read replicas for query distribution
- Connection pooling (pg-pool)
- Database sharding by organizationId for very large scale

**Example Architecture:**
```
                    ┌─────────────┐
                    │   Nginx/ALB │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ API     │       │ API     │       │ API     │
   │ Server 1│       │ Server 2│       │ Server 3│
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   (Cache)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Primary │       │ Read    │       │ Read    │
   │ DB      │◄──────│ Replica │       │ Replica │
   └─────────┘       └─────────┘       └─────────┘
```

---

#### 4. **Monitoring & Performance**

**Metrics to Track:**
- Average response time per endpoint
- Database query time
- Cache hit/miss ratio
- Authentication success/failure rate
- RBAC check frequency

**Tools:**
- APM: New Relic, DataDog, or Sentry
- Logging: Winston + Elasticsearch
- Metrics: Prometheus + Grafana
- Tracing: OpenTelemetry

**Performance Budget:**
- API response time: < 200ms (p95)
- Database queries: < 50ms (p95)
- Cache lookups: < 5ms
- JWT validation: < 10ms

---

### Deployment Considerations

**Environment Variables:**
- Use secret management (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Never commit secrets to git

**CI/CD Pipeline:**
```yaml
# .github/workflows/deploy.yml
- Lint code
- Run all tests (must pass 100%)
- Build applications
- Security scan (Snyk, npm audit)
- Deploy to staging
- Run E2E tests
- Deploy to production (manual approval)
```

**Health Checks:**
```typescript
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date(),
    database: await this.checkDatabase(),
    redis: await this.checkRedis()
  };
}
```

**Graceful Shutdown:**
```typescript
async onApplicationShutdown(signal?: string) {
  console.log(`Received ${signal}, closing connections...`);
  await this.dbConnection.close();
  await this.redis.quit();
}
```

---

## License

MIT

---

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

---

## Support

For issues or questions:
- Create an issue on GitHub
- Review existing documentation
- Check the test files for usage examples
