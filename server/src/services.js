/**
 * @fileoverview Business logic layer for the TMS application.
 * Contains all service functions that handle data operations and business rules.
 * Services interact with the database layer and implement core application logic.
 *
 * @requires bcryptjs - For password hashing and comparison
 * @requires jsonwebtoken - For JWT token generation
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "./config/database.js";
import { config } from "./config/config.js";

// ============= AUTH SERVICES =============

/**
 * Authenticate user with username and password.
 * Verifies credentials, checks account status, and generates JWT token.
 *
 * @async
 * @param {string} username - Username to authenticate
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} Object containing accessToken and user data
 * @throws {Error} If credentials are invalid or account is inactive
 *
 * @example
 * const result = await loginUser("admin", "password123");
 * // Returns: { accessToken: "jwt...", user: { username, email, groups, isActive } }
 */
export const loginUser = async (username, password) => {
    const user = await query("SELECT * FROM accounts WHERE username = ?", [
        username
    ]).then(results => results[0]);

    if (!user) {
        throw new Error("Invalid username and/or password");
    }

    if (!user.isActive) {
        throw new Error("Inactive account");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid username and/or password");
    }

    const accessToken = generateAccessToken({
        username: user.username
    });

    return {
        accessToken,
        user: {
            username: user.username,
            email: user.email,
            groups: user.userGroups,
            isActive: user.isActive
        }
    };
};

/**
 * Generate JWT access token with user payload.
 *
 * @param {Object} payload - Token payload containing user data
 * @returns {string} Signed JWT token
 */
const generateAccessToken = payload => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiration
    });
};

// ============= USER SERVICES =============

/**
 * Retrieve user account by username.
 * Returns user data without password field.
 *
 * @async
 * @param {string} username - Username to lookup
 * @returns {Promise<Object>} User object with username, email, userGroups, and isActive
 * @throws {Error} If user is not found
 */
export const getUserByUsername = async username => {
    const user = await query(
        "SELECT username, email, userGroups, isActive FROM accounts WHERE username = ?",
        [username]
    ).then(results => results[0]);

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

/**
 * Update user profile information.
 * Allows updating email and password. Validates email uniqueness and current password.
 *
 * @async
 * @param {string} username - Username of the user to update
 * @param {Object} profileData - Profile update data
 * @param {string} profileData.email - New email address
 * @param {string} [profileData.currentPassword] - Current password (required if changing password)
 * @param {string} [profileData.password] - New password (optional)
 * @returns {Promise<Object>} Updated user object with username and email
 * @throws {Error} If email already exists or current password is incorrect
 */
export const updateUserProfile = async (username, profileData) => {
    const { email, currentPassword, password } = profileData;
    return await withTransaction(async connection => {
        const user = await query("SELECT * FROM accounts WHERE username = ?", [
            username
        ]).then(results => results[0]);

        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ?",
            [email]
        ).then(results => results[0]);
        if (existingEmail && existingEmail.email !== user.email) {
            throw new Error("Email already exists");
        }

        if (password) {
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!isCurrentPasswordValid) {
                throw new Error("Current password is incorrect");
            }

            const hashedNewPassword = await bcrypt.hash(
                password,
                config.bcryptRounds
            );

            await connection.execute(
                "UPDATE accounts SET email = ?, password = ? WHERE username = ?",
                [email, hashedNewPassword, username]
            );
        } else {
            await connection.execute(
                "UPDATE accounts SET email = ? WHERE username = ?",
                [email, username]
            );
        }
        return {
            username,
            email
        };
    });
};

// ============= ADMIN SERVICES =============

/**
 * Get all user accounts.
 * Returns all accounts without password fields.
 *
 * @async
 * @returns {Promise<Array>} Array of user account objects
 */
export const getAllAccounts = async () => {
    return await query(
        "SELECT username, email, userGroups, isActive FROM accounts"
    );
};

/**
 * Create a new user account.
 * Validates username and email uniqueness, hashes password, and creates account.
 *
 * @async
 * @param {Object} accountData - Account creation data
 * @param {string} accountData.username - Unique username
 * @param {string} accountData.email - Unique email address
 * @param {string} accountData.password - Plain text password (will be hashed)
 * @param {Array<string>} accountData.userGroups - Array of user group names
 * @param {number} accountData.isActive - Account status (0 or 1)
 * @returns {Promise<Object>} Created account object (without password)
 * @throws {Error} If username or email already exists
 */
export const createAccount = async accountData => {
    const { username, email, password, userGroups, isActive } = accountData;

    return await withTransaction(async connection => {
        const existingUser = await query(
            "SELECT * FROM accounts WHERE username = ?",
            [username]
        ).then(results => results[0]);
        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ?",
            [email]
        ).then(results => results[0]);
        if (existingUser || existingEmail) {
            throw new Error("Username or email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

        await connection.execute(
            "INSERT INTO accounts (username, email, password, userGroups, isActive) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, userGroups, isActive]
        );

        return {
            username,
            email,
            userGroups,
            isActive
        };
    });
};

/**
 * Update an existing user account.
 * Updates account fields with protection for root admin account.
 *
 * @async
 * @param {string} username - Username of account to update
 * @param {Object} accountData - Account update data
 * @param {string} accountData.email - Email address
 * @param {string} [accountData.password] - New password (optional, will be hashed)
 * @param {Array<string>} accountData.userGroups - Array of user group names
 * @param {number} accountData.isActive - Account status (0 or 1)
 * @returns {Promise<Object>} Updated account object
 * @throws {Error} If email already exists, or attempting to deactivate/remove admin from root admin
 */
export const updateAccount = async (username, accountData) => {
    const { email, password, userGroups, isActive } = accountData;

    return await withTransaction(async connection => {
        if (username === "admin") {
            if (isActive === 0) {
                throw new Error("Cannot deactivate the original admin");
            }
            if (userGroups && !userGroups.includes("admin")) {
                throw new Error(
                    "Cannot remove admin group from original admin"
                );
            }
        }

        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ? AND username != ?",
            [email, username]
        ).then(results => results[0]);
        if (existingEmail) {
            throw new Error("Email already exists");
        }

        let sql;
        let params;

        if (password) {
            const updatedPassword = await bcrypt.hash(
                password,
                config.bcryptRounds
            );
            sql = `
            UPDATE accounts 
            SET email = ?, password = ?, userGroups = ?, isActive = ?
            WHERE username = ?
            `;
            params = [email, updatedPassword, userGroups, isActive, username];
        } else {
            sql = `
            UPDATE accounts 
            SET email = ?, userGroups = ?, isActive = ?
            WHERE username = ?
            `;
            params = [email, userGroups, isActive, username];
        }

        await connection.execute(sql, params);

        return {
            username,
            email,
            userGroups,
            isActive
        };
    });
};

/**
 * Get all user groups.
 * Returns an array of group names.
 *
 * @async
 * @returns {Promise<Array<string>>} Array of user group names
 */
export const getAllUserGroups = async () => {
    return await query("SELECT group_name FROM user_groups").then(results =>
        results.map(row => row.group_name)
    );
};

/**
 * Create a new user group.
 * Validates group name uniqueness.
 *
 * @async
 * @param {string} groupName - Name of the group to create
 * @returns {Promise<Object>} Created group object with groupName
 * @throws {Error} If group already exists
 */
export const createGroup = async groupName => {
    return await withTransaction(async connection => {
        const existingGroups = await query(
            "SELECT group_name FROM user_groups"
        ).then(results => results.map(row => row.group_name));

        if (existingGroups.includes(groupName)) {
            throw new Error("Group already exists");
        }

        await connection.execute(
            "INSERT INTO user_groups (group_name) VALUES (?)",
            [groupName]
        );
        return { groupName };
    });
};

/**
 * Check if a user belongs to a specific group.
 * Case-insensitive group name comparison.
 *
 * @async
 * @param {string} userId - Username to check
 * @param {string} groupName - Group name to verify
 * @returns {Promise<boolean>} True if user belongs to the group, false otherwise
 */
export const checkGroup = async (userId, groupName) => {
    const user = await query(
        "SELECT userGroups FROM accounts WHERE username = ?",
        [userId]
    ).then(results => results[0]);

    if (!user) {
        return false;
    }

    const userGroups = user.userGroups || [];
    return userGroups.some(
        group => group.toLowerCase() === groupName.toLowerCase()
    );
};

// ============= APPLICATION SERVICES =============

/**
 * Create a new application.
 * Creates an application with permissions and initializes running number to 0.
 *
 * @async
 * @param {Object} appData - Application creation data
 * @param {string} appData.App_Acronym - Unique application acronym
 * @param {string} appData.App_Description - Application description
 * @param {string} appData.App_startDate - Application start date
 * @param {string} appData.App_endDate - Application end date
 * @param {Array<string>} appData.App_permit_Create - Groups permitted to create tasks
 * @param {Array<string>} appData.App_permit_Open - Groups permitted to promote Open tasks
 * @param {Array<string>} appData.App_permit_toDoList - Groups permitted to promote To-Do tasks
 * @param {Array<string>} appData.App_permit_Doing - Groups permitted to work on Doing tasks
 * @param {Array<string>} appData.App_permit_Done - Groups permitted to close Done tasks
 * @returns {Promise<Object>} Created application object
 * @throws {Error} If application acronym already exists
 */
export const createApplication = async appData => {
    const {
        App_Acronym,
        App_Description,
        App_startDate,
        App_endDate,
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
    } = appData;

    return await withTransaction(async connection => {
        const existing = await query(
            "SELECT App_Acronym FROM applications WHERE App_Acronym = ?",
            [App_Acronym]
        ).then(results => results[0]);

        if (existing) {
            throw new Error("Application acronym already exists");
        }

        await connection.execute(
            `INSERT INTO applications (
                App_Acronym, App_Description, App_Rnumber,
                App_startDate, App_endDate,
                App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done
            ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
            [
                App_Acronym,
                App_Description,
                App_startDate,
                App_endDate,
                JSON.stringify(
                    Array.isArray(App_permit_Create) ? App_permit_Create : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Open) ? App_permit_Open : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_toDoList)
                        ? App_permit_toDoList
                        : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Doing) ? App_permit_Doing : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Done) ? App_permit_Done : []
                )
            ]
        );

        return {
            App_Acronym,
            App_Description,
            App_startDate,
            App_endDate,
            App_permit_Create,
            App_permit_Open,
            App_permit_toDoList,
            App_permit_Doing,
            App_permit_Done
        };
    });
};

/**
 * Get all applications.
 * Returns all applications ordered by acronym.
 *
 * @async
 * @returns {Promise<Array>} Array of application objects
 */
export const getAllApplications = async () => {
    return await query("SELECT * FROM applications ORDER BY App_Acronym");
};

/**
 * Get a single application by acronym.
 * Returns application details with all permission groups.
 *
 * @async
 * @param {string} acronym - Application acronym
 * @returns {Promise<Object>} Application object
 * @throws {Error} If application is not found
 */
export const getApplicationByAcronym = async acronym => {
    const app = await query(
        "SELECT * FROM applications WHERE App_Acronym = ?",
        [acronym]
    ).then(results => results[0]);

    if (!app) {
        throw new Error("Application not found");
    }

    return app;
};

/**
 * Update an existing application.
 * Updates application metadata and permissions. App_Rnumber cannot be modified.
 *
 * @async
 * @param {string} acronym - Application acronym to update
 * @param {Object} appData - Application update data (same structure as createApplication)
 * @returns {Promise<Object>} Updated application object
 * @throws {Error} If application is not found
 */
export const updateApplication = async (acronym, appData) => {
    const {
        App_Description,
        App_startDate,
        App_endDate,
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
    } = appData;

    return await withTransaction(async connection => {
        const existing = await query(
            "SELECT App_Acronym FROM applications WHERE App_Acronym = ?",
            [acronym]
        ).then(results => results[0]);

        if (!existing) {
            throw new Error("Application not found");
        }

        await connection.execute(
            `UPDATE applications SET
                App_Description = ?,
                App_startDate = ?,
                App_endDate = ?,
                App_permit_Create = ?,
                App_permit_Open = ?,
                App_permit_toDoList = ?,
                App_permit_Doing = ?,
                App_permit_Done = ?
            WHERE App_Acronym = ?`,
            [
                App_Description,
                App_startDate,
                App_endDate,
                JSON.stringify(
                    Array.isArray(App_permit_Create) ? App_permit_Create : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Open) ? App_permit_Open : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_toDoList)
                        ? App_permit_toDoList
                        : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Doing) ? App_permit_Doing : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Done) ? App_permit_Done : []
                ),
                acronym
            ]
        );

        return await getApplicationByAcronym(acronym);
    });
};

// ============= PLAN SERVICES =============

/**
 * Create a new plan.
 * Validates plan dates are within application date range and plan name is unique.
 *
 * @async
 * @param {Object} planData - Plan creation data
 * @param {string} planData.Plan_MVP_name - Unique plan name
 * @param {string} planData.Plan_startDate - Plan start date
 * @param {string} planData.Plan_endDate - Plan end date
 * @param {string} planData.Plan_app_Acronym - Associated application acronym
 * @returns {Promise<Object>} Created plan object
 * @throws {Error} If plan name exists, application not found, or dates are invalid
 */
export const createPlan = async planData => {
    const { Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym } =
        planData;

    if (Plan_startDate && Plan_endDate && Plan_startDate > Plan_endDate) {
        throw new Error("Start date cannot be after end date");
    }

    return await withTransaction(async connection => {
        // Check if application exists and get its date range
        const app = await query(
            "SELECT App_Acronym, App_startDate, App_endDate FROM applications WHERE App_Acronym = ?",
            [Plan_app_Acronym]
        ).then(results => results[0]);

        if (!app) {
            throw new Error("Application not found");
        }

        // Validate plan dates are within application dates
        if (
            Plan_startDate &&
            app.App_startDate &&
            Plan_startDate < app.App_startDate
        ) {
            throw new Error(
                "Plan start and end date must be on or after application start date"
            );
        }

        if (Plan_endDate && app.App_endDate && Plan_endDate > app.App_endDate) {
            throw new Error(
                "Plan end date must be on or before application end date"
            );
        }

        if (
            Plan_startDate &&
            app.App_endDate &&
            Plan_startDate > app.App_endDate
        ) {
            throw new Error(
                "Plan start date must be on or before application end date"
            );
        }

        if (
            Plan_endDate &&
            app.App_startDate &&
            Plan_endDate < app.App_startDate
        ) {
            throw new Error(
                "Plan end date must be on or after application start date"
            );
        }

        // Check if plan name already exists
        const existing = await query(
            "SELECT Plan_MVP_name FROM plans WHERE Plan_MVP_name = ?",
            [Plan_MVP_name]
        ).then(results => results[0]);

        if (existing) {
            throw new Error(
                "Plan MVP name already exists in selected Application"
            );
        }

        await connection.execute(
            `INSERT INTO plans (Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym)
             VALUES (?, ?, ?, ?)`,
            [Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym]
        );

        return {
            Plan_MVP_name,
            Plan_startDate,
            Plan_endDate,
            Plan_app_Acronym
        };
    });
};

/**
 * Get all plans for an application.
 * Returns plans ordered by start date.
 *
 * @async
 * @param {string} appAcronym - Application acronym
 * @returns {Promise<Array>} Array of plan objects
 */
export const getPlansByApp = async appAcronym => {
    return await query(
        "SELECT * FROM plans WHERE Plan_app_Acronym = ? ORDER BY Plan_startDate",
        [appAcronym]
    );
};

/**
 * Get a single plan by name.
 * Returns plan details including associated application.
 *
 * @async
 * @param {string} planName - Plan name
 * @returns {Promise<Object>} Plan object
 * @throws {Error} If plan is not found
 */
export const getPlanByName = async planName => {
    const plan = await query("SELECT * FROM plans WHERE Plan_MVP_name = ?", [
        planName
    ]).then(results => results[0]);

    if (!plan) {
        throw new Error("Plan not found");
    }

    return plan;
};

// ============= TASK SERVICES =============

/**
 * Generate unique task ID.
 * Increments application's running number and returns formatted task ID.
 * Format: {App_Acronym}_{Rnumber}
 *
 * @async
 * @private
 * @param {string} appAcronym - Application acronym
 * @param {Object} connection - Database connection (from transaction)
 * @returns {Promise<string>} Generated task ID (e.g., "PROJ_1")
 */
const generateTaskId = async (appAcronym, connection) => {
    const app = await connection
        .execute("SELECT App_Rnumber FROM applications WHERE App_Acronym = ?", [
            appAcronym
        ])
        .then(([results]) => results[0]);

    const newRnumber = app.App_Rnumber + 1;

    await connection.execute(
        "UPDATE applications SET App_Rnumber = ? WHERE App_Acronym = ?",
        [newRnumber, appAcronym]
    );

    return `${appAcronym}_${newRnumber}`;
};

/**
 * Append audit trail note with timestamp.
 * Formats notes with Singapore timezone timestamp and auto-generates transition messages.
 * Format: [DD-MM-YYYY HH:mm] State - username\nnote text\n
 *
 * @private
 * @param {string} currentNotes - Existing notes string
 * @param {string} username - Username performing the action
 * @param {string} state - Current task state
 * @param {string} note - User-provided note (optional)
 * @param {string} [previousState] - Previous state for auto-generating transition message
 * @returns {string} Updated notes with new entry appended
 */
const appendAuditNote = (
    currentNotes,
    username,
    state,
    note,
    previousState = null
) => {
    const timestamp = new Date()
        .toLocaleString("en-SG", {
            timeZone: "Asia/Singapore",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
        .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+)/, "$3-$1-$2 $4:$5");
    let noteText = note;

    // If no note provided and previousState is given, generate transition message
    if (!note && previousState) {
        noteText = `Task moved from "${previousState}" to "${state}".`;
    } else if (!note) {
        noteText = "";
    }

    const newNote = `\n[${timestamp}] ${state} - ${username}\n${noteText}\n`;
    return (currentNotes || "") + newNote;
};

/**
 * Create a new task.
 * Creates task in Open state with auto-generated ID and audit trail.
 *
 * @async
 * @param {Object} taskData - Task creation data
 * @param {string} taskData.Task_name - Unique task name
 * @param {string} taskData.Task_description - Task description
 * @param {string} [taskData.Task_plan] - Optional plan name
 * @param {string} taskData.Task_app_Acronym - Application acronym
 * @param {string} [taskData.notes] - Optional creation notes
 * @param {string} username - Username of task creator
 * @returns {Promise<Object>} Created task object
 * @throws {Error} If task name exists, application not found, or plan is invalid
 */
export const createTask = async (taskData, username) => {
    const { Task_name, Task_description, Task_plan, Task_app_Acronym, notes } =
        taskData;

    return await withTransaction(async connection => {
        // Check if application exists
        const app = await connection
            .execute("SELECT * FROM applications WHERE App_Acronym = ?", [
                Task_app_Acronym
            ])
            .then(([results]) => results[0]);

        if (!app) {
            throw new Error("Application not found");
        }

        // Check if task name already exists
        const existing = await connection
            .execute("SELECT Task_name FROM tasks WHERE Task_name = ?", [
                Task_name
            ])
            .then(([results]) => results[0]);

        if (existing) {
            throw new Error("Task name already exists");
        }

        // Validate plan if provided
        if (Task_plan) {
            const plan = await connection
                .execute(
                    "SELECT * FROM plans WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?",
                    [Task_plan, Task_app_Acronym]
                )
                .then(([results]) => results[0]);

            if (!plan) {
                throw new Error(
                    "Plan not found or does not belong to this application"
                );
            }
        }

        // Generate Task_id
        const taskId = await generateTaskId(Task_app_Acronym, connection);

        // Create audit trail
        const auditNotes = appendAuditNote("", username, "Open", notes);

        await connection.execute(
            `INSERT INTO tasks (
                Task_id, Task_name, Task_description, Task_notes, Task_plan,
                Task_app_Acronym, Task_state, Task_creator, Task_owner
            ) VALUES (?, ?, ?, ?, ?, ?, 'Open', ?, ?)`,
            [
                taskId,
                Task_name,
                Task_description,
                auditNotes,
                Task_plan || null,
                Task_app_Acronym,
                username,
                null
            ]
        );

        return {
            Task_id: taskId,
            Task_name,
            Task_description,
            Task_app_Acronym,
            Task_state: "Open",
            Task_creator: username,
            Task_owner: null
        };
    });
};

/**
 * Get all tasks for an application.
 * Returns tasks ordered by creation date (newest first).
 *
 * @async
 * @param {string} appAcronym - Application acronym
 * @returns {Promise<Array>} Array of task objects
 */
export const getTasksByApp = async appAcronym => {
    const tasks = await query(
        "SELECT * FROM tasks WHERE Task_app_Acronym = ? ORDER BY Task_createDate DESC",
        [appAcronym]
    );

    return tasks || [];
};

/**
 * Get tasks filtered by application and state.
 * Returns tasks ordered by creation date (newest first).
 *
 * @async
 * @param {string} appAcronym - Application acronym
 * @param {string} state - Task state (Open, To-Do, Doing, Done, Closed)
 * @returns {Promise<Array>} Array of task objects matching the state
 */
export const getTasksByState = async (appAcronym, state) => {
    const tasks = await query(
        "SELECT * FROM tasks WHERE Task_app_Acronym = ? AND Task_state = ? ORDER BY Task_createDate DESC",
        [appAcronym, state]
    );

    return tasks || [];
};

/**
 * Get a single task by ID.
 * Returns complete task details including notes.
 *
 * @async
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Task object
 * @throws {Error} If task is not found
 */
export const getTaskById = async taskId => {
    const task = await query("SELECT * FROM tasks WHERE Task_id = ?", [
        taskId
    ]).then(results => results[0]);

    if (!task) {
        throw new Error("Task not found");
    }

    return task;
};

/**
 * Promote task to next state in workflow.
 * Workflow: Open → To-Do → Doing → Done → Closed
 * Uses pessimistic locking (FOR UPDATE) and optimistic validation (expected state).
 * Task_owner is set to current user when promoting To-Do → Doing.
 *
 * @async
 * @param {string} taskId - Task ID
 * @param {string} username - Username performing promotion
 * @param {string} notes - User notes for the promotion
 * @param {string} [expectedState] - Expected current state for race condition prevention
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If task not found, state changed, or already in final state
 */
export const promoteTaskState = async (
    taskId,
    username,
    notes,
    expectedState = null
) => {
    return await withTransaction(async connection => {
        // Lock the row for update to prevent race conditions
        const task = await connection
            .execute("SELECT * FROM tasks WHERE Task_id = ? FOR UPDATE", [
                taskId
            ])
            .then(([results]) => results[0]);

        if (!task) {
            throw new Error("Task not found");
        }

        // Validate the task is in the expected state
        if (expectedState && task.Task_state !== expectedState) {
            throw new Error(
                `Task state has changed from ${expectedState} to ${task.Task_state}. Please refresh and try again.`
            );
        }

        const previousState = task.Task_state;

        // Determine next state
        let newState;
        switch (task.Task_state) {
            case "Open":
                newState = "To-Do";
                break;
            case "To-Do":
                newState = "Doing";
                break;
            case "Doing":
                newState = "Done";
                break;
            case "Done":
                newState = "Closed";
                break;
            default:
                throw new Error("Task is already in final state");
        }

        // Update audit trail
        const auditNotes = appendAuditNote(
            task.Task_notes,
            username,
            newState,
            notes,
            previousState
        );

        // Task_owner is only set when "Taking Task" (To-Do → Doing)
        const newOwner = previousState === "To-Do" ? username : task.Task_owner;

        // Update task (row is already locked with FOR UPDATE)
        await connection.execute(
            "UPDATE tasks SET Task_state = ?, Task_owner = ?, Task_notes = ? WHERE Task_id = ?",
            [newState, newOwner, auditNotes, taskId]
        );

        return {
            ...task,
            Task_state: newState,
            Task_owner: newOwner,
            Task_notes: auditNotes
        };
    });
};

/**
 * Demote task to previous state in workflow.
 * Allowed: Done → Doing, Doing → To-Do
 * Uses pessimistic locking (FOR UPDATE) and optimistic validation (expected state).
 * Task_owner is set to null when demoting Doing → To-Do.
 *
 * @async
 * @param {string} taskId - Task ID
 * @param {string} username - Username performing demotion
 * @param {string} notes - User notes for the demotion
 * @param {string} [expectedState] - Expected current state for race condition prevention
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If task not found, state changed, or cannot demote from current state
 */
export const demoteTaskState = async (
    taskId,
    username,
    notes,
    expectedState = null
) => {
    return await withTransaction(async connection => {
        // Lock the row for update to prevent race conditions
        const task = await connection
            .execute("SELECT * FROM tasks WHERE Task_id = ? FOR UPDATE", [
                taskId
            ])
            .then(([results]) => results[0]);

        if (!task) {
            throw new Error("Task not found");
        }

        // Validate the task is in the expected state
        if (expectedState && task.Task_state !== expectedState) {
            throw new Error(
                `Task state has changed from ${expectedState} to ${task.Task_state}. Please refresh and try again.`
            );
        }

        const previousState = task.Task_state;

        // Determine previous state
        let newState;
        switch (task.Task_state) {
            case "Doing":
                newState = "To-Do";
                break;
            case "Done":
                newState = "Doing";
                break;
            default:
                throw new Error("Cannot demote task from current state");
        }

        // Update audit trail
        const auditNotes = appendAuditNote(
            task.Task_notes,
            username,
            newState,
            notes,
            previousState
        );

        // Task_owner is set to null when "Dropping Task" (Doing → To-Do)
        // Otherwise keep current owner
        const newOwner = previousState === "Doing" ? null : task.Task_owner;

        // Update task (row is already locked with FOR UPDATE)
        await connection.execute(
            "UPDATE tasks SET Task_state = ?, Task_owner = ?, Task_notes = ? WHERE Task_id = ?",
            [newState, newOwner, auditNotes, taskId]
        );

        return {
            ...task,
            Task_state: newState,
            Task_owner: newOwner,
            Task_notes: auditNotes
        };
    });
};

/**
 * Update task's assigned plan.
 * Plan can only be changed when task is in Open or Done state.
 * Requires App_permit_Open permission (checked in middleware).
 * Validates plan belongs to same application.
 *
 * @async
 * @param {string} taskId - Task ID
 * @param {string} planName - New plan name (or null to remove plan)
 * @param {string} username - Username performing the update
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If task not found, plan invalid, or state doesn't allow plan change
 */
export const updateTaskPlan = async (taskId, planName, username) => {
    return await withTransaction(async connection => {
        const task = await connection
            .execute("SELECT * FROM tasks WHERE Task_id = ?", [taskId])
            .then(([results]) => results[0]);

        if (!task) {
            throw new Error("Task not found");
        }

        // Get the application to check permissions
        const app = await connection
            .execute("SELECT * FROM applications WHERE App_Acronym = ?", [
                task.Task_app_Acronym
            ])
            .then(([results]) => results[0]);

        if (!app) {
            throw new Error("Application not found");
        }

        // Plan can only be changed in Open, To-Do or Done state
        if (task.Task_state !== "Open" && task.Task_state !== "Done") {
            throw new Error(
                "Plan can only be changed when task is in Open or Done state"
            );
        }

        // Check if user has permission to change plan (must be in App_permit_Open)
        const permitOpenGroups = app.App_permit_Open || [];

        let hasPermission = false;
        for (const group of permitOpenGroups) {
            if (await checkGroup(username, group)) {
                hasPermission = true;
                break;
            }
        }

        if (!hasPermission) {
            throw new Error(
                "You don't have permission to change the plan for this task"
            );
        }

        // Check if plan has actually changed
        const currentPlan = task.Task_plan || null;
        const newPlan = planName || null;

        // If plan hasn't changed, just return the task without updating
        if (currentPlan === newPlan) {
            return await getTaskById(taskId);
        }

        // Validate plan exists and belongs to the same app
        if (planName) {
            const plan = await connection
                .execute(
                    "SELECT * FROM plans WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?",
                    [planName, task.Task_app_Acronym]
                )
                .then(([results]) => results[0]);

            if (!plan) {
                throw new Error(
                    "Plan not found or does not belong to this application"
                );
            }
        }

        // Update audit trail only if plan changed
        const note = planName ? `Plan assigned: ${planName}` : "Plan removed";
        const auditNotes = appendAuditNote(
            task.Task_notes,
            username,
            task.Task_state,
            note
        );

        await connection.execute(
            "UPDATE tasks SET Task_plan = ?, Task_notes = ? WHERE Task_id = ?",
            [planName || null, auditNotes, taskId]
        );

        return await getTaskById(taskId);
    });
};

/**
 * Add a note to a task.
 * Notes can be added to tasks in any state except Closed.
 *
 * @async
 * @param {string} taskId - Task ID
 * @param {string} note - Note text to add
 * @param {string} username - Username adding the note
 * @returns {Promise<Object>} Updated task object
 * @throws {Error} If task not found or task is in Closed state
 */
export const addTaskNote = async (taskId, note, username) => {
    return await withTransaction(async connection => {
        const task = await connection
            .execute("SELECT * FROM tasks WHERE Task_id = ?", [taskId])
            .then(([results]) => results[0]);

        if (!task) {
            throw new Error("Task not found");
        }

        // Prevent adding notes to closed tasks
        if (task.Task_state === "Closed") {
            throw new Error("Cannot add notes to closed tasks");
        }

        // Add user note to audit trail
        const auditNotes = appendAuditNote(
            task.Task_notes,
            username,
            task.Task_state,
            note
        );

        await connection.execute(
            "UPDATE tasks SET Task_notes = ? WHERE Task_id = ?",
            [auditNotes, taskId]
        );

        return await getTaskById(taskId);
    });
};
