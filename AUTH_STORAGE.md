# Authentication Information Storage Guide

## 📍 Where Authentication Data is Stored

### 1. **Frontend (Angular Dashboard)**

#### **Browser LocalStorage** 🔐
**Location**: Browser's LocalStorage (per domain)
**Key**: `access_token`
**Value**: JWT (JSON Web Token) string

**Access in Browser**:
1. Open Developer Tools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Select "Local Storage" → `http://localhost:4200`
4. Look for key: `access_token`

**What's Stored**:
```
access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwib3JnYW5pemF0aW9uSWQiOiJvcmctaWQiLCJyb2xlIjoidmlld2VyIiwiaWF0IjoxNzA3MzMzNjAwLCJleHAiOjE3MDc5MzgzMDB9.signature"
```

**JWT Token Contains** (decoded):
```json
{
  "sub": "user-uuid",           // User ID
  "email": "user@example.com",  // User email
  "organizationId": "org-uuid", // Organization ID
  "role": "viewer",             // User role (viewer/admin/owner)
  "iat": 1707333600,           // Issued at timestamp
  "exp": 1707938300            // Expiration timestamp
}
```

**File Location in Code**:
- **Storage**: `apps/dashboard/src/app/core/services/auth.service.ts`
  - Line 28: `localStorage.getItem('access_token')`
  - Line 43: `localStorage.setItem('access_token', response.access_token)`
  - Line 53: `localStorage.setItem('access_token', response.access_token)`
  - Line 61: `localStorage.removeItem('access_token')`

#### **Angular Service (In-Memory)** 💾
**Location**: `apps/dashboard/src/app/core/services/auth.service.ts`

**RxJS BehaviorSubject**:
```typescript
private currentUserSubject = new BehaviorSubject<JwtPayloadDto | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();
```

**What's Stored**:
- Decoded JWT payload (user info)
- Observable stream for reactive updates
- Accessible via `getCurrentUser()` method

**Access Methods**:
```typescript
// Get current user
const user = this.authService.getCurrentUser();

// Subscribe to user changes
this.authService.currentUser$.subscribe(user => {
  console.log('Current user:', user);
});

// Check if authenticated
const isAuth = this.authService.isAuthenticated();

// Check user role
const hasAdminRole = this.authService.hasRole('admin');
```

---

### 2. **Backend (NestJS API)**

#### **Database** 💿
**Location**: `./data/tasks.db` (SQLite) or PostgreSQL database

**Tables**:

**`users` Table**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,        -- Hashed with bcrypt
  organizationId UUID NOT NULL,
  role VARCHAR NOT NULL,            -- 'viewer', 'admin', or 'owner'
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

**`organizations` Table**:
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  parentId UUID NULL,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

**Entity Files**:
- User Entity: `apps/api/src/entities/user.entity.ts`
- Organization Entity: `apps/api/src/entities/organization.entity.ts`

**Password Storage**:
- Passwords are **hashed** using bcrypt (salt rounds: 10)
- Plain text passwords are **NEVER** stored
- Hash example: `$2b$10$rL5K9H4z5L8Q7D2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F`

#### **JWT Secret** 🔑
**Location**: Environment variables (`.env` file)

**File**: Root directory `.env`
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**⚠️ SECURITY NOTE**: 
- JWT_SECRET should be a strong, random string
- Never commit `.env` file to version control
- Use different secrets for development/production

**Loaded in**: `apps/api/src/auth/auth.module.ts`
```typescript
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
    },
  }),
})
```

---

### 3. **HTTP Requests** 🌐

#### **Authorization Header** (Automatic)
**Location**: HTTP request headers

**Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Automatically Added By**: `apps/dashboard/src/app/core/interceptors/auth.interceptor.ts`
```typescript
intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next.handle(request);
}
```

---

## 🔍 How to Inspect Auth Data

### **Frontend (Browser)**

1. **View JWT Token**:
   ```javascript
   // Open browser console (F12)
   localStorage.getItem('access_token')
   ```

2. **Decode JWT Token**:
   - Visit: https://jwt.io
   - Paste your token
   - View decoded payload

3. **Current User in Console**:
   ```javascript
   // In browser console
   ng.probe(getAllAngularRootElements()[0]).injector.get('AuthService').getCurrentUser()
   ```

### **Backend (Database)**

1. **View Users** (SQLite):
   ```bash
   sqlite3 ./data/tasks.db
   SELECT * FROM users;
   ```

2. **View Organizations**:
   ```bash
   sqlite3 ./data/tasks.db
   SELECT * FROM organizations;
   ```

3. **Check User with Organization**:
   ```sql
   SELECT u.id, u.email, u.role, o.name as organization
   FROM users u
   JOIN organizations o ON u.organizationId = o.id;
   ```

---

## 🔐 Security Best Practices

### ✅ **What We Do Right**:
1. ✅ Passwords are hashed with bcrypt
2. ✅ JWT tokens have expiration (7 days)
3. ✅ Tokens are validated on every API request
4. ✅ Auth guards protect routes
5. ✅ CORS is configured
6. ✅ Role-based access control (RBAC)

### ⚠️ **Security Considerations**:
1. **LocalStorage**: 
   - Vulnerable to XSS attacks
   - Alternative: HttpOnly cookies (more secure but requires backend changes)

2. **JWT Token**:
   - Cannot be revoked until expiration
   - Consider refresh tokens for production

3. **HTTPS**:
   - Always use HTTPS in production
   - Tokens sent over HTTP can be intercepted

---

## 📝 Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Registration Flow                    │
└─────────────────────────────────────────────────────────────┘

Frontend (Angular)                    Backend (NestJS)
─────────────────                    ─────────────────

1. User fills form
   ↓
2. POST /api/auth/register
   {
     email: "user@example.com",
     password: "password123",        → 3. Validate input
     organizationName: "ACME Corp",    ↓
     role: "viewer"                   4. Check email uniqueness
   }                                    ↓
                                      5. Find/Create organization
                                        ↓
                                      6. Hash password (bcrypt)
                                        ↓
                                      7. Save user to database
                                        ↓
                                      8. Generate JWT token
                                        ↓
   ← { access_token: "eyJ..." }      9. Return token
     ↓
10. Store in localStorage
     ↓
11. Decode token
     ↓
12. Set currentUser
     ↓
13. Navigate to /dashboard


┌─────────────────────────────────────────────────────────────┐
│                       User Login Flow                        │
└─────────────────────────────────────────────────────────────┘

Frontend (Angular)                    Backend (NestJS)
─────────────────                    ─────────────────

1. User enters credentials
   ↓
2. POST /api/auth/login
   {
     email: "user@example.com",      → 3. Find user by email
     password: "password123"            ↓
   }                                   4. Compare password hash
                                        ↓
                                      5. Generate JWT token
                                        ↓
   ← { access_token: "eyJ..." }      6. Return token
     ↓
7. Store in localStorage
     ↓
8. Decode token
     ↓
9. Set currentUser
     ↓
10. Navigate to /dashboard


┌─────────────────────────────────────────────────────────────┐
│                  Protected API Request Flow                  │
└─────────────────────────────────────────────────────────────┘

Frontend (Angular)                    Backend (NestJS)
─────────────────                    ─────────────────

1. User requests data
   ↓
2. Auth Interceptor adds header
   Authorization: Bearer eyJ...      → 3. JWT Guard extracts token
   ↓                                    ↓
   GET /api/tasks                     4. Verify token signature
                                        ↓
                                      5. Check expiration
                                        ↓
                                      6. Decode payload
                                        ↓
                                      7. Attach user to request
                                        ↓
                                      8. Check permissions/roles
                                        ↓
   ← [ ...tasks... ]                 9. Return data
     ↓
10. Display to user
```

---

## 🛠️ Files Reference

### **Frontend Files**:
```
apps/dashboard/src/app/
├── core/
│   ├── services/
│   │   └── auth.service.ts           ← Auth logic, localStorage
│   ├── interceptors/
│   │   ├── auth.interceptor.ts       ← Adds JWT to headers
│   │   └── error.interceptor.ts      ← Handles 401 errors
│   └── guards/
│       ├── auth.guard.ts             ← Route protection
│       └── role.guard.ts             ← Role-based access
└── features/
    └── auth/
        ├── login/
        │   └── login.component.ts    ← Login form
        └── register/
            └── register.component.ts ← Registration form
```

### **Backend Files**:
```
apps/api/src/
├── auth/
│   ├── auth.service.ts               ← Registration, Login logic
│   ├── auth.controller.ts            ← /auth endpoints
│   ├── auth.module.ts                ← JWT configuration
│   ├── jwt.strategy.ts               ← JWT validation
│   ├── jwt-auth.guard.ts             ← Global auth guard
│   └── dto/
│       ├── register.dto.ts           ← Registration validation
│       └── login.dto.ts              ← Login validation
└── entities/
    ├── user.entity.ts                ← User database model
    └── organization.entity.ts        ← Organization model
```

---

## 📚 Summary

**Authentication Information is Stored**:

1. **Frontend**:
   - JWT Token: Browser LocalStorage (`access_token`)
   - User Info: Angular Service (in-memory)
   - Duration: Until logout or token expiration

2. **Backend**:
   - User Credentials: Database (passwords hashed)
   - JWT Secret: Environment variables (`.env`)
   - User Sessions: Stateless (JWT-based)

3. **In Transit**:
   - HTTP Headers: `Authorization: Bearer <token>`
   - Automatically added by interceptor
   - Validated on every request

**Key Security Points**:
- Passwords are never stored in plain text
- JWT tokens contain user info but can't be modified
- Tokens expire after 7 days
- Protected routes require valid JWT
- Role-based access control enforced
