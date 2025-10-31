# Server Documentation

## Overview

This is an Express.js REST API server that provides authentication, user management, and Task Management System (TMS) functionality. The application uses JWT-based authentication with HTTP-only cookies, MySQL for data persistence, and follows a modular architecture with clear separation of concerns.

The Task Management System implements a Kanban-style workflow for managing projects, plans, and tasks with role-based permissions and audit trails.

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
-   Checks application-specific permissions for TMS workflows
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
-   Implements TMS workflow state machine
-   Generates task IDs and audit trails

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

-   `PORT` - Server port (default: 8080)
-   `JWT_SECRET` - Secret key for JWT signing
-   `JWT_EXPIRATION` - Token expiration time (default: 1d)
-   `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)
-   `NODE_ENV` - Environment mode
-   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database credentials
-   `EMAIL_USERNAME` - SMTP username for email notifications
-   `EMAIL_PASSWORD` - SMTP password for email notifications

---

### 3. Routes (routes.js)

**Authentication & User Management Endpoints:**

| Method | Endpoint       | Middleware                                                                     | Description              |
| ------ | -------------- | ------------------------------------------------------------------------------ | ------------------------ |
| POST   | `/auth/login`  | validateLogin                                                                  | User login               |
| POST   | `/auth/logout` | authenticateToken                                                              | User logout              |
| GET    | `/profile`     | authenticateToken                                                              | Get current user profile |
| PUT    | `/profile`     | authenticateToken, validateProfileUpdate                                       | Update user profile      |
| GET    | `/accounts`    | authenticateToken, requireUserGroup("admin")                                   | Get all accounts         |
| POST   | `/accounts`    | authenticateToken, requireUserGroup("admin"), validateAccountCreation          | Create new account       |
| PUT    | `/accounts`    | authenticateToken, requireUserGroup("admin", selfCheck), validateAccountUpdate | Update account           |
| GET    | `/user_groups` | authenticateToken                                                              | Get all user groups      |
| POST   | `/user_groups` | authenticateToken, requireUserGroup("admin"), validateGroupCreation            | Create user group        |

**Application Management Endpoints:**

| Method | Endpoint                 | Middleware                                                                       | Description            |
| ------ | ------------------------ | -------------------------------------------------------------------------------- | ---------------------- |
| POST   | `/applications`          | authenticateToken, requireUserGroup("project lead"), validateApplicationCreation | Create application     |
| GET    | `/applications`          | authenticateToken                                                                | Get all applications   |
| GET    | `/applications/:acronym` | authenticateToken                                                                | Get single application |
| PUT    | `/applications/:acronym` | authenticateToken, requireUserGroup("project lead"), validateApplicationUpdate   | Update application     |

**Plan Management Endpoints:**

| Method | Endpoint              | Middleware                              | Description      |
| ------ | --------------------- | --------------------------------------- | ---------------- |
| POST   | `/plans`              | authenticateToken, validatePlanCreation | Create plan      |
| GET    | `/plans/:app_acronym` | authenticateToken                       | Get plans by app |
| GET    | `/plan/:name`         | authenticateToken                       | Get single plan  |
| PUT    | `/plan/:name`         | authenticateToken                       | Update plan      |

**Task Management Endpoints:**

| Method | Endpoint              | Middleware                                                                       | Description                         |
| ------ | --------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| POST   | `/tasks`              | authenticateToken, validateTaskCreation, requirePermitGroup("App_permit_Create") | Create task (state: Open)           |
| GET    | `/tasks/:app_acronym` | authenticateToken                                                                | Get tasks by app (optional ?state=) |
| GET    | `/task/:task_id`      | authenticateToken                                                                | Get single task                     |
| POST   | `/tasks/promote`      | authenticateToken                                                                | Promote task to next state          |
| POST   | `/tasks/demote`       | authenticateToken                                                                | Demote task to previous state       |
| PUT    | `/tasks`              | authenticateToken                                                                | Update task plan                    |

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
-   Fetches user from database to verify account is active
-   Verifies user exists and groups are current
-   Attaches fresh user data to `req.user`
-   Returns 401 if token missing/expired/user not found, 403 if account deactivated

**Authorization Middleware:**

```javascript
requireUserGroup(groups, selfCheck);
```

-   Generalized user group validation middleware factory
-   `groups` - Single group or array of groups (OR logic)
-   `selfCheck` - Optional callback to check if user is accessing own resource
-   Examples:
    -   `requireUserGroup('admin')` - requires admin group
    -   `requireUserGroup(['admin', 'project lead'])` - requires admin OR project lead
    -   `requireUserGroup('admin', (req) => req.body.username === req.user.username)` - requires admin OR self
-   Returns 403 if user not in any allowed groups and not self

```javascript
requirePermitGroup(permitField);
```

-   Dynamic permission check for TMS workflows
-   Fetches application and checks user belongs to ANY of the required groups
-   Permission fields are JSON arrays allowing multiple groups per action
-   Used for state transitions (e.g., App_permit_Open, App_permit_Doing)
-   Returns 403 if user not in any of the permitted groups

**TMS Validation Middleware:**

-   `validateApplicationCreation` - Validates application fields
-   `validateApplicationUpdate` - Validates app permission updates
-   `validatePlanCreation` - Validates plan required fields
-   `validateTaskCreation` - Validates task required fields

---

### 5. Controllers (controllers.js)

**Workflow Pattern:**

1. Extract data from request (body, user, params)
2. Validate required fields
3. Call appropriate service function
4. Handle success/error responses
5. Set appropriate HTTP status codes

**User Management Controllers:**

-   `login` - Authenticates user and sets JWT cookie
-   `logout` - Clears authentication cookie
-   `getCurrentUser` - Returns authenticated user profile
-   `updateCurrentUser` - Updates user email/password
-   `getAccounts` - Lists all user accounts (admin only)
-   `createAccount` - Creates new user account (admin only)
-   `updateAccount` - Updates user account (admin or self)
-   `getUserGroups` - Lists all available groups
-   `createGroup` - Creates new user group

**Application Controllers:**

-   `createApplication` - Creates new project/application (admin only)
-   `getApplications` - Lists all applications
-   `getApplication` - Gets single application by acronym
-   `updateApplication` - Updates application details (admin only)

**Plan Controllers:**

-   `createPlan` - Creates new plan/MVP for an application
-   `getPlans` - Gets all plans for an application
-   `getPlan` - Gets single plan by name
-   `updatePlan` - Updates plan start/end dates

**Task Controllers:**

-   `createTask` - Creates task with auto-generated ID in "Open" state (Task_owner set to null)
-   `getTasks` - Gets tasks by application (with optional state filter)
-   `getTask` - Gets single task by ID
-   `promoteTask` - Moves task to next workflow state, sends email notification when promoted to "Done"
-   `demoteTask` - Moves task to previous workflow state
-   `updateTask` - Updates task plan assignment or adds notes (restricted to Open/Done states for plan changes)

---

### 6. Services (services.js)

**Business Logic Layer** - Handles core application logic and database operations.

**User Management Services:**

-   `loginUser(username, password)` - Validates credentials and generates JWT
-   `getUserByUsername(username)` - Fetches user profile
-   `getAllAccounts()` - Retrieves all user accounts
-   `createAccount(accountData)` - Creates new user with password hashing
-   `updateAccount(username, accountData)` - Updates user with protections
-   `updateUserProfile(username, profileData)` - Updates current user profile
-   `getAllUserGroups()` - Fetches available groups
-   `createGroup(groupName)` - Creates new user group
-   `checkGroup(userId, groupName)` - Checks if user belongs to group

**Application Services:**

-   `createApplication(appData)` - Creates application with permissions
-   `getAllApplications()` - Lists all applications
-   `getApplicationByAcronym(acronym)` - Gets single application
-   `updateApplication(acronym, appData)` - Updates application details

**Plan Services:**

-   `createPlan(planData)` - Creates plan linked to application
-   `getPlansByApp(appAcronym)` - Gets plans for an application
-   `getPlanByName(planName)` - Gets single plan
-   `updatePlan(planName, planData)` - Updates plan dates

**Task Services:**

-   `createTask(taskData, username)` - Creates task with auto ID and audit trail
-   `getTasksByApp(appAcronym)` - Gets all tasks for application
-   `getTasksByState(appAcronym, state)` - Gets tasks filtered by state
-   `getTaskById(taskId)` - Gets single task
-   `promoteTaskState(taskId, username, notes)` - Promotes task through workflow
-   `demoteTaskState(taskId, username, notes)` - Demotes task in workflow
-   `updateTaskPlan(taskId, planName, username)` - Assigns/changes task plan

**Helper Functions:**

-   `generateTaskId(appAcronym, connection)` - Auto-increments App_Rnumber and generates unique task ID (format: `APP_1`)
-   `appendAuditNote(currentNotes, username, state, note)` - Formats audit trail entry with timestamp

---

## Task Management System (TMS)

### Workflow State Machine

Tasks follow a defined workflow with state transitions:

```
Open → To-Do → Doing → Done → Closed
         ↑       ↕
         └───────┘
```

**State Transition Rules:**

-   **Promote (Forward):** Open → To-Do → Doing → Done → Closed
-   **Demote (Backward):** Doing ↔ To-Do, Done → Doing
-   Cannot demote from "Open", "To-Do", or "Closed"
-   Cannot promote from "Closed"

### Permission-Based Access Control

Each application configures which user groups can perform state transitions:

-   `App_permit_Create` - Who can create new tasks
-   `App_permit_Open` - Who can promote Open → To-Do AND who can change task plans
-   `App_permit_toDoList` - Who can promote To-Do → Doing
-   `App_permit_Doing` - Who can promote Doing → Done
-   `App_permit_Done` - Who can close tasks (Done → Closed) AND who receives email notifications

### Plan Management Rules

-   Plans can be assigned when creating a task (optional)
-   Plan must be assigned before releasing task from Open to To-Do
-   **Plan can only be changed when task is in Open or Done state**
-   Only users with `App_permit_Open` permission can change task plans
-   Cannot change plan once task is Closed

### Email Notifications

When a task is promoted to "Done" state:

-   System identifies all users with `App_permit_Done` permission
-   Sends email notification to all eligible users
-   Email includes task details (ID, name, application, owner)
-   Uses nodemailer with configured SMTP server
-   Email failures don't prevent task promotion (graceful handling)

### Task ID Generation

-   Format: `{App_Acronym}_{Running_Number}`
-   Example: `WEBAPP_1`, `WEBAPP_2`, `API_1`
-   Auto-incremented using `App_Rnumber` field
-   Generated during task creation (cannot be changed)

### Audit Trail

Every task maintains a complete audit history in `Task_notes`:

```
[username] [state] [2025-10-24T12:34:56.789Z]
User notes or state transition comment
==================================================
```

-   Append-only (read-only for users)
-   Captures: username, state, timestamp, notes
-   Automatically added on every state transition
-   Separator line for readability

### Task Ownership

-   `Task_creator` - User who created the task (never changes)
-   `Task_owner` - User currently working on the task (NOT "last touch" model)
    -   Set to `null` when task is created (Open state)
    -   Set to current user when "Taking Task" (To-Do → Doing transition)
    -   Set to `null` when "Dropping Task" (Doing → To-Do transition)
    -   Remains unchanged for all other state transitions

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
    - Generates JWT with username only
5. Controller sets HTTP-only cookie with JWT
6. Returns user data to client

### Protected Route Access:

1. Client makes request with cookie
2. `authenticateToken` middleware:
    - Extracts JWT from cookie
    - Verifies signature and expiration
    - Fetches user from database (verifies existence and active status)
    - Attaches fresh user data to `req.user`
3. Optional: Authorization middleware checks user roles/permissions
4. Controller processes request with authenticated user context

### Logout Process:

1. Client sends POST to `/api/auth/logout`
2. `authenticateToken` verifies token
3. `logout` controller clears cookie
4. Client removes local user state

---

## Database Schema

### User Management Tables:

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

### Task Management Tables:

**applications**
| Column | Type | Description |
|--------|------|-------------|
| App_Acronym | VARCHAR(50) | Primary key, unique application acronym |
| App_Description | TEXT | Application description |
| App_Rnumber | INT | Running number for task ID generation |
| App_startDate | DATE | Project start date |
| App_endDate | DATE | Project end date |
| App_permit_Create | JSON | Array of groups permitted to create tasks |
| App_permit_Open | JSON | Array of groups permitted to promote Open → To-Do |
| App_permit_toDoList | JSON | Array of groups permitted to promote To-Do → Doing |
| App_permit_Doing | JSON | Array of groups permitted to promote Doing → Done |
| App_permit_Done | JSON | Array of groups permitted to close tasks (Done → Closed) |

**plans**
| Column | Type | Description |
|--------|------|-------------|
| Plan_MVP_name | VARCHAR(255) | Primary key, unique plan name |
| Plan_startDate | DATE | Plan start date |
| Plan_endDate | DATE | Plan end date |
| Plan_app_Acronym | VARCHAR(50) | Foreign key to applications |

**tasks**
| Column | Type | Description |
|--------|------|-------------|
| Task_id | VARCHAR(100) | Primary key, format: APP_1 |
| Task_name | VARCHAR(255) | Unique task name |
| Task_description | TEXT | Task description |
| Task_notes | LONGTEXT | Audit trail (append-only) |
| Task_plan | VARCHAR(255) | Foreign key to plans (nullable) |
| Task_app_Acronym | VARCHAR(50) | Foreign key to applications |
| Task_state | ENUM | Open, To-Do, Doing, Done, Closed |
| Task_creator | VARCHAR(50) | User who created task (never null) |
| Task_owner | VARCHAR(50) | User currently working on task (nullable) |
| Task_createDate | DATETIME | Creation timestamp |

**Seed Data:**

-   Root admin account: username "admin", password **REDACTED**
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
-   401: Unauthorized (missing/expired token, user not found)
-   403: Forbidden (insufficient permissions, account deactivated)
-   404: Resource not found
-   500: Internal server error

---

## Security Features

**Password Security:**

-   Bcrypt hashing with configurable rounds
-   Strong password requirements enforced
-   Passwords never stored in plain text

**JWT Security:**

-   HTTP-only cookies prevent XSS attacks
-   Payload contains only username (groups fetched from DB)
-   Configurable expiration times
-   Secure flag in production mode
-   SameSite attribute for CSRF protection
-   Real-time validation against database

**Database Security:**

-   Parameterized queries prevent SQL injection
-   Transaction support ensures data integrity
-   Connection pooling for resource management
-   Foreign key constraints maintain referential integrity

**Root Admin Protection:**

-   Cannot disable root admin account
-   Cannot remove admin group from original admin
-   Special handling in update logic

**TMS Security:**

-   Application-level permissions for state transitions
-   Audit trail prevents data tampering
-   Task IDs are system-generated (read-only)
-   Permission checks before all state changes

---

## Running the Server

**Installation:**

```bash
npm install
```

**Environment Setup:**
Create `.env` file with:

```
PORT=8080
JWT_SECRET=your_secret_key
JWT_EXPIRATION=1d
BCRYPT_ROUNDS=10
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nodelogin
EMAIL_USERNAME=your_email@ethereal.email
EMAIL_PASSWORD=your_email_password
```

**Note:** For email notifications, the system uses Ethereal Email (testing SMTP) by default. For production, configure a real SMTP server (Gmail, SendGrid, AWS SES, etc.).

**Start Server:**

```bash
npm start        # Production
npm run dev      # Development (with nodemon)
```

**Initialize Database:**
Execute `database/init.sql` in MySQL to create tables and seed data:

```bash
mysql -u root -p nodelogin < database/init.sql
```

---

## API Request/Response Examples

### User Management

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

**Create Account:**

```bash
POST /api/accounts
{
    "username": "jane_doe",
    "email": "jane@example.com",
    "password": "Test@123",
    "userGroups": ["dev team"],
    "isActive": 1
}
```

### Application Management

**Create Application:**

```bash
POST /api/applications
{
    "App_Acronym": "WEBAPP",
    "App_Description": "Web Application Project",
    "App_startDate": "2025-01-01",
    "App_endDate": "2025-12-31",
    "App_permit_Create": ["dev team", "project lead"],
    "App_permit_Open": ["project lead"],
    "App_permit_toDoList": ["project manager"],
    "App_permit_Doing": ["dev team"],
    "App_permit_Done": ["project lead", "project manager"]
}
```

**Response:**

```json
{
    "success": true,
    "message": "Application created successfully",
    "data": {
        "App_Acronym": "WEBAPP",
        "App_Description": "Web Application Project",
        "App_startDate": "2025-01-01",
        "App_endDate": "2025-12-31",
        "App_permit_Create": ["dev team", "project lead"],
        "App_permit_Open": ["project lead"],
        "App_permit_toDoList": ["project manager"],
        "App_permit_Doing": ["dev team"],
        "App_permit_Done": ["project lead", "project manager"]
    }
}
```

### Plan Management

**Create Plan:**

```bash
POST /api/plans
{
    "Plan_MVP_name": "MVP Sprint 1",
    "Plan_startDate": "2025-01-01",
    "Plan_endDate": "2025-01-31",
    "Plan_app_Acronym": "WEBAPP"
}
```

### Task Management

**Create Task:**

```bash
POST /api/tasks
{
    "Task_name": "Implement login feature",
    "Task_description": "Build JWT authentication",
    "Task_app_Acronym": "WEBAPP",
    "Task_plan": "MVP Sprint 1",
    "notes": "Starting development",
    "app_acronym": "WEBAPP"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Task created successfully",
    "data": {
        "Task_id": "WEBAPP_1",
        "Task_name": "Implement login feature",
        "Task_description": "Build JWT authentication",
        "Task_app_Acronym": "WEBAPP",
        "Task_state": "Open",
        "Task_creator": "john_doe",
        "Task_owner": "john_doe"
    }
}
```

**Promote Task:**

```bash
POST /api/tasks/promote
{
    "task_id": "WEBAPP_1",
    "notes": "Moving to development",
    "app_acronym": "WEBAPP"
}
```

**Get Tasks by State:**

```bash
GET /api/tasks/WEBAPP?state=Doing
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
2. **Security First:** JWT in HTTP-only cookies, password hashing, SQL injection prevention, real-time token validation
3. **Error Handling:** Consistent error format, proper HTTP status codes
4. **Transaction Support:** ACID compliance for data integrity
5. **Middleware Pattern:** Reusable validation and authentication logic
6. **ES Modules:** Modern JavaScript module system
7. **Environment Configuration:** Flexible deployment with .env files
8. **Audit Trails:** Complete history of all task changes
9. **Permission-Based Workflow:** Configurable access control per application
10. **Auto-Generated IDs:** System-controlled task identification
