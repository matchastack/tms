# Client Documentation

## Overview

This is a React single-page application (SPA) that provides a user interface for authentication and user management. The application uses React Router for navigation, Context API for state management, and Axios for API communication with the backend server.

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
├── package.json
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Main app component with routing
    ├── AuthContext.jsx          # Authentication context provider
    ├── ProtectedRoute.jsx       # Route protection component
    ├── Header.jsx               # Reusable header component
    ├── LoginPage.jsx            # Login page component
    ├── HomePage.jsx             # Home page component
    ├── ProfilePage.jsx          # User profile page
    └── UsersManagementPage.jsx  # Admin user management page
```

---

## Architecture & Application Flow

### Component Hierarchy

```
App (BrowserRouter + Routes)
  └── AuthProvider (Context)
       ├── LoginPage (/)
       └── ProtectedRoute
            ├── HomePage (/home)
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
-   User redirected to HomePage or admin page

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
| `/home` | HomePage | Protected | Main dashboard |
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
    <HomePage />
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
-   All users: Home, Profile
-   Admin users: Additional "Users Management" option
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
-   Redirect based on user role:
    -   Admin-only → `/user/accounts`
    -   Others → `/home`

**2. Form Submission:**

```javascript
handleSubmit(e);
```

-   Prevents default form behavior
-   Clears previous errors
-   Sets loading state
-   Calls `login()` from context
-   Handles success: navigate to `/home`
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

### 6. HomePage.jsx

**Purpose:** Main dashboard showing available applications.

**Features:**

-   Header with logout functionality
-   Grid layout for application cards
-   Placeholder application data (expandable)

**Layout:**

-   Full-height container with gray background
-   Header component at top
-   Main content area with padding
-   Responsive grid (1-3 columns based on screen size)

**Application Cards:**

-   Gray background with rounded corners
-   Hover effects (darker background, border)
-   Cursor pointer for interactivity
-   Ready for future functionality

**Responsive Grid:**

```css
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

-   1 column on mobile
-   2 columns on small screens
-   3 columns on large screens

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

## Routing & Navigation Flow

### Navigation Patterns:

**1. Programmatic Navigation:**

```javascript
const navigate = useNavigate();
navigate("/home");
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
3. Redirected to HomePage (`/home`)
4. Can navigate via Header menu

**Admin User Login:**

1. Lands on LoginPage (`/`)
2. Submits admin credentials
3. Redirected to UsersManagementPage (`/user/accounts`) if admin-only
4. Has access to all routes

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

| Method | Endpoint       | Purpose           | Used By                          |
| ------ | -------------- | ----------------- | -------------------------------- |
| POST   | `/auth/login`  | User login        | AuthContext                      |
| POST   | `/auth/logout` | User logout       | AuthContext                      |
| GET    | `/profile`     | Get current user  | AuthContext                      |
| GET    | `/accounts`    | List all accounts | UsersManagementPage              |
| POST   | `/accounts`    | Create account    | UsersManagementPage              |
| PUT    | `/accounts`    | Update account    | ProfilePage, UsersManagementPage |
| GET    | `/user_groups` | List groups       | UsersManagementPage              |
| POST   | `/user_groups` | Create group      | UsersManagementPage              |

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
