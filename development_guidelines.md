# Cohortle API Development Guidelines

This document outlines the architectural patterns, coding conventions, and best practices for the Cohortle API codebase. All contributors must adhere to these rules to maintain consistency and stability.

---

## 1. Architecture Overview

- **Runtime**: Node.js
- **Framework**: Express.js (v5.x)
- **Database**: MySQL (accessed via custom `BackendSDK`)
- **ORM**: Sequelize (Primary usage is for migrations and schema definition; runtime queries use `BackendSDK`)
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI 3.0.3
- **File Uploads**: Cloudinary (via `UploadService`)
- **Email**: Nodemailer (via `MailService`)

---

## 2. Directory Structure

```
Cohortle-API/
├── routes/          # API endpoint definitions
├── services/        # Business logic and utility classes
├── core/            # Core infrastructure (BackendSDK, DbConnection)
├── middleware/      # Express middleware (Auth, Logging, Upload)
├── models/          # Sequelize models (schema reference)
├── migrations/      # Database schema evolution scripts
├── utils/           # Utility functions and mappings
├── uploads/         # Local file upload directory
└── app.js           # Main application entry point
```

---

## 3. Database Interaction Rules (CRITICAL)

> **⚠️ IMPORTANT**: Do NOT use Sequelize Models (e.g., `User.create()`, `User.findOne()`) directly in your route handlers or controllers for runtime operations.

**Standard**: Use the `BackendSDK` class located in `core/BackendSDK.js`.

### Usage Pattern

```javascript
const BackendSDK = require("../core/BackendSDK");

// Initialize SDK
const sdk = new BackendSDK();
sdk.setTable("users"); // Manually set the table name (snake_case)

// READ
const users = await sdk.get({ email: "user@example.com" }); // Returns array
const user = users[0]; // Get first result

// INSERT
const newId = await sdk.insert({
  email: "user@example.com",
  first_name: "John",
  // created_at and updated_at are managed automatically
});

// UPDATE (by ID)
await sdk.update({ status: "active" }, userId);

// UPDATE (by condition)
await sdk.updateWhere({ status: "active" }, { email: "user@example.com" });

// DELETE
await sdk.delete({}, userId);

// DELETE (by condition)
await sdk.deleteWhere({ email: "user@example.com" });

// RAW QUERY (use with extreme caution - SQL injection risk)
const results = await sdk.rawQuery("SELECT * FROM users WHERE id = 1");
```

### Important Notes

- `BackendSDK` manually constructs SQL queries with parameterized binding
- Always call `sdk.setTable()` before performing operations
- `get()` always returns an array (empty if no results)
- `insert()` returns the new record's ID
- `created_at` and `updated_at` are automatically managed

---

## 4. Routing and Middleware

**Rule**: All route files must export a function that takes the `app` instance.

### Standard Route Definition

```javascript
const BackendSDK = require("../core/BackendSDK");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/resource:
   *   get:
   *     summary: Get resource
   *     tags: [Resource]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Success
   */
  app.get(
    "/v1/api/resource",
    [
      UrlMiddleware, // Logging/IP tracking
      TokenMiddleware({ role: "learner|convener" }) // Auth & RBAC
    ],
    async (req, res) => {
      try {
        // Handler logic
        const sdk = new BackendSDK();
        sdk.setTable("resources");
        const resources = await sdk.get({ user_id: req.user_id });
        
        return res.status(200).json({
          error: false,
          message: "Resources fetched successfully",
          data: resources
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: "something went wrong" });
      }
    }
  );
  
  return []; // Always return empty array at end
};
```

### Middleware Usage

#### UrlMiddleware
- **Purpose**: Logs request URL and captures IP address
- **Usage**: Apply to ALL routes (public and protected)
- **Populates**: `req.ipAddr`

#### TokenMiddleware
- **Purpose**: JWT authentication and role-based access control
- **Configuration**:
  - `{ role: "learner|convener" }` - Requires one of these roles
  - `{ allowNull: true }` - Optional authentication
- **Populates**: `req.user_id`, `req.role`, `req.email`
- **Usage**: Apply to protected routes only

#### uploadMiddleware
- **Purpose**: Handle file uploads via Cloudinary
- **Usage**: For routes accepting file uploads

---

## 5. Validation

**Rule**: Input validation must occur at the beginning of the route handler.

**Standard**: Use `ValidationService` (wrapper around `node-input-validator`).

### Validation Pattern

```javascript
const ValidationService = require("../services/ValidationService");

const { email, password, role } = req.body;
const validationResult = await ValidationService.validateObject(
  {
    email: "required|email",
    password: "required|string",
    role: "required|in:convener,learner"
  },
  { email, password, role }
);

if (validationResult.error) {
  return res.status(400).json(validationResult);
}
```

### Common Validation Rules

- `required` - Field must be present
- `email` - Valid email format
- `string` - Must be a string
- `in:value1,value2` - Must be one of the specified values
- Combine with `|` (e.g., `required|email`)

---

## 6. Response Format

**Standard**: All API responses must follow a consistent JSON structure.

### Success Response

```json
{
  "error": false,
  "message": "Operation successful",
  "data": { ... } // Optional
}
```

### Error Response

```json
{
  "error": true,
  "message": "Error description"
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (Validation failure)
- `401`: Unauthorized (Auth failure)
- `404`: Not Found
- `500`: Internal Server Error

---

## 7. Authentication & JWT

### Token Creation

```javascript
const JwtService = require("../services/JwtService");

const token = JwtService.createAccessToken(
  {
    user_id: user.id,
    role: user.role,
    email: user.email
  },
  24 * 60 * 60 * 1000, // 24 hours in milliseconds
  process.env.JWT_SECRET
);
```

### Token Verification

```javascript
const payload = JwtService.verifyAccessToken(
  token,
  process.env.JWT_SECRET
);

if (!payload) {
  return res.status(401).json({ error: true, message: "Invalid token" });
}
```

---

## 8. Password Handling

**Rule**: Never store plain text passwords. Always use `PasswordService`.

```javascript
const PasswordService = require("../services/PasswordService");

// Hash password
const hashedPassword = await PasswordService.hash(password);

// Verify password
const isValid = await PasswordService.compareHash(
  plainPassword,
  hashedPassword
);
```

---

## 9. File Uploads

**Standard**: Use `UploadService` for Cloudinary uploads.

```javascript
const UploadService = require("../services/UploadService");

const uploadService = new UploadService();
const imageUrl = await uploadService.uploadFile(filePath);
```

---

## 10. Naming Conventions

- **Variables/Functions**: `camelCase` (e.g., `userId`, `getUserProfile`)
- **Database Tables**: `snake_case` (e.g., `users`, `cohort_members`)
- **Database Columns**: `snake_case` (e.g., `user_id`, `created_at`, `first_name`)
- **API Routes**: `kebab-case` (e.g., `/api/auth/register-email`, `/api/profile/set-role`)
- **File Names**: 
  - Classes/Services: `PascalCase` (e.g., `BackendSDK.js`, `JwtService.js`)
  - Routes: `camelCase` (e.g., `auth.js`, `profile.js`)
  - Middleware: `PascalCase` (e.g., `TokenMiddleware.js`, `UrlMiddleware.js`)

---

## 11. Error Handling

**Rule**: Wrap all route logic in `try/catch` blocks. Log errors and return clean JSON responses.

```javascript
app.post("/v1/api/resource", [UrlMiddleware, TokenMiddleware()], async (req, res) => {
  try {
    // Route logic here
    
    return res.status(200).json({
      error: false,
      message: "Success"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: true, 
      message: "something went wrong" 
    });
  }
});
```

### Special Error Handling

For Sequelize unique constraint violations:

```javascript
const { UniqueConstraintError } = require("sequelize");

try {
  // Logic
} catch (err) {
  if (err instanceof UniqueConstraintError && err.errors[0].path === "email") {
    return res.status(400).json({
      error: true,
      message: "Email already in use"
    });
  }
  console.error(err);
  res.status(500).json({ error: true, message: "something went wrong" });
}
```

---

## 12. Swagger Documentation

**Rule**: Every route must have Swagger documentation.

```javascript
/**
 * @swagger
 * /v1/api/resource:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resource]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Resource
 *     responses:
 *       200:
 *         description: Resource created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
```

---

## 13. Constants and Mappings

**Rule**: Use constants from `utils/mappings.js` for status values.

```javascript
const { USER_STATUSES } = require("../utils/mappings");

await sdk.update({ status: USER_STATUSES.INACTIVE }, userId);
```

---

## 14. Code Quality Rules

1. **Never break the codebase** - Test thoroughly before committing
2. **Ask questions if unclear** - Don't code blindly
3. **Discuss rationale before implementing** - Explain your approach
4. **Get permission before editing files** - Especially critical files
5. **Use proper context** - Understand the existing patterns before adding new code

---

## 15. Common Patterns

### Creating a New Route File

1. Create file in `routes/` directory
2. Export function that accepts `app`
3. Import in `app.js`
4. Call the function: `require("./routes/myroute")(app);`

### Creating a New Service

1. Create class in `services/` directory
2. Export the class
3. Import where needed
4. Use static methods or instantiate as needed

### Creating a New Migration

```bash
npx sequelize-cli migration:generate --name create-table-name
```

---

## 16. Environment Variables

Required environment variables (stored in `.env`):

- `PORT` - Server port
- `DB_HOST` - Database host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend application URL
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` - Email configuration

---

## Summary

This codebase uses a **custom SDK pattern** for database operations rather than traditional ORM methods. Always use `BackendSDK` for database interactions, follow the established middleware patterns, validate all inputs, and maintain consistent error handling and response formats.
