/**
 * @fileoverview HTTP request handlers (controllers) for the TMS API.
 * Contains all controller functions that handle incoming requests and return responses.
 * Controllers extract data from requests, call service layer functions, and format responses.
 *
 * @requires nodemailer - For sending email notifications
 */

import nodemailer from "nodemailer";
import * as services from "./services.js";

// ============= AUTH CONTROLLERS =============

/**
 * Handle user login request.
 * Validates credentials, generates JWT token, and sets HTTP-only cookie.
 *
 * @async
 * @param {express.Request} req - Express request object with username and password in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with user data and success status
 *
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await services.loginUser(username, password);

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: null
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Handle user logout request.
 * Clears the JWT authentication cookie.
 *
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void} JSON response with success message
 *
 * @route POST /api/auth/logout
 * @access Protected (requires authentication)
 */
export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

// ============= USER CONTROLLERS =============

/**
 * Get current authenticated user's profile.
 * Returns username, email, and user groups for the logged-in user.
 *
 * @async
 * @param {express.Request} req - Express request object with authenticated user in req.user
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>} JSON response with user profile data
 *
 * @route GET /api/profile
 * @access Protected (requires authentication)
 */
export const getCurrentUser = async (req, res) => {
    try {
        const username = req.user.username;
        const user = await services.getUserByUsername(username);
        res.status(200).json({
            success: true,
            data: {
                username: user.username,
                email: user.email,
                groups: user.userGroups
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile"
        });
    }
};

/**
 * Update current authenticated user's profile.
 * Allows users to update their email and password.
 *
 * @async
 * @param {express.Request} req - Express request object with email, currentPassword, and password in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated user data
 *
 * @route PUT /api/profile
 * @access Protected (requires authentication)
 */
export const updateCurrentUser = async (req, res, next) => {
    try {
        const username = req.user.username;
        const { email, currentPassword, password } = req.body;

        const updatedUser = await services.updateUserProfile(username, {
            email,
            currentPassword,
            password
        });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============= ADMIN CONTROLLERS =============

/**
 * Get all user accounts.
 * Returns a list of all user accounts in the system.
 *
 * @async
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with array of user accounts
 *
 * @route GET /api/accounts
 * @access Protected (requires admin role)
 */
export const getAccounts = async (req, res, next) => {
    try {
        const accounts = await services.getAllAccounts();
        res.status(200).json({
            success: true,
            data: accounts,
            message: "Accounts retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve accounts"
        });
    }
};

/**
 * Create a new user account.
 * Creates a new account with username, email, password, user groups, and active status.
 *
 * @async
 * @param {express.Request} req - Express request object with account data in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with created account data
 *
 * @route POST /api/accounts
 * @access Protected (requires admin role)
 */
export const createAccount = async (req, res, next) => {
    try {
        const { username, email, password, userGroups, isActive } = req.body;

        const newAccount = await services.createAccount({
            username,
            email,
            password,
            userGroups,
            isActive
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: newAccount
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update an existing user account.
 * Updates account fields including email, password, user groups, and active status.
 * Protects root admin account from being deactivated or losing admin privileges.
 *
 * @async
 * @param {express.Request} req - Express request object with account update data in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated account data
 *
 * @route PUT /api/accounts
 * @access Protected (requires admin role)
 */
export const updateAccount = async (req, res, next) => {
    try {
        const { username, email, password, userGroups, isActive, newUsername } =
            req.body;

        const updatedAccount = await services.updateAccount(username, {
            email,
            password,
            userGroups,
            isActive,
            newUsername
        });

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            data: updatedAccount
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all user groups.
 * Returns a list of all available user groups in the system.
 *
 * @async
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with array of user group names
 *
 * @route GET /api/user_groups
 * @access Protected (requires authentication)
 */
export const getUserGroups = async (req, res, next) => {
    try {
        const groups = await services.getAllUserGroups();
        res.status(200).json({
            success: true,
            data: groups,
            message: "User groups retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user groups"
        });
    }
};

/**
 * Create a new user group.
 * Creates a new user group with the specified name.
 *
 * @async
 * @param {express.Request} req - Express request object with groupName in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with created group data
 *
 * @route POST /api/user_groups
 * @access Protected (requires admin role)
 */
export const createGroup = async (req, res, next) => {
    try {
        const { groupName } = req.body;
        const newGroup = await services.createGroup(groupName.trim());
        res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: newGroup
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============= APPLICATION CONTROLLERS =============

/**
 * Create a new application.
 * Creates a new TMS application with permissions and metadata.
 *
 * @async
 * @param {express.Request} req - Express request object with application data in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with created application data
 *
 * @route POST /api/applications
 * @access Protected (requires project lead role)
 */
export const createApplication = async (req, res, next) => {
    try {
        const newApp = await services.createApplication(req.body);
        res.status(201).json({
            success: true,
            message: "Application created successfully",
            data: newApp
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all applications.
 * Returns a list of all applications in the system.
 *
 * @async
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with array of applications
 *
 * @route GET /api/applications
 * @access Protected (requires authentication)
 */
export const getApplications = async (req, res, next) => {
    try {
        const apps = await services.getAllApplications();
        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single application by acronym.
 * Returns detailed information about a specific application.
 *
 * @async
 * @param {express.Request} req - Express request object with acronym in params
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with application data
 *
 * @route GET /api/applications/:acronym
 * @access Protected (requires authentication)
 */
export const getApplicationByAcronym = async (req, res, next) => {
    try {
        const { acronym } = req.params;
        const app = await services.getApplicationByAcronym(acronym);
        res.status(200).json({
            success: true,
            data: app
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update an existing application.
 * Updates application metadata and permissions.
 *
 * @async
 * @param {express.Request} req - Express request object with acronym in params and update data in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated application data
 *
 * @route PUT /api/applications/:acronym
 * @access Protected (requires project lead role)
 */
export const updateApplication = async (req, res, next) => {
    try {
        const { acronym } = req.params;
        const updatedApp = await services.updateApplication(acronym, req.body);
        res.status(200).json({
            success: true,
            message: "Application updated successfully",
            data: updatedApp
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============= PLAN CONTROLLERS =============

/**
 * Create a new plan.
 * Creates a new plan associated with an application.
 *
 * @async
 * @param {express.Request} req - Express request object with plan data in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with created plan data
 *
 * @route POST /api/plans
 * @access Protected (requires project manager role)
 */
export const createPlan = async (req, res, next) => {
    try {
        const newPlan = await services.createPlan(req.body);
        res.status(201).json({
            success: true,
            message: "Plan created successfully",
            data: newPlan
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all plans for an application.
 * Returns a list of plans associated with a specific application.
 *
 * @async
 * @param {express.Request} req - Express request object with app_acronym in params
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with array of plans
 *
 * @route GET /api/plans/:app_acronym
 * @access Protected (requires authentication)
 */
export const getPlans = async (req, res, next) => {
    try {
        const { app_acronym } = req.params;
        const plans = await services.getPlansByApp(app_acronym);
        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: "Failed to retrieve plans"
        });
    }
};

/**
 * Get a single plan by name.
 * Returns detailed information about a specific plan.
 *
 * @async
 * @param {express.Request} req - Express request object with name in params
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with plan data
 *
 * @route GET /api/plan/:name
 * @access Protected (requires authentication)
 */
export const getPlan = async (req, res, next) => {
    try {
        const { name } = req.params;
        const plan = await services.getPlanByName(name);
        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// ============= TASK CONTROLLERS =============

/**
 * Create a new task.
 * Creates a new task in the Open state with auto-generated task ID.
 *
 * @async
 * @param {express.Request} req - Express request object with task data in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with created task data
 *
 * @route POST /api/tasks
 * @access Protected (requires App_permit_Create permission)
 */
export const createTask = async (req, res, next) => {
    try {
        const username = req.user.username;
        const newTask = await services.createTask(req.body, username);
        res.status(200).json({
            status: "S_1",
            data: newTask
        });
    } catch (error) {
        // Map service errors to status codes
        if (error.message === "TR_1") {
            return res.status(400).json({
                status: "TR_1"
            });
        }
        if (error.message === "P_3") {
            return res.status(400).json({
                status: "P_3"
            });
        }
        if (error.message === "TR_2") {
            return res.status(400).json({
                status: "TR_2"
            });
        }
        // Catch-all for unspecified errors
        return res.status(400).json({
            status: "UE"
        });
    }
};

/**
 * Get tasks for an application.
 * Returns tasks filtered by application and optionally by state.
 *
 * @async
 * @param {express.Request} req - Express request object with app_acronym in params and optional state in query
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with array of tasks
 *
 * @route GET /api/tasks/:app_acronym?state=<state>
 * @access Protected (requires authentication)
 */
export const getTasks = async (req, res, next) => {
    try {
        const { app_acronym } = req.params;
        const { state } = req.query;

        let tasks;
        if (state) {
            tasks = await services.getTasksByState(app_acronym, state);
        } else {
            tasks = await services.getTasksByApp(app_acronym);
        }

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: "Failed to retrieve tasks"
        });
    }
};

/**
 * Get a single task by ID.
 * Returns detailed information about a specific task.
 *
 * @async
 * @param {express.Request} req - Express request object with task_id in params
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with task data
 *
 * @route GET /api/task/:task_id
 * @access Protected (requires authentication)
 */
export const getTask = async (req, res, next) => {
    try {
        const { task_id } = req.params;
        const task = await services.getTaskById(task_id);
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const getTasksByState = async (req, res, next) => {
    try {
        const { state } = req.params;
        const tasks = await services.getAllTasksByState(state);
        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Promote task to next state.
 * Advances task through workflow: Open → To-Do → Doing → Done → Closed.
 * Sends email notification when task reaches "Done" state.
 *
 * @async
 * @param {express.Request} req - Express request object with task_id, notes, and expected_state in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated task data
 *
 * @route POST /api/tasks/promote
 * @access Protected (requires state-specific permission)
 */
export const promoteTask = async (req, res, next) => {
    try {
        const { task_id, notes, expected_state } = req.body;
        const username = req.user.username;
        const updatedTask = await services.promoteTaskState(
            task_id,
            username,
            notes,
            expected_state
        );

        // If promoted to "Done", send email notification
        if (updatedTask.Task_state === "Done") {
            try {
                // Get application details to find users to notify
                const app = await services.getApplicationByAcronym(
                    updatedTask.Task_app_Acronym
                );

                // Get all accounts to find users in App_permit_Done group
                const allAccounts = await services.getAllAccounts();
                const permitDoneGroups = app.App_permit_Done || [];

                // Find users who are in any of the permit_Done groups
                const usersToNotify = allAccounts.filter(account => {
                    const userGroups = account.userGroups || [];
                    return permitDoneGroups.some(group =>
                        userGroups.includes(group)
                    );
                });

                // Get email addresses
                const emailAddresses = usersToNotify
                    .map(user => user.email)
                    .filter(email => email);

                if (emailAddresses.length > 0) {
                    const transporter = nodemailer.createTransport({
                        host: "smtp.ethereal.email",
                        port: 587,
                        auth: {
                            user: process.env.EMAIL_USERNAME,
                            pass: process.env.EMAIL_PASSWORD
                        }
                    });

                    const mailOptions = {
                        from: process.env.EMAIL_USERNAME,
                        to: emailAddresses.join(", "),
                        subject: `Task ${updatedTask.Task_id} Ready for Review`,
                        text: `Task "${updatedTask.Task_name}" (${
                            updatedTask.Task_id
                        }) has been moved to "Done" state and is ready for approval.\n\nApplication: ${
                            updatedTask.Task_app_Acronym
                        }\nTask Owner: ${
                            updatedTask.Task_owner || "N/A"
                        }\n\nPlease review and approve or reject the task.`,
                        html: `<h2>Task Ready for Review</h2>
                        <p>Task <strong>"${updatedTask.Task_name}"</strong> (${
                            updatedTask.Task_id
                        }) has been moved to <strong>"Done"</strong> state and is ready for approval.</p>
                        <ul>
                            <li><strong>Application:</strong> ${
                                updatedTask.Task_app_Acronym
                            }</li>
                            <li><strong>Task Owner:</strong> ${
                                updatedTask.Task_owner || "N/A"
                            }</li>
                        </ul>
                        <p>Please review and approve or reject the task.</p>`
                    };

                    await transporter.sendMail(mailOptions);
                }
            } catch (emailError) {
                // Log email error but don't fail the task promotion
                console.error("Failed to send email notification:", emailError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Task promoted successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const PromoteTask2Done = async (req, res, next) => {
    try {
        const { task_id, notes } = req.body;
        const username = req.user.username;
        const updatedTask = await services.promoteTask2Done(
            task_id,
            username,
            notes
        );

        // Send email notification
        try {
            // Get application details to find users to notify
            const app = await services.getApplicationByAcronym(
                updatedTask.Task_app_Acronym
            );

            // Get all accounts to find users in App_permit_Done group
            const allAccounts = await services.getAllAccounts();
            const permitDoneGroups = app.App_permit_Done || [];

            // Find users who are in any of the permit_Done groups
            const usersToNotify = allAccounts.filter(account => {
                const userGroups = account.userGroups || [];
                return permitDoneGroups.some(group =>
                    userGroups.includes(group)
                );
            });

            // Get email addresses
            const emailAddresses = usersToNotify
                .map(user => user.email)
                .filter(email => email);

            if (emailAddresses.length > 0) {
                const transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    auth: {
                        user: process.env.EMAIL_USERNAME,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USERNAME,
                    to: emailAddresses.join(", "),
                    subject: `Task ${updatedTask.Task_id} Ready for Review`,
                    text: `Task "${updatedTask.Task_name}" (${
                        updatedTask.Task_id
                    }) has been moved to "Done" state and is ready for approval.\n\nApplication: ${
                        updatedTask.Task_app_Acronym
                    }\nTask Owner: ${
                        updatedTask.Task_owner || "N/A"
                    }\n\nPlease review and approve or reject the task.`,
                    html: `<h2>Task Ready for Review</h2>
                    <p>Task <strong>"${updatedTask.Task_name}"</strong> (${
                        updatedTask.Task_id
                    }) has been moved to <strong>"Done"</strong> state and is ready for approval.</p>
                    <ul>
                        <li><strong>Application:</strong> ${
                            updatedTask.Task_app_Acronym
                        }</li>
                        <li><strong>Task Owner:</strong> ${
                            updatedTask.Task_owner || "N/A"
                        }</li>
                    </ul>
                    <p>Please review and approve or reject the task.</p>`
                };

                await transporter.sendMail(mailOptions);
            }
        } catch (emailError) {
            // Log email error but don't fail the task promotion
            console.error("Failed to send email notification:", emailError);
        }

        res.status(200).json({
            success: true,
            message: "Task promoted to Done successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Demote task to previous state.
 * Moves task backward in workflow: Done → Doing or Doing → To-Do.
 *
 * @async
 * @param {express.Request} req - Express request object with task_id, notes, and expected_state in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated task data
 *
 * @route POST /api/tasks/demote
 * @access Protected (requires state-specific permission)
 */
export const demoteTask = async (req, res, next) => {
    try {
        const { task_id, notes, expected_state } = req.body;
        const username = req.user.username;
        const updatedTask = await services.demoteTaskState(
            task_id,
            username,
            notes,
            expected_state
        );
        res.status(200).json({
            success: true,
            message: "Task demoted successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update task details.
 * Allows updating task plan (Open/Done state only) and adding notes.
 *
 * @async
 * @param {express.Request} req - Express request object with task_id, plan_name, and notes in body
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated task data
 *
 * @route PUT /api/tasks
 * @access Protected (requires authentication, plan changes require App_permit_Open)
 */
export const updateTask = async (req, res, next) => {
    try {
        const { task_id, plan_name, notes } = req.body;
        const username = req.user.username;

        let updatedTask;

        // If notes are provided, add them
        if (notes && notes.trim()) {
            updatedTask = await services.addTaskNote(task_id, notes, username);
        }

        // If plan_name is provided (could be changed or same), update plan
        if (plan_name !== undefined) {
            updatedTask = await services.updateTaskPlan(
                task_id,
                plan_name,
                username
            );
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
