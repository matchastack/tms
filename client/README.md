# Client Documentation

## Overview

This is a React 19 single-page application (SPA) that provides a modern user interface for the Task Management System. The application features JWT authentication with HTTP-only cookies, role-based access control, and a complete Kanban-style task management workflow with permission-based state transitions.

**Tech Stack:**

-   React 19.1.1
-   React Router DOM 7.9.3
-   Axios 1.12.2
-   Tailwind CSS 4.1.14
-   Vite 7.1.7 (build tool)

---

## Project Structure

```
client/
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Main app component with routing
    ├── index.css                # Global styles
    │
    ├── AuthContext.jsx          # Authentication context provider
    ├── ProtectedRoute.jsx       # Route protection component
    ├── Header.jsx               # Navigation header component
    │
    ├── LoginPage.jsx            # Login page
    ├── ProfilePage.jsx          # User profile management
    ├── UsersManagementPage.jsx  # Admin user management
    │
    ├── AppPage.jsx              # Applications management with inline editing
    │
    ├── KanbanBoardPage.jsx      # Unified Kanban board (all tasks)
    ├── TaskCard.jsx             # Task card component
    ├── TaskModal.jsx            # Create/view/edit task modal
    ├── PlanModal.jsx            # Create/edit plan modal
    │
    └── MultiSelect.jsx          # Multi-select dropdown component
```

---

## Architecture & Application Flow

### Component Hierarchy

```
App (BrowserRouter + Routes)
  └── AuthProvider (Context)
       ├── LoginPage (/)
       └── ProtectedRoute
            ├── KanbanBoardPage (/kanban) [Default Home - All Users]
            │   ├── TaskModal (Create/View/Edit Tasks)
            │   └── PlanModal (Create Plans)
            ├── AppPage (/apps) [Project Leads]
            ├── ProfilePage (/user/profile)
            └── UsersManagementPage (/user/accounts) [Admin only]
```

### State Management Pattern

The application uses React Context API for global authentication state:

-   **AuthContext** provides authentication state and methods to all components
-   Components access auth state via `useAuth()` hook
-   Protected routes automatically redirect unauthenticated users

### Data Flow

**1. Initial Load:**

-   App renders → AuthProvider initializes
-   AuthProvider checks authentication status via `/profile` API
-   Sets loading state while checking
-   Updates user state based on API response

**2. User Login:**

-   User submits credentials in LoginPage
-   LoginPage calls `login()` from AuthContext
-   AuthContext sends POST to `/auth/login`
-   Server returns JWT in HTTP-only cookie + user data
-   AuthContext updates user state
-   User redirected to KanbanBoardPage (/kanban) - the default home page

**3. Protected Route Access:**

-   User navigates to protected route
-   ProtectedRoute checks authentication status
-   If not authenticated → redirect to LoginPage
-   If authenticated but lacks required role → show access denied
-   Otherwise → render requested component

**4. Logout:**

-   User clicks logout in Header
-   Header calls `logout()` from AuthContext
-   AuthContext sends POST to `/auth/logout`
-   Clears user state and redirects to LoginPage

---

## Detailed Component Documentation

### 1. App.jsx

**Purpose:** Root component that sets up routing and authentication context.

**Structure:**

```jsx
<BrowserRouter>
    <AuthProvider>
        <Routes>{/* Route definitions */}</Routes>
    </AuthProvider>
</BrowserRouter>
```

**Routes:**
| Path | Component | Protection | Description |
|------|-----------|-----------|-------------|
| `/` | LoginPage | Public | Login page |
| `/kanban` | KanbanBoardPage | Protected | Unified Kanban board showing all tasks |
| `/apps` | AppPage | Protected | Applications management with inline editing |
| `/user/profile` | ProfilePage | Protected | User profile management |
| `/user/accounts` | UsersManagementPage | Admin only | User management (admin) |
| `*` | Navigate to `/` | - | Catch-all redirect |

**Key Features:**

-   Centralized route configuration
-   Role-based route protection
-   Automatic redirect for unknown routes

---

### 2. AuthContext.jsx

**Purpose:** Provides global authentication state and methods to the entire application.

**State:**

```javascript
{
  user: null | { username, email, groups },
  isLoading: boolean,
  isAuthenticated: boolean
}
```

**Methods:**

**`login(username, password)`**

-   Sends credentials to `/auth/login`
-   Stores user data in state on success
-   Returns user object
-   Throws error on failure

**`logout()`**

-   Sends request to `/auth/logout`
-   Clears user state
-   Redirects to login page
-   Handles errors gracefully

**`checkAuthStatus()`**

-   Called on initial load
-   Fetches user profile from `/profile`
-   Sets user if authenticated
-   Sets loading to false when complete

**Axios Configuration:**

```javascript
axios.defaults.baseURL = "http://localhost:8080/api";
axios.defaults.withCredentials = true; // Include cookies
```

**Usage Pattern:**

```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

---

### 3. ProtectedRoute.jsx

**Purpose:** Higher-order component that protects routes from unauthorized access.

**Props:**

-   `children`: Component to render if authorized
-   `allowedRoles`: Optional array of roles required for access

**Authorization Logic:**

**1. Loading State:**

-   Shows loading spinner while checking authentication
-   Prevents flash of wrong content

**2. Authentication Check:**

-   If not authenticated → redirect to LoginPage (`/`)

**3. Role-Based Access:**

-   If `allowedRoles` provided:
    -   Check if user has any of the required roles
    -   Show access denied message if unauthorized
-   If no `allowedRoles` → allow any authenticated user

**Usage Examples:**

```jsx
{
    /* Any authenticated user */
}
<ProtectedRoute>
    <AppPage />
</ProtectedRoute>;

{
    /* Admin only */
}
<ProtectedRoute allowedRoles={["admin"]}>
    <UsersManagementPage />
</ProtectedRoute>;
```

---

### 4. Header.jsx

**Purpose:** Reusable header component with navigation and user menu.

**Props:**

-   `title`: Header title text (default: "Task Management System")
-   `onLogout`: Logout handler function
-   `showLogout`: Boolean to show/hide user menu

**Features:**

**Dynamic Menu Generation:**

```javascript
getMenuOptions(userGroups);
```

-   Generates menu items based on user's groups
-   All users: Applications, Profile
-   Admin users: Additional "User Accounts" option
-   Each option includes label, path, and icon

**User Menu:**

-   Avatar icon button triggers dropdown
-   Shows username in menu
-   Lists available navigation options
-   Logout button at bottom
-   Click outside closes menu

**Responsive Design:**

-   Flexbox layout for header
-   Absolute positioning for dropdown
-   Hover states for interactive elements

**Navigation Pattern:**

```javascript
handleMenuClick(path);
```

-   Uses React Router's `navigate()`
-   Closes menu after navigation
-   Smooth user experience

---

### 5. LoginPage.jsx

**Purpose:** User authentication interface.

**State:**

```javascript
{
  formData: { username, password },
  error: string,
  isLoading: boolean
}
```

**Workflow:**

**1. Initial Render:**

-   Check if already authenticated
-   Redirect to default home page (`/kanban`) for all users

**2. Form Submission:**

```javascript
handleSubmit(e);
```

-   Prevents default form behavior
-   Clears previous errors
-   Sets loading state
-   Calls `login()` from context
-   Handles success: navigate to `/kanban` (default home)
-   Handles error: display error message

**3. Form Validation:**

-   HTML5 required attributes
-   Client-side validation before submission
-   Server-side errors displayed in UI

**UI Features:**

-   Clean, centered layout
-   Labeled input fields
-   Error message display
-   Loading state on submit button
-   Disabled submit during loading

---

### 6. AppPage.jsx

**Purpose:** Application management with inline table editing (similar to UsersManagementPage pattern).

**State:**

```javascript
{
  applications: array,
  loading: boolean,
  error: string,
  editedRows: Set,
  availableGroups: array
}
```

**Features:**

**Inline Editing Pattern:**

-   **First Row (Project Leads only)**: Add new application with all fields editable
-   **Existing Rows**: Edit fields in-place (project leads only)
-   **Edit Tracking**: Tracks modified rows, enables "Save" button only when changed
-   **Permission Fields**: MultiSelect dropdowns for 5 permission types (App_permit_Create, Open, toDoList, Doing, Done)

**Table Columns:**

-   Acronym (editable only for new applications)
-   Description (text input)
-   Start Date (date picker)
-   End Date (date picker)
-   Create, Open, To Do, Doing, Done (multi-select permission dropdowns)
-   Tasks (displays App_Rnumber - task count)
-   Actions (Save button for project leads, View Tasks button for all)

**Validation:**

-   Acronym is required for new applications
-   All 5 permission fields must have at least one group selected
-   Errors display inline below the row with auto-clear after 5 seconds

**Date Formatting:**

-   Input: YYYY-MM-DD format for date pickers
-   Helper function `formatDateForInput()` handles various date formats from server

**Permission Logic:**

-   Only users with "project lead" group can access the page to create/edit applications

---

### 7. ProfilePage.jsx

**Purpose:** User profile management with password update capability.

**State:**

```javascript
{
  formData: { email, currentPassword, newPassword, confirmPassword },
  profileData: { username, email, groups },
  error: string,
  success: string,
  isLoading: boolean
}
```

**Features:**

**Profile Information Display:**

-   Fetches user profile on mount
-   Shows username (read-only)
-   Shows email (editable)
-   Displays user groups as badges

**Password Update:**

-   Optional password change
-   Requires current password
-   Client-side validation:
    -   Length: 8-10 characters
    -   Must contain letter, number, special character
    -   New password ≠ current password
    -   Confirm password must match
-   Real-time validation feedback

**Password Validation Function:**

```javascript
validatePassword(password);
```

-   Returns validation error or null
-   Checks all password requirements
-   Used before form submission

**Form Submission:**

-   Only sends changed fields
-   Validates all password fields if password change requested
-   Displays success/error messages
-   Clears password fields on success

---

### 8. UsersManagementPage.jsx

**Purpose:** Admin interface for managing user accounts and groups.

**State:**

```javascript
{
  accounts: array,
  userGroups: array,
  selectedAccount: object | null,
  isModalOpen: boolean,
  modalType: 'create' | 'edit' | 'groups',
  newGroup: string,
  error: string,
  success: string
}
```

**Features:**

**User Account Management:**

-   Display all accounts in table
-   Columns: Username, Email, Groups, Status, Actions
-   Edit/Update functionality for each account
-   Create new accounts
-   Active/inactive status toggle

**Account Table:**

-   Responsive table layout
-   Status badges (Active/Inactive with colors)
-   User groups displayed as badges
-   Edit button per account

**Create/Edit Account Modal:**

-   Unified modal for create and edit
-   Form fields:
    -   Username (disabled in edit mode)
    -   Email
    -   Password (optional in edit)
    -   User groups (multi-select checkboxes)
    -   Active status toggle
-   Password validation
-   Submit/Cancel actions

**User Group Management:**

-   View all available groups
-   Create new groups
-   Groups displayed as pills
-   Separate "Manage Groups" button/modal

**Group Management Modal:**

-   List all existing groups
-   Input field for new group
-   Add button to create group
-   Visual feedback for actions

**Data Operations:**

**`loadData()`**

-   Fetches accounts from `/accounts`
-   Fetches groups from `/user_groups`
-   Called on component mount and after updates

**`handleCreateAccount(formData)`**

-   Validates password
-   Sends POST to `/accounts`
-   Refreshes account list
-   Shows success message

**`handleUpdateAccount(formData)`**

-   Validates optional password
-   Sends PUT to `/accounts`
-   Refreshes account list
-   Closes modal and shows success

**`handleCreateGroup()`**

-   Validates group name
-   Sends POST to `/user_groups`
-   Refreshes group list
-   Clears input and shows success

---

### 9. KanbanBoardPage.jsx

**Purpose:** Unified Kanban board showing all tasks from all applications (default home page).

**State:**

```javascript
{
  applications: array,
  tasks: array,
  loading: boolean,
  error: string,
  selectedApp: string,
  showCreateTaskModal: boolean,
  createAppSelection: string,
  selectedTask: object | null
}
```

**Features:**

**Unified View:**

-   Default home page at `/kanban` route
-   Shows all tasks from all applications in one board
-   No permission required to view tasks (permission-based editing only)

**5-Column Kanban Layout:**

-   Open (Gray)
-   To-Do (Blue)
-   Doing (Yellow)
-   Done (Green)
-   Closed (Purple)

**Each Column:**

-   Color-coded header
-   Task count display (dynamically filtered)
-   Scrollable task list
-   Minimum height for empty columns

**Application Filter:**

-   Dropdown to filter tasks by application
-   "All Applications" option shows tasks from all apps
-   Task cards show app name when viewing "All Applications"
-   Filter updates all columns dynamically

**Action Buttons:**

-   **Create Task** - Opens TaskModal for selected application
-   **Create Plan** - Opens PlanModal for selected application
-   Both buttons disabled when no applications exist
-   Default to selected app filter or first application

**Permission Logic:**
Task viewing is open to all users. Editing/state transitions use permission checks in TaskModal:

```javascript
// Task cards show app name when viewing all applications
<TaskCard
    task={task}
    onClick={() => handleTaskClick(task)}
    showAppName={selectedApp === "all"}
/>
```

**Data Loading:**

-   Fetches all applications on mount
-   Fetches tasks for ALL applications in parallel
-   Uses `Promise.all` for efficient loading
-   Merges all tasks into single array
-   Filters tasks client-side based on selected app

---

### 10. TaskCard.jsx

**Purpose:** Display task information in Kanban column.

**Props:**

-   `task`: Task object
-   `onClick`: Click handler function
-   `showAppName`: Boolean - displays app acronym when viewing all applications (default: false)

**Display Elements:**

-   Task_id (small, monospace font)
-   Task_app_Acronym (with folder icon, shown when `showAppName={true}`)
-   Task_name (bold, primary text)
-   Task_description (truncated to 2 lines)
-   Task_plan (with icon, if assigned)
-   Task_owner (with user icon)
-   Task_createDate (formatted)
-   State badge (color-coded)

**Styling:**

-   White background card
-   Border with hover effect
-   Shadow on hover
-   Rounded corners
-   Click cursor indicator

**State Colors:**

-   Open: Gray
-   To-Do: Blue
-   Doing: Yellow
-   Done: Green
-   Closed: Purple

---

### 11. TaskModal.jsx

**Purpose:** Comprehensive task create/view/edit modal with state transitions.

**Props:**

-   `isOpen`: Boolean
-   `onClose`: Close handler
-   `onSuccess`: Success callback
-   `task`: Task object (null for create mode)
-   `application`: Application object
-   `plans`: Array of plans

**Two Modes:**

**1. Create Mode (`task === null`):**

-   Form to create new task
-   Fields: Task_name (required), Task_description, Task_plan
-   Creates task in "Open" state
-   Auto-generates Task_id on server

**2. View/Edit Mode (`task !== null`):**

-   View all task details (read-only)
-   Update task plan (inline save, only when task is in Open or Done state)
-   Add custom notes (permission-based on current state)
-   Promote/Demote buttons (permission-based) with auto-generated notes
-   Complete audit trail display

**Permission-Based Actions:**

**Promote Button Logic:**

```javascript
const canPromote = () => {
    const state = task.Task_state;
    let permitGroups = [];

    if (state === "Open") permitGroups = application.App_permit_Open;
    else if (state === "To-Do") permitGroups = application.App_permit_toDoList;
    else if (state === "Doing") permitGroups = application.App_permit_Doing;
    else if (state === "Done") permitGroups = application.App_permit_Done;

    return permitGroups.some(group => user.groups.includes(group));
};
```

**Demote Button Logic:**

-   Only available for "Doing" and "Done" states
-   Requires same permissions as promote

**State Transitions with Auto-Generated Notes:**

-   **Promote**:
    -   Open → To-Do: "Task released: Open → To-Do."
    -   To-Do → Doing: "Task taken: To-Do → Doing."
    -   Doing → Done: "Task reviewed: Doing → Done."
    -   Done → Closed: "Task approved: Done → Closed."
-   **Demote**:
    -   Doing → To-Do: "Task dropped: Doing → To-Do."
    -   Done → Doing: "Task rejected: Done → Doing."

**Audit Trail Display:**

-   Shows Task_notes in monospace font
-   Read-only text area
-   Scrollable for long histories
-   Formatted entries with username, state, timestamp

**Plan Update:**

-   Dropdown to change plan assignment
-   Only enabled when task is in Open or Done state
-   Disabled (grayed out) for To-Do, Doing, and Closed states
-   Requires `App_permit_Open` permission
-   Updates immediately via PUT `/tasks` on selection change

---

### 12. PlanModal.jsx

**Purpose:** Modal dialog for creating/editing plans.

**Props:**

-   `isOpen`: Boolean to show/hide modal
-   `onClose`: Close handler function
-   `onSuccess`: Success callback to refresh data
-   `plan`: Plan object for edit mode (null for create)
-   `appAcronym`: Application acronym to associate plan with

**State:**

```javascript
{
  formData: {
    Plan_MVP_name,
    Plan_startDate,
    Plan_endDate
  },
  loading: boolean,
  error: string
}
```

**Features:**

**Two Modes:**

-   **Create**: All fields editable, requires appAcronym
-   **Edit**: Plan_MVP_name disabled (immutable)

**Form Fields:**

-   Plan Name (required, max 255 chars, immutable after creation)
-   Start Date (optional, date picker)
-   End Date (optional, date picker)

**Validation:**

-   Plan name required for creation
-   Dates are optional
-   Error messages displayed inline

**API Calls:**

-   POST `/plans` for create (includes Plan_app_Acronym)
-   PUT `/plan/:name` for update (only dates can be updated)

**Usage:**

```jsx
<PlanModal
    isOpen={showCreatePlanModal}
    onClose={() => setShowCreatePlanModal(false)}
    onSuccess={fetchAllData}
    appAcronym="WEBAPP"
/>
```

---

### 13. MultiSelect.jsx

**Purpose:** Reusable multi-select dropdown with tag display.

**Props:**

-   `value`: Array of selected items
-   `onChange`: Callback with new selection array
-   `placeholder`: Placeholder text
-   `availableGroups`: Array of available options
-   `disabled`: Boolean - disables interaction (default: false)

**Features:**

**Tag Display:**

-   Shows selected items as removable tags
-   Click × to remove individual tag (when not disabled)
-   Placeholder shown when empty
-   Gray background when disabled

**Dropdown:**

-   Checkbox-based selection
-   Click checkbox or label to toggle
-   Opens on field click (when not disabled)
-   Closes on outside click (useRef + effect)
-   Dropdown hidden when disabled

**Interaction:**

-   Multi-select (not single)
-   Toggle selection on click
-   Immediate visual feedback
-   Clean, modern design
-   Disabled state for read-only views

**Usage Example:**

```jsx
<MultiSelect
    value={formData.App_permit_Open}
    onChange={value =>
        setFormData(prev => ({
            ...prev,
            App_permit_Open: value
        }))
    }
    placeholder="Select groups..."
    availableGroups={userGroups}
/>
```

---

## Task Management Workflow

### State Machine

**Task Lifecycle:**

```
Open → To-Do → Doing → Done → Closed
   ↓      ↓       ↑       ↑
   └──────┴───────┘       │
          (Demote)        └─ (No demote from Done)
```

**State Transitions:**

**Create:**

-   New Task → Open state (Requires `App_permit_Create` permission)

**Promote:**

-   Open → To-Do (Requires `App_permit_Open` permission)
-   To-Do → Doing (Requires `App_permit_toDoList` permission)
-   Doing → Done (Requires `App_permit_Doing` permission)
-   Done → Closed (Requires `App_permit_Done` permission)

**Demote:**

-   Doing → To-Do (Requires `App_permit_Doing` permission)
-   Done → Doing (Requires `App_permit_Done` permission)

**Business Rules:**

-   User must be in permitted group array for action
-   Notes are auto-generated with descriptive messages for state changes
-   Task_owner only updates when "Taking Task" (To-Do → Doing) or "Dropping Task" (Doing → To-Do)
-   All changes logged in Task_notes audit trail
-   Plans can only be changed when task is in Open or Done state

### Permission System

**Application-Level Permissions (JSON Arrays):**

-   `App_permit_Create`: Groups that can create new tasks
-   `App_permit_Open`: Groups that can promote Open → To-Do AND change task plans
-   `App_permit_toDoList`: Groups that can promote To-Do → Doing
-   `App_permit_Doing`: Groups that can promote Doing → Done
-   `App_permit_Done`: Groups that can close tasks (Done → Closed) AND receive email notifications

**Permission Check Logic:**

```javascript
// User can perform action if they're in ANY of the permitted groups
const hasPermission = permittedGroups.some(group =>
    user.groups.includes(group)
);
```

**Benefits:**

-   Flexible permission assignment
-   Multiple groups can share responsibility
-   Easy to update without code changes
-   Clear UI feedback

### Task Ownership Model

**Task Owner Behavior:**

-   `Task_creator`: Set when task is created, never changes
-   `Task_owner`: Represents the user currently working on the task
    -   Set to `null` when task is created (Open state)
    -   Set to current user when "Taking Task" (To-Do → Doing)
    -   Set to `null` when "Dropping Task" (Doing → To-Do)
    -   Remains unchanged for all other transitions (Open→To-Do, Doing→Done, Done→Closed, Done→Doing)

**Display:**

-   Shows as empty when `null`
-   Updates are reflected immediately in the UI
-   Visible in task cards and task detail modal

---

## Routing & Navigation Flow

### Navigation Patterns:

**1. Programmatic Navigation:**

```javascript
const navigate = useNavigate();
navigate("/apps");
navigate("/user/profile");
```

**2. Component-based Navigation:**

```jsx
<Navigate to="/" replace />
```

**3. Navigation Guards:**

-   ProtectedRoute checks authentication
-   Redirects if unauthorized
-   Maintains intended route in history

### User Journey Examples:

**New User Login:**

1. Lands on LoginPage (`/`)
2. Submits credentials
3. Redirected to KanbanBoardPage (`/kanban`) - default home
4. Can navigate via Header menu

**Admin User Login:**

1. Lands on LoginPage (`/`)
2. Submits admin credentials
3. Redirected to KanbanBoardPage (`/kanban`) - default home
4. Has access to all routes including UsersManagementPage

**Unauthorized Access Attempt:**

1. Non-admin tries to access `/user/accounts`
2. ProtectedRoute checks roles
3. Shows "Access Denied" message
4. User must navigate away manually

---

## API Integration

### Axios Configuration

**Base Setup:**

```javascript
axios.defaults.baseURL = "http://localhost:8080/api";
axios.defaults.withCredentials = true;
```

**Benefits:**

-   Centralized API URL
-   Automatic cookie handling
-   Consistent request/response handling

### API Endpoints Used:

**Authentication:**
| Method | Endpoint | Purpose | Used By |
| ------ | -------------- | ----------------- | -------------------------------- |
| POST | `/auth/login` | User login | AuthContext |
| POST | `/auth/logout` | User logout | AuthContext |
| GET | `/profile` | Get current user | AuthContext |

**User Management:**
| Method | Endpoint | Purpose | Used By |
| ------ | -------------- | ----------------- | -------------------------------- |
| GET | `/accounts` | List all accounts | UsersManagementPage |
| POST | `/accounts` | Create account | UsersManagementPage |
| PUT | `/accounts` | Update account | ProfilePage, UsersManagementPage |
| GET | `/user_groups` | List groups | UsersManagementPage, ApplicationModal |
| POST | `/user_groups` | Create group | UsersManagementPage |

**Applications:**
| Method | Endpoint | Purpose | Used By |
| ------ | --------------------------- | -------------------- | ----------------- |
| GET | `/applications` | List all applications | AppPage |
| GET | `/applications/:acronym` | Get single application | KanbanBoardPage |
| POST | `/applications` | Create application | ApplicationModal |
| PUT | `/applications/:acronym` | Update application | ApplicationModal |

**Plans:**
| Method | Endpoint | Purpose | Used By |
| ------ | --------------------- | --------------------- | -------------- |
| GET | `/plans/:app_acronym` | List plans for app | KanbanBoardPage |
| POST | `/plans` | Create plan | PlanModal |
| PUT | `/plan/:name` | Update plan | PlanModal |

**Tasks:**
| Method | Endpoint | Purpose | Used By |
| ------ | --------------------- | -------------------- | --------------- |
| GET | `/tasks/:app_acronym` | List tasks for app | KanbanBoardPage |
| POST | `/tasks` | Create task | TaskModal |
| POST | `/tasks/promote` | Promote task state | TaskModal |
| POST | `/tasks/demote` | Demote task state | TaskModal |
| PUT | `/tasks` | Update task plan | TaskModal |

### Error Handling Pattern:

```javascript
try {
    const { data } = await axios.post("/endpoint", payload);
    // Handle success
} catch (error) {
    setError(
        error.response?.data?.message || error.message || "Operation failed"
    );
}
```

---

## Styling with Tailwind CSS

### Configuration

**Vite Plugin:**

```javascript
import tailwindcss from "@tailwindcss/vite";

plugins: [react(), tailwindcss()];
```

### Common Utility Patterns:

**Layout:**

-   `min-h-screen` - Full viewport height
-   `flex items-center justify-center` - Centered content
-   `p-{size}` - Padding
-   `gap-{size}` - Grid/Flex gap

**Typography:**

-   `text-{size}` - Font size
-   `font-{weight}` - Font weight
-   `text-{color}` - Text color

**Interactive Elements:**

-   `hover:bg-{color}` - Hover states
-   `focus:ring-{size}` - Focus indicators
-   `transition` - Smooth transitions
-   `cursor-pointer` - Pointer cursor

**Forms:**

-   `border border-{color}` - Input borders
-   `rounded-{size}` - Border radius
-   `focus:ring-{color}` - Focus ring
-   `outline-none` - Remove default outline

**Responsive Design:**

-   `sm:` - Small screens (640px+)
-   `lg:` - Large screens (1024px+)
-   Example: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

---

## Build & Development

### Development Server

```bash
npm install
npm run dev
```

**Configuration:**

-   Port: 3000 (configured in vite.config.js)
-   Hot module replacement enabled
-   Fast refresh for React components

### Production Build

```bash
npm run build
npm run preview
```

**Build Output:**

-   Optimized bundle in `dist/`
-   Code splitting enabled
-   Minified assets

### Vite Configuration Highlights

```javascript
server: {
  port: 3000
},
build: {
  rollupOptions: {
    input: { main: "index.html" }
  }
}
```

---

## Best Practices Implemented

### 1. Component Organization

-   Single responsibility per component
-   Reusable components (Header, ProtectedRoute)
-   Clear component hierarchy

### 2. State Management

-   Context API for global state
-   Local state for component-specific data
-   Minimal prop drilling

### 3. Security

-   Protected routes for authentication
-   Role-based access control
-   HTTP-only cookies (server-side)
-   No sensitive data in localStorage

### 4. User Experience

-   Loading states during async operations
-   Clear error messages
-   Form validation feedback
-   Responsive design

### 5. Code Quality

-   Consistent naming conventions
-   Clear function names
-   Minimal inline styles (Tailwind utilities)
-   Error handling in all async operations

### 6. Performance

-   Vite for fast builds
-   Code splitting via routes
-   Efficient re-renders (React 19)

---

## Environment Configuration

**Development:**

```
API_URL: http://localhost:8080/api
PORT: 3000
```

**Production:**

-   Update `axios.defaults.baseURL` to production API URL
-   Set appropriate CORS settings on server
-   Use HTTPS for secure cookie transmission

---

## Common Development Tasks

### Adding a New Page

1. Create component in `src/`
2. Add route in `App.jsx`
3. Add to menu in `Header.jsx` if needed
4. Add protection via `ProtectedRoute` if required

### Adding API Integration

1. Use axios with configured base URL
2. Handle loading states
3. Display errors appropriately
4. Update state with response data

### Styling Components

1. Use Tailwind utility classes
2. Follow existing patterns for consistency
3. Add responsive classes where needed
4. Use hover/focus states for interactive elements

---

## Debugging Tips

### Authentication Issues

-   Check browser cookies (accessToken present?)
-   Verify `withCredentials: true` in axios
-   Check CORS configuration on server
-   Inspect network requests in DevTools

### Routing Issues

-   Verify route paths match exactly
-   Check ProtectedRoute logic
-   Ensure BrowserRouter wraps all routes
-   Use React DevTools to inspect route state

### State Management

-   Use React DevTools to inspect context
-   Check if AuthProvider wraps all components
-   Verify useAuth() hook usage
-   Console.log state changes during development
