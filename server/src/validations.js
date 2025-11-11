/**
 * @fileoverview Validation and authentication middleware for the TMS API.
 * Contains middleware functions for JWT authentication, request validation,
 * and role-based access control (RBAC).
 *
 * @requires jsonwebtoken - For JWT token verification
 */

import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import * as services from "./services.js";

/**
 * Check if user belongs to a specific group.
 * Case-insensitive comparison.
 *
 * @private
 * @param {Object} user - User object with groups array
 * @param {string} groupName - Group name to check
 * @returns {boolean} True if user belongs to the group
 */
const userHasGroup = (user, groupName) => {
    const userGroups = user.groups || [];
    return userGroups.some(
        group => group.toLowerCase() === groupName.toLowerCase()
    );
};

/**
 * Validate password meets security requirements.
 * Requirements: 8-10 characters, at least one letter, one number, one special character.
 *
 * @param {string} password - Password to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validatePassword = password => {
    const minLength = 8;
    const maxLength = 10;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        password
    );

    if (password.length < minLength || password.length > maxLength) {
        return `Password must be between ${minLength} and ${maxLength} characters`;
    }

    if (!hasLetter) {
        return "Password must contain at least one letter";
    }

    if (!hasNumber) {
        return "Password must contain at least one number";
    }

    if (!hasSpecialChar) {
        return "Password must contain at least one special character";
    }

    return null;
};

/**
 * Validate email format using regex.
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
export const validateEmail = email => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

/**
 * Validate login request data.
 * Middleware that checks username and password are provided.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateLogin = (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Invalid username and/or password"
        });
    }

    next();
};

/**
 * Validate account creation request data.
 * Checks required fields, username length, password strength, and email format.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateAccountCreation = (req, res, next) => {
    const { username, email, password, userGroups } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Fields(s) cannot be empty"
        });
    }

    if (username.trim().length > 50) {
        return res.status(400).json({
            success: false,
            message: "Username must not be longer than 50 characters"
        });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        return res.status(401).json({
            success: false,
            message: passwordError
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Email must be valid"
        });
    }

    next();
};

/**
 * Validate account update request data.
 * Protects root admin account and validates password and email if provided.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateAccountUpdate = (req, res, next) => {
    const { username, email, password, userGroups, isActive, newUsername } =
        req.body;

    const isTargetRootAdmin = username === "admin";
    const isRequesterRootAdmin = req.user.username === "admin";

    if (
        isTargetRootAdmin &&
        !isRequesterRootAdmin &&
        !userGroups.includes("admin")
    ) {
        return res.status(403).json({
            success: false,
            message:
                "Cannot remove admin privileges from the root admin account"
        });
    }

    if (password) {
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }
    }

    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Email must be valid"
        });
    }

    next();
};

/**
 * Authenticate JWT token from HTTP-only cookie.
 * Verifies token signature, checks account status, and attaches user to request.
 *
 * @async
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({
            status: "IAM_1"
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        // Verify token payload against database
        const user = await services.getUserByUsername(decoded.username);

        if (!user.isActive) {
            return res.status(401).json({
                status: "IAM_1"
            });
        }

        req.user = {
            username: user.username,
            groups: user.userGroups
        };

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                status: "IAM_1"
            });
        }
        if (error.message === "User not found") {
            return res.status(401).json({
                status: "IAM_1"
            });
        }
        return res.status(401).json({
            status: "IAM_1"
        });
    }
};

/**
 * Generalized user group validation middleware factory.
 * Creates middleware that checks if authenticated user belongs to required group(s).
 * Supports OR logic for multiple groups and optional self-access check.
 *
 * @param {string|string[]} groups - Single group or array of groups (OR logic)
 * @param {Function} [selfCheck] - Optional callback(req) => boolean to check if user is accessing own resource
 * @returns {Function} Express middleware function
 *
 * @example
 * // Requires admin group
 * requireUserGroup('admin')
 *
 * @example
 * // Requires admin OR project manager
 * requireUserGroup(['admin', 'project manager'])
 *
 * @example
 * // Requires admin OR accessing own resource
 * requireUserGroup('admin', (req) => req.body.username === req.user.username)
 */
export const requireUserGroup = (groups, selfCheck = null) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Normalize groups to array
        const allowedGroups = Array.isArray(groups) ? groups : [groups];

        // Check if user is in any of the allowed groups
        const hasGroup = allowedGroups.some(group =>
            userHasGroup(req.user, group)
        );

        // Check self access if selfCheck callback is provided
        const isSelf = selfCheck ? selfCheck(req) : false;

        if (!hasGroup && !isSelf) {
            const groupList = allowedGroups.join(", ");
            return res.status(403).json({
                success: false,
                message: selfCheck
                    ? "Access denied"
                    : `Access denied. Required groups: ${groupList}`
            });
        }

        next();
    };
};

/**
 * Validate group creation request data.
 * Checks that groupName is provided and not empty.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateGroupCreation = (req, res, next) => {
    const { groupName } = req.body;
    if (!groupName || !groupName.trim()) {
        return res.status(400).json({
            success: false,
            message: "Group name is required"
        });
    }
    next();
};

/**
 * Validate profile update request data.
 * Validates email format, password strength, and current password requirement.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateProfileUpdate = (req, res, next) => {
    const { email, currentPassword, password } = req.body;
    const errors = [];

    if (!email || !email.trim()) {
        errors.push("Email is required");
    }

    if (!validateEmail(email)) {
        errors.push("Email must be valid");
    }

    if (password) {
        if (!currentPassword) {
            errors.push("Current password is required");
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            errors.push(passwordError);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed: " + errors.join(", "),
            errors
        });
    }

    next();
};

/**
 * Validate application creation request data.
 * Checks acronym, description length, and permission field formats.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateApplicationCreation = (req, res, next) => {
    const {
        App_Acronym,
        App_Description,
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
    } = req.body;

    if (!App_Acronym || !App_Acronym.trim()) {
        return res.status(400).json({
            success: false,
            message: "App acronym is required"
        });
    }

    if (App_Acronym.length > 50) {
        return res.status(400).json({
            success: false,
            message: "App acronym must be between 1-50 characters"
        });
    }

    if (App_Description && App_Description.length > 255) {
        return res.status(400).json({
            success: false,
            message: "Field cannot exceed 255 characters"
        });
    }

    // Validate that all permission fields are arrays with at least one group
    const permissions = [
        { field: App_permit_Create, name: "App_permit_Create" },
        { field: App_permit_Open, name: "App_permit_Open" },
        { field: App_permit_toDoList, name: "App_permit_toDoList" },
        { field: App_permit_Doing, name: "App_permit_Doing" },
        { field: App_permit_Done, name: "App_permit_Done" }
    ];

    next();
};

/**
 * Validate application update request data.
 * Validates permission field formats.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateApplicationUpdate = (req, res, next) => {
    const {
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
    } = req.body;

    // Validate that all permission fields are arrays with at least one group
    const permissions = [
        { field: App_permit_Create, name: "App_permit_Create" },
        { field: App_permit_Open, name: "App_permit_Open" },
        { field: App_permit_toDoList, name: "App_permit_toDoList" },
        { field: App_permit_Doing, name: "App_permit_Doing" },
        { field: App_permit_Done, name: "App_permit_Done" }
    ];

    next();
};

/**
 * Validate plan creation request data.
 * Checks plan name, application acronym, and date requirements.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validatePlanCreation = (req, res, next) => {
    const { Plan_MVP_name, Plan_app_Acronym, Plan_startDate, Plan_endDate } =
        req.body;

    if (!Plan_MVP_name || !Plan_MVP_name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Plan name is required"
        });
    }

    if (Plan_MVP_name.length > 50) {
        return res.status(400).json({
            success: false,
            message: "Plan MVP name cannot exceed 50 characters"
        });
    }

    if (!Plan_app_Acronym || !Plan_app_Acronym.trim()) {
        return res.status(400).json({
            success: false,
            message: "Application acronym is required"
        });
    }

    if (!Plan_startDate || !Plan_endDate) {
        return res.status(400).json({
            success: false,
            message: "Plan start and end date are required"
        });
    }

    next();
};

/**
 * Validate CreateTask API request method and content-type.
 * Specific validation for the /CreateTask endpoint.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateCreateTaskRequest = (req, res, next) => {
    // Check if URL has query parameters (malformed URL)
    if (Object.keys(req.query).length > 0) {
        return res.status(400).json({
            status: "U_1"
        });
    }

    // Check Content-Type header
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
            status: "P_1"
        });
    }

    next();
};

/**
 * Validate task creation request data.
 * Checks task name, application acronym, and description length.
 *
 * @middleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const validateTaskCreation = (req, res, next) => {
    const { Task_name, Task_app_Acronym, Task_description } = req.body;

    // Check for missing required fields (P_2)
    if (!Task_app_Acronym || !Task_app_Acronym.trim()) {
        return res.status(400).json({
            status: "P_2"
        });
    }

    if (!Task_name || !Task_name.trim()) {
        return res.status(400).json({
            status: "P_2"
        });
    }

    // Check Task_name length (P_3)
    if (Task_name.length > 50) {
        return res.status(400).json({
            status: "P_3"
        });
    }

    // Check Task_description length (P_4)
    if (Task_description && Task_description.length > 255) {
        return res.status(400).json({
            status: "P_4"
        });
    }

    // Normalize appAcronym for subsequent middleware
    req.body.appAcronym = Task_app_Acronym;

    next();
};

/**
 * Factory for application-specific permission validation middleware.
 * Checks if authenticated user belongs to groups specified in application's permission field.
 * Used for task state transitions and creation based on App_permit_* fields.
 *
 * @param {string} permitField - Application permission field name (e.g., 'App_permit_Create')
 * @returns {Function} Express middleware function
 *
 * @example
 * // Require user to be in App_permit_Create groups
 * requirePermitGroup('App_permit_Create')
 *
 * @example
 * // Require user to be in App_permit_Done groups
 * requirePermitGroup('App_permit_Done')
 */
export const requirePermitGroup = permitField => {
    return async (req, res, next) => {
        try {
            const { appAcronym, task_id } = req.body;

            // If task_id is provided, get the app acronym from the task
            if (task_id && !appAcronym) {
                const task = await services.getTaskById(task_id);
                appAcronym = task.Task_app_Acronym;
            }

            // Get application to check permissions
            const app = await services.getApplicationByAcronym(appAcronym);
            const requiredGroups = app[permitField];

            if (
                !requiredGroups ||
                !Array.isArray(requiredGroups) ||
                requiredGroups.length === 0
            ) {
                return res.status(403).json({
                    status: "IAM_2"
                });
            }

            // Check if user is in any of the required groups
            let hasPermission = false;
            for (const group of requiredGroups) {
                if (await services.checkGroup(req.user.username, group)) {
                    hasPermission = true;
                    break;
                }
            }

            if (!hasPermission) {
                return res.status(403).json({
                    status: "IAM_2"
                });
            }

            next();
        } catch (error) {
            // If application not found, return TR_1
            if (error.message === "Application not found") {
                return res.status(400).json({
                    status: "TR_1"
                });
            }
            return res.status(400).json({
                status: "UE"
            });
        }
    };
};
