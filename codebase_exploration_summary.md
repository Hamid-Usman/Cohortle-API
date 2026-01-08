# Cohortle API Codebase Exploration Summary

## Overview

The Cohortle API is a Node.js/Express-based REST API for managing educational cohorts, communities, and learning programs. The codebase follows a custom architecture pattern with a proprietary database SDK rather than traditional ORM usage.

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MySQL
- **ORM**: Sequelize v6.37.7 (used primarily for migrations, not runtime queries)

### Key Dependencies
- **Authentication**: `jsonwebtoken`, `jwks-rsa`, `bcryptjs`
- **Validation**: `node-input-validator`
- **File Storage**: `cloudinary`, `multer`
- **Email**: `nodemailer`
- **API Documentation**: `swagger-jsdoc`, `swagger-ui-express`, `redoc`
- **Development**: `nodemon`, `sequelize-cli`, `prettier`

---

## Architecture Patterns

### 1. Custom Database SDK Pattern

**Most Critical Finding**: The codebase uses a custom `BackendSDK` class instead of Sequelize models for database operations.

**Location**: `core/BackendSDK.js`

**Key Features**:
- Manual SQL query construction with parameterized binding
- Built-in SQL injection protection
- Automatic `created_at` and `updated_at` management
- Methods: `get()`, `insert()`, `update()`, `updateWhere()`, `delete()`, `deleteWhere()`, `rawQuery()`

**Why This Matters**: 
- Developers must use `BackendSDK` instead of Sequelize models
- Sequelize is only used for schema definition and migrations
- This is a non-standard pattern that requires documentation

### 2. Route Structure

**Pattern**: Each route file exports a function that accepts the Express `app` instance.

**Example Structure**:
```javascript
module.exports = function (app) {
  app.get("/v1/api/resource", [middleware], handler);
  return [];
};
```

**Route Registration** (in `app.js`):
```javascript
const authRoutes = require("./routes/auth");
authRoutes(app);
```

### 3. Middleware Architecture

Three primary middleware components:

1. **UrlMiddleware** (`middleware/UrlMiddleware.js`)
   - Logs request URLs
   - Captures IP addresses
   - Applied to all routes

2. **TokenMiddleware** (`middleware/TokenMiddleware.js`)
   - JWT authentication
   - Role-based access control
   - Populates `req.user_id`, `req.role`, `req.email`

3. **uploadMiddleware** (`middleware/uploadMiddleware.js`)
   - Handles file uploads via Cloudinary

---

## Directory Structure Analysis

```
Cohortle-API/
├── app.js                    # Main application entry (109 lines)
├── bin/www                   # Server startup script
├── config/                   # Configuration files
├── core/                     # Core infrastructure
│   ├── BackendSDK.js        # Custom database SDK (338 lines)
│   ├── DbConnection.js      # Database connection setup
│   └── MySqlAdapter.js      # MySQL adapter
├── middleware/               # Express middleware
│   ├── TokenMiddleware.js   # JWT authentication
│   ├── UrlMiddleware.js     # Logging and IP tracking
│   └── uploadMiddleware.js  # File upload handling
├── migrations/               # 26 database migrations
├── models/                   # Sequelize models (10 models)
│   ├── init-models.js       # Model initialization and associations
│   ├── users.js
│   ├── cohorts.js
│   ├── communities.js
│   ├── programmes.js
│   └── ... (6 more models)
├── routes/                   # API endpoints (11 route files)
│   ├── auth.js              # Authentication routes (437 lines)
│   ├── profile.js           # User profile routes (391 lines)
│   ├── cohort.js
│   ├── community.js
│   ├── programme.js
│   └── ... (6 more)
├── services/                 # Business logic services (6 services)
│   ├── JwtService.js        # JWT token management
│   ├── MailService.js       # Email sending
│   ├── PasswordService.js   # Password hashing/verification
│   ├── ValidationService.js # Input validation
│   ├── UploadService.js     # Cloudinary uploads
│   └── UtilService.js       # Utility functions
├── utils/                    # Utility functions
│   └── mappings.js          # Constants and enums
└── uploads/                  # Local file upload directory
```

---

## Key Components Deep Dive

### BackendSDK (`core/BackendSDK.js`)

**Purpose**: Centralized database interaction layer

**Key Methods**:
- `setTable(table)` - Set the target table
- `get(where, select, orderBy, direction, customWhere)` - SELECT queries
- `insert(payload)` - INSERT queries
- `update(payload, id)` - UPDATE by ID
- `updateWhere(payload, condition)` - UPDATE by condition
- `delete(payload, id)` - DELETE by ID
- `deleteWhere(payload)` - DELETE by condition
- `rawQuery(sql)` - Execute raw SQL (dangerous)

**Security Features**:
- SQL injection keyword detection
- Field name validation (regex-based)
- Parameterized query binding

### Services Layer

#### JwtService (`services/JwtService.js`)
- Token creation and verification
- Supports custom expiration times
- Uses environment-based secrets

#### ValidationService (`services/ValidationService.js`)
- Wrapper around `node-input-validator`
- Provides `validateObject()` method
- Returns consistent error format

#### PasswordService (`services/PasswordService.js`)
- Uses `bcryptjs` for hashing
- Methods: `hash()`, `compareHash()`

#### UploadService (`services/UploadService.js`)
- Cloudinary integration
- Configured for secure uploads
- Returns secure URLs

#### MailService (`services/MailService.js`)
- Nodemailer wrapper
- Email templates for verification and password reset
- Configurable SMTP settings

---

## Database Schema

### Core Tables (from models)
1. **users** - User accounts and profiles
2. **cohorts** - Learning cohorts
3. **cohort_members** - Cohort membership
4. **communities** - Community groups within cohorts
5. **programmes** - Programs within communities
6. **community_modules** - Learning modules
7. **module_lessons** - Individual lessons

### Relationships
- Users → Cohorts (as owner)
- Users → Cohort Members
- Cohorts → Communities
- Communities → Programmes
- Communities → Modules
- Modules → Lessons

---

## API Documentation

### Swagger/OpenAPI Setup
- **Version**: OpenAPI 3.0.3
- **UI Endpoints**: 
  - `/api-docs` - Swagger UI
  - `/docs` - Redoc
  - `/openapi.json` - OpenAPI spec
- **Security**: Bearer token authentication
- **Documentation**: JSDoc comments in route files

---

## Authentication Flow

### Registration (`/v1/api/auth/register-email`)
1. Validate email and password
2. Check for existing user
3. Hash password with bcryptjs
4. Create user with `INACTIVE` status
5. Create default preferences
6. Generate verification token
7. Send verification email (currently commented out)

### Login (`/v1/api/auth/login`)
1. Validate credentials
2. Verify password hash
3. Generate JWT with user data
4. Return token and user info

### Protected Routes
- Use `TokenMiddleware` with role requirements
- Token contains: `user_id`, `role`, `email`
- Middleware populates `req.user_id`

---

## Notable Findings

### Strengths
1. **Consistent patterns** across routes and services
2. **Comprehensive validation** on all inputs
3. **Good separation of concerns** (routes, services, core)
4. **API documentation** with Swagger
5. **Security-conscious** (password hashing, JWT, SQL injection protection)

### Areas of Concern
1. **Custom SDK** - Non-standard pattern, requires training
2. **Mixed ORM usage** - Sequelize models exist but aren't used at runtime
3. **Email functionality** - Commented out in registration flow
4. **Error messages** - Lowercase, inconsistent formatting ("something went wrong")
5. **Missing auth middleware** - Some routes in `auth.js` missing `TokenMiddleware` where expected

### Code Quality
- **Formatting**: Consistent, appears to use Prettier
- **Comments**: Minimal inline comments, heavy Swagger documentation
- **Error handling**: Consistent try/catch blocks
- **Naming**: Follows conventions (camelCase, snake_case appropriately)

---

## Development Workflow

### Running the Application
```bash
npm run dev  # Uses nodemon with .env file
```

### Database Migrations
```bash
npx sequelize-cli migration:generate --name migration-name
npx sequelize-cli db:migrate
```

### API Testing
- Swagger UI available at `http://localhost:3048/api-docs`
- Redoc available at `http://localhost:3048/docs`

---

## Recommendations for New Developers

1. **Start with `development_guidelines.md`** - Understand the patterns before coding
2. **Study `BackendSDK.js`** - This is the most critical component
3. **Review existing routes** - Follow established patterns exactly
4. **Use ValidationService** - Never skip input validation
5. **Test with Swagger** - Use the built-in API documentation for testing
6. **Ask before changing core** - `BackendSDK`, middleware, and services are critical

---

## Files Analyzed

During this exploration, I reviewed:
- `package.json` - Dependencies and scripts
- `app.js` - Application setup and routing
- `core/BackendSDK.js` - Database SDK implementation
- `core/DbConnection.js` - Database connection
- `models/init-models.js` - Model associations
- `routes/auth.js` - Authentication routes
- `routes/profile.js` - Profile management routes
- `services/` - All service files
- `middleware/` - All middleware files

---

## Conclusion

The Cohortle API is a well-structured Express application with a unique custom database SDK pattern. The codebase prioritizes security, validation, and consistency. New developers must understand the `BackendSDK` pattern to contribute effectively, as it deviates from standard Sequelize ORM usage.
