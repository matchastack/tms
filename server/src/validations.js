import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import * as services from "./services.js";

const userHasGroup = (user, groupName) => {
    const userGroups = user.groups || [];
    return userGroups.some(
        group => group.toLowerCase() === groupName.toLowerCase()
    );
};

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

export const validateEmail = email => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

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

export const authenticateToken = async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token required"
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        // Verify token payload against database
        const user = await services.getUserByUsername(decoded.username);

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated"
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
                success: false,
                message: "Token expired"
            });
        }
        if (error.message === "User not found") {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(403).json({
            success: false,
            message: "Invalid token"
        });
    }
};

/**
 * Generalized user group validation middleware factory
 * @param {string|string[]} groups - Single group or array of groups (OR logic)
 * @param {Function} selfCheck - Optional callback(req) => boolean to check if user is accessing own resource
 * @returns {Function} Express middleware function
 *
 * Examples:
 * - requireUserGroup('admin') - requires admin group
 * - requireUserGroup(['admin', 'project manager']) - requires admin OR project manager
 * - requireUserGroup('admin', (req) => req.body.username === req.user.username) - requires admin OR self
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
        const hasGroup = allowedGroups.some(group => userHasGroup(req.user, group));

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
            message: "Application acronym is required"
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

    for (const perm of permissions) {
        if (!Array.isArray(perm.field) || perm.field.length === 0) {
            return res.status(400).json({
                success: false,
                message: `${perm.name} must be an array with at least one group`
            });
        }
    }

    next();
};

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

    for (const perm of permissions) {
        if (!Array.isArray(perm.field) || perm.field.length === 0) {
            return res.status(400).json({
                success: false,
                message: `${perm.name} must be an array with at least one group`
            });
        }
    }

    next();
};

export const validatePlanCreation = (req, res, next) => {
    const { Plan_MVP_name, Plan_app_Acronym } = req.body;

    if (!Plan_MVP_name || !Plan_MVP_name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Plan name is required"
        });
    }

    if (!Plan_app_Acronym || !Plan_app_Acronym.trim()) {
        return res.status(400).json({
            success: false,
            message: "Application acronym is required"
        });
    }

    next();
};

export const validateTaskCreation = (req, res, next) => {
    const { Task_name, Task_app_Acronym } = req.body;

    if (!Task_name || !Task_name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Task name is required"
        });
    }

    if (!Task_app_Acronym || !Task_app_Acronym.trim()) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Application acronym is required"
        });
    }

    // Normalize appAcronym for subsequent middleware
    req.body.appAcronym = Task_app_Acronym;

    next();
};

export const requirePermitGroup = permitField => {
    return async (req, res, next) => {
        try {
            const { appAcronym, task_id } = req.body;

            // If task_id is provided, get the app acronym from the task
            if (task_id && !appAcronym) {
                const task = await services.getTaskById(task_id);
                appAcronym = task.Task_app_Acronym;
            }

            if (!appAcronym) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Require Permit Error: Application acronym is required"
                });
            }

            // Get application to check permissions
            const app = await services.getApplicationByAcronym(appAcronym);
            const requiredGroups = app[permitField];

            if (
                !requiredGroups ||
                !Array.isArray(requiredGroups) ||
                requiredGroups.length === 0
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Permission groups not configured for this operation"
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
                    success: false,
                    message: `Permission denied. Required groups: ${requiredGroups.join(
                        ", "
                    )}`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
};
