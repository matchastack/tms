# Task Management System (TMS)

A full-stack task management application with role-based access control, Kanban-style workflow, and multi-project support. Built with React, Node.js/Express, and MySQL.

## Features

### User Management

-   JWT-based authentication with HTTP-only cookies
-   Role-based access control (RBAC) via user groups
-   User profile management
-   Admin panel for account management

### Application Management

-   Create and manage multiple applications/projects
-   Configure granular permissions per application
-   Track task counts and project timelines
-   Application-specific Kanban workflows

### Task Management

-   5-state Kanban workflow: **Open → To-Do → Doing → Done → Closed**
-   Permission-based state transitions
-   Plan assignment and tracking
-   Append-only audit trail with automatic timestamping
-   Email notifications for task reviews
-   Unified Kanban board showing tasks across all applications

### Plan Management

-   Create sprint/release plans per application
-   Date range validation against application timeline
-   Link tasks to plans for better organization

## Tech Stack

### Frontend

-   **React 19** - UI library
-   **Vite** - Build tool and dev server
-   **React Router** - Client-side routing
-   **Tailwind CSS 4** - Utility-first styling
-   **Axios** - HTTP client

### Backend

-   **Node.js** - Runtime environment
-   **Express 4** - Web framework
-   **JWT** - Authentication tokens
-   **Bcrypt** - Password hashing
-   **Nodemailer** - Email notifications

### Database

-   **MySQL 8+** - Relational database
-   Connection pooling with mysql2
-   Parameterized queries for SQL injection prevention

## Prerequisites

-   **Node.js** 18+ and npm
-   **MySQL** 8.0+
-   **Git**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tms
```

### 2. Database Setup

Create the database and seed initial data:

```bash
mysql -u root -p < database/init.sql
```

This creates:

-   Database schema (`nodelogin`)
-   Default admin account (username: `admin`, email: `admin@m.com`)
-   Sample user groups (admin, project lead, project manager, dev team)
-   3 sample applications with plans and tasks

### 3. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=8080
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=1d
BCRYPT_ROUNDS=10
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nodelogin
EMAIL_USERNAME=your_email@ethereal.email
EMAIL_PASSWORD=your_email_password
```

### 4. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:

```env
API_URL=http://localhost:8080/api
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

Server runs on http://localhost:8080 (or port specified in .env)

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

Client runs on http://localhost:3000

### Production Mode

**Backend:**

```bash
cd server
npm start
```

**Frontend:**

```bash
cd client
npm run build
npm run preview
```

## Default Login Credentials

After running the database initialization:

-   **Username:** admin
-   **Email:** admin@m.com
-   **Password:** (Set during database initialization)

## Project Structure

```
tms/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Root component with routing
│   │   ├── AuthContext.jsx # Global authentication state
│   │   ├── ProtectedRoute.jsx # Route guard with RBAC
│   │   ├── Header.jsx     # Navigation component
│   │   ├── LoginPage.jsx  # Authentication page
│   │   ├── ProfilePage.jsx # User profile management
│   │   ├── UsersManagementPage.jsx # Admin user management
│   │   ├── KanbanBoardPage.jsx # Unified task board (default home)
│   │   ├── AppPage.jsx    # Application management
│   │   ├── TaskModal.jsx  # Task creation/editing
│   │   ├── PlanModal.jsx  # Plan creation/editing
│   │   ├── TaskCard.jsx   # Kanban task card
│   │   ├── MultiSelect.jsx # Reusable multi-select component
│   │   └── main.jsx       # React entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── src/
│   │   ├── app.js         # Express app configuration
│   │   ├── routes.js      # API endpoint definitions
│   │   ├── validations.js # Auth & validation middleware
│   │   ├── controllers.js # Request handlers
│   │   ├── services.js    # Business logic layer
│   │   └── config/
│   │       └── database.js # MySQL connection pool
│   ├── server.js          # Server bootstrap
│   └── package.json
├── database/
│   └── init.sql           # Database schema and seed data
├── CLAUDE.md              # AI assistant instructions
└── README.md              # This file
```

## Key Features in Detail

### Permission System

Each application has 5 permission fields (JSON arrays of user groups):

1. **App_permit_Create** - Create new tasks
2. **App_permit_Open** - Release tasks (Open → To-Do) and change plans
3. **App_permit_toDoList** - Take tasks (To-Do → Doing)
4. **App_permit_Doing** - Submit for review (Doing → Done) or drop tasks (Doing → To-Do)
5. **App_permit_Done** - Approve tasks (Done → Closed) or reject (Done → Doing)

Users can perform actions if they belong to **any** of the groups in the permission array.

### Task Workflow

**Promotion Flow:**

```
Create Task → [Open] → Release → [To-Do] → Take → [Doing]
          → Submit Review → [Done] → Approve → [Closed]
```

**Demotion Flow:**

```
[Doing] → Drop → [To-Do]
[Done] → Reject → [Doing]
```

**Business Rules:**

-   Tasks start in **Open** state with no owner
-   **Task_owner** is set only when "Taking Task" (To-Do → Doing)
-   Plans can only be changed in **Open** or **Done** states
-   Plans are required before releasing from Open to To-Do
-   Email sent to `App_permit_Done` group when task reaches Done state
-   All state transitions append audit entries to Task_notes
-   Closed tasks are read-only

### Security Features

-   JWT tokens in HTTP-only cookies (prevents XSS)
-   Bcrypt password hashing (configurable rounds)
-   Parameterized SQL queries (prevents SQL injection)
-   CORS configured for localhost only
-   Transaction support with pessimistic locking
-   Race condition prevention with optimistic validation
-   Root admin protection (cannot be disabled or lose admin role)

## API Endpoints

### Authentication

-   `POST /api/auth/login` - User login
-   `POST /api/auth/logout` - User logout

### User Management

-   `GET /api/profile` - Get current user profile
-   `PUT /api/profile` - Update current user profile
-   `GET /api/accounts` - Get all accounts (admin only)
-   `POST /api/accounts` - Create account (admin only)
-   `PUT /api/accounts` - Update account

### Applications

-   `GET /api/applications` - Get all applications
-   `GET /api/applications/:acronym` - Get specific application
-   `POST /api/applications` - Create application (project lead + admin)
-   `PUT /api/applications/:acronym` - Update application (project lead + admin)

### Plans

-   `GET /api/plans/:app_acronym` - Get plans for application
-   `POST /api/plans` - Create plan
-   `PUT /api/plan/:name` - Update plan

### Tasks

-   `GET /api/tasks/:app_acronym` - Get tasks for application
-   `GET /api/task/:task_id` - Get single task
-   `POST /api/tasks` - Create task
-   `POST /api/tasks/promote` - Promote task to next state
-   `POST /api/tasks/demote` - Demote task to previous state
-   `PUT /api/tasks` - Update task plan

## Development

### Code Quality

The project uses ESLint for code quality. Run linting:

```bash
cd client
npm run lint
```

### Database Migrations

To reset the database:

```bash
mysql -u root -p nodelogin < database/init.sql
```

**Warning:** This will delete all existing data.

### Email Testing

The default configuration uses [Ethereal Email](https://ethereal.email/) for testing. Create a free account and update `EMAIL_USERNAME` and `EMAIL_PASSWORD` in server `.env`.

For production, configure a real SMTP provider (Gmail, SendGrid, AWS SES, etc.).

## Deployment

### Production Checklist

1. Update `API_URL` in client `.env` to production API URL
2. Set `NODE_ENV=production` in server `.env`
3. Use strong `JWT_SECRET` (at least 32 random characters)
4. Use strong database password
5. Increase `BCRYPT_ROUNDS` if desired (10-12 recommended)
6. Enable HTTPS for secure cookie transmission
7. Update CORS settings in `server/src/app.js` for production domain
8. Configure production SMTP server for email notifications
9. Set up database backups
10. Update Task_owner column to allow NULL:
    ```sql
    ALTER TABLE tasks MODIFY COLUMN Task_owner VARCHAR(50) NULL;
    ```

### Build Frontend

```bash
cd client
npm run build
```

The `dist/` folder contains the production-ready static files.

## License

[Specify your license here]

## Contributing

[Add contribution guidelines here]

## Support

For issues or questions, please open an issue in the repository.
