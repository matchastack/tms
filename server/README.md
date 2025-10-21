# Server Documentation

## Overview

This is an Express.js REST API server that provides authentication and user management functionality. The application uses JWT-based authentication with HTTP-only cookies, MySQL for data persistence, and follows a modular architecture with clear separation of concerns.

**Tech Stack:**

-   Node.js with Express.js
-   MySQL (mysql2 with Promises)
-   JWT for authentication
-   bcryptjs for password hashing
-   ES Modules

---

## Project Structure

```
server/
├── server.js                    # Entry point
├── package.json
├── src/
│   ├── app.js                   # Express app configuration
│   ├── routes.js                # Route definitions
│   ├── controllers.js           # Request handlers
│   ├── services.js              # Business logic layer
│   ├── validations.js           # Middleware for validation/auth
│   └── config/
│       ├── config.js            # Environment configuration
│       └── database.js          # Database connection & utilities
└── database/
    └── init.sql                 # Database schema & seed data
```

---

## Architecture & Data Flow

### Layer Architecture

**1. Entry Point (server.js)**

-   Initializes the Express server
-   Loads environment variables
-   Starts listening on configured port

**2. Application Layer (app.js)**

-   Configures Express middleware (CORS, JSON parsing, cookies)
-   Registers routes under `/api` prefix
-   Provides health check endpoint

**3. Route Layer (routes.js)**

-   Defines API endpoints and HTTP methods
-   Chains validation middleware before controllers
-   Maps routes to controller functions

**4. Validation Layer (validations.js)**

-   Authenticates JWT tokens from cookies
-   Validates request data (passwords, required fields)
-   Enforces role-based access control (RBAC)
-   Returns appropriate error responses

**5. Controller Layer (controllers.js)**

-   Handles HTTP request/response
-   Extracts and validates request data
-   Calls service layer functions
-   Formats success/error responses
-   Manages HTTP status codes

**6. Service Layer (services.js)**

-   Contains core business logic
-   Interacts with database through queries
-   Handles password hashing and JWT generation
-   Performs data validation and transformations
-   Manages database transactions

**7. Database Layer (config/database.js)**

-   Manages MySQL connection pool
-   Provides query execution utilities
-   Handles database transactions with rollback support

---

## Detailed Component Documentation

### 1. Database Configuration (config/database.js)

**Purpose:** Centralizes database connection management and query execution.

**Key Functions:**

```javascript
query(sql, params);
```

-   Executes parameterized SQL queries
-   Returns query results as array
-   Automatically handles connection pooling

```javascript
withTransaction(callback);
```

-   Executes multiple queries in a transaction
-   Automatically commits on success
-   Automatically rolls back on error
-   Ensures connection cleanup

**Connection Pool Settings:**

-   Max connections: 10
-   Waits for available connections
-   Unlimited queue length

---

### 2. Configuration (config/config.js)

**Environment Variables:**

-   `PORT` - Server port (default: 5000)
-   `JWT_SECRET` - Secret key for JWT signing
-   `JWT_EXPIRATION` - Token expiration time (default: 1d)
-   `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)
-   `NODE_ENV` - Environment mode
-   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database credentials

---

### 3. Routes (routes.js)

**API Endpoints:**

| Method | Endpoint       | Middleware                                                   | Description              |
| ------ | -------------- | ------------------------------------------------------------ | ------------------------ |
| POST   | `/auth/login`  | validateLogin                                                | User login               |
| POST   | `/auth/logout` | authenticateToken                                            | User logout              |
| GET    | `/profile`     | authenticateToken                                            | Get current user profile |
| GET    | `/accounts`    | authenticateToken, requireAdmin                              | Get all accounts         |
| POST   | `/accounts`    | authenticateToken, requireAdmin, validateAccountCreation     | Create new account       |
| PUT    | `/accounts`    | authenticateToken, requireSelfOrAdmin, validateAccountUpdate | Update account           |
| GET    | `/user_groups` | authenticateToken, requireAdmin                              | Get all user groups      |
| POST   | `/user_groups` | authenticateToken, requireAdmin                              | Create user group        |

**Middleware Chain Pattern:**
Routes apply middleware in sequence: validation → authentication → authorization → controller

---

### 4. Validations (validations.js)

**Password Validation Rules:**

-   Length: 8-10 characters
-   Must contain at least one letter
-   Must contain at least one number
-   Must contain at least one special character

**Authentication Middleware:**

```javascript
authenticateToken(req, res, next);
```

-   Reads JWT from `accessToken` cookie
-   Verifies token signature and expiration
-   Attaches decoded user data to `req.user`
-   Returns 401 if token missing/expired, 403 if invalid

**Authorization Middleware:**

```javascript
requireAdmin(req, res, next);
```

-   Checks if user has "admin" group
-   Returns 403 if user is not admin

```javascript
requireSelfOrAdmin(req, res, next);
```

-   Allows access if user is admin OR modifying their own account
-   Returns 403 otherwise

```javascript
requireRole(...allowedRoles);
```

-   Flexible role-based access control
-   Checks if user belongs to any of the allowed roles

---

### 5. Controllers (controllers.js)

**Workflow Pattern:**

1. Extract data from request (body, user, params)
2. Validate required fields
3. Call appropriate service function
4. Handle success/error responses
5. Set appropriate HTTP status codes

**Key Controllers:**

**`login(req, res, next)`**

-   Validates username and password presence
-   Calls `loginUser` service
-   Sets HTTP-only cookie with JWT token
-   Returns user data and success message

**`logout(req, res)`**

-   Clears the `accessToken` cookie
-   Returns success message

**`getCurrentUser(req, res)`**

-   Retrieves authenticated user's profile
-   Returns username, email, and groups

**`createAccount(req, res, next)`**

-   Validates required fields (username, email, password)
-   Creates new user account via service
-   Returns 201 with created account data

**`updateAccount(req, res, next)`**

-   Prevents removing admin privileges from root admin
-   Updates account details via service
-   Supports optional password change
-   Returns updated account data

---

### 6. Services (services.js)

**Business Logic Layer** - Handles core application logic and database operations.

**Key Functions:**

**`loginUser(username, password)`**

-   Validates user exists and is active
-   Compares password hash
-   Generates JWT access token
-   Returns token and user data

**`getUserByUsername(username)`**

-   Fetches user profile by username
-   Returns user without password

**`getAllAccounts()`**

-   Retrieves all user accounts
-   Returns array of account objects

**`createAccount(accountData)`**

-   Uses transaction for data integrity
-   Checks for duplicate username/email
-   Hashes password with bcrypt
-   Inserts new account into database
-   Returns created account data

**`updateAccount(username, accountData)`**

-   Uses transaction for data integrity
-   Protects root admin account (cannot disable or remove admin role)
-   Optionally updates password (re-hashes)
-   Updates account fields
-   Returns updated account data

**`getAllUserGroups()`**

-   Fetches all available user groups
-   Returns array of group names

**`createGroup(groupName)`**

-   Uses transaction
-   Checks for duplicate group names
-   Creates new user group
-   Returns created group

---

## Authentication Flow

### Login Process:

1. Client sends POST to `/api/auth/login` with username/password
2. `validateLogin` middleware validates request format
3. `login` controller extracts credentials
4. `loginUser` service:
    - Queries database for user
    - Checks if account is active
    - Compares password hash with bcrypt
    - Generates JWT with user data
5. Controller sets HTTP-only cookie with JWT
6. Returns user data to client

### Protected Route Access:

1. Client makes request with cookie
2. `authenticateToken` middleware:
    - Extracts JWT from cookie
    - Verifies signature and expiration
    - Attaches decoded user to `req.user`
3. Optional: Authorization middleware checks user roles
4. Controller processes request with authenticated user context

### Logout Process:

1. Client sends POST to `/api/auth/logout`
2. `authenticateToken` verifies token
3. `logout` controller clears cookie
4. Client removes local user state

---

## Database Schema

### Tables:

**accounts**
| Column | Type | Description |
|--------|------|-------------|
| username | VARCHAR(50) | Primary key, unique username |
| password | VARCHAR(255) | Bcrypt hashed password |
| email | VARCHAR(100) | User email address |
| userGroups | JSON | Array of group names |
| isActive | TINYINT(1) | Account status (0/1) |

**user_groups**
| Column | Type | Description |
|--------|------|-------------|
| group_name | VARCHAR(50) | Unique group identifier |

**Default Data:**

-   Root admin account: username "admin"
-   Default groups: "admin", "project lead", "project manager", "dev team"

---

## Error Handling

**Error Response Format:**

```json
{
    "success": false,
    "message": "Error description",
    "errors": ["Detailed error 1", "Detailed error 2"]
}
```

**Common HTTP Status Codes:**

-   200: Success
-   201: Resource created
-   400: Bad request (validation errors)
-   401: Unauthorized (missing/expired token)
-   403: Forbidden (insufficient permissions)
-   500: Internal server error

---

## Security Features

**Password Security:**

-   Bcrypt hashing with configurable rounds
-   Strong password requirements enforced

**JWT Security:**

-   HTTP-only cookies prevent XSS attacks
-   Configurable expiration times
-   Secure flag in production mode
-   SameSite attribute for CSRF protection

**Database Security:**

-   Parameterized queries prevent SQL injection
-   Transaction support ensures data integrity
-   Connection pooling for resource management

**Root Admin Protection:**

-   Cannot disable root admin account
-   Cannot remove admin role from root admin
-   Special handling in update logic

---

## Running the Server

**Installation:**

```bash
npm install
```

**Environment Setup:**
Create `.env` file with:

```
PORT=5000
JWT_SECRET=your_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nodelogin
```

**Start Server:**

```bash
npm start        # Production
npm run dev      # Development (with nodemon)
```

**Initialize Database:**
Execute `database/init.sql` in MySQL to create tables and seed data.

---

## API Response Examples

**Successful Login:**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "accessToken": "eyJhbGc...",
        "user": {
            "username": "john_doe",
            "email": "john@example.com",
            "groups": ["dev team"],
            "isActive": 1
        }
    }
}
```

**Validation Error:**

```json
{
    "success": false,
    "message": "Validation failed: Password must be 8-10 characters",
    "errors": ["Password must be 8-10 characters"]
}
```

---

## Best Practices Implemented

1. **Separation of Concerns:** Clear layer separation (routes → controllers → services → database)
2. **Security First:** JWT in HTTP-only cookies, password hashing, SQL injection prevention
3. **Error Handling:** Consistent error format, proper HTTP status codes
4. **Transaction Support:** ACID compliance for data integrity
5. **Middleware Pattern:** Reusable validation and authentication logic
6. **ES Modules:** Modern JavaScript module system
7. **Environment Configuration:** Flexible deployment with .env files
