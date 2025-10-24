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

        const jwtGroups = JSON.stringify((decoded.groups || []).sort());
        const dbGroups = JSON.stringify((user.userGroups || []).sort());

        if (jwtGroups !== dbGroups) {
            return res.status(403).json({
                success: false,
                message: "Token permissions outdated. Please login again"
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

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    if (!userHasGroup(req.user, "admin")) {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const hasPermission = allowedRoles.some(role =>
            userHasGroup(req.user, role)
        );
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions"
            });
        }

        next();
    };
};

export const requireSelfOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    const isAdmin = userHasGroup(req.user, "admin");
    const isSelf = req.body.username === req.user.username;

    if (!isAdmin && !isSelf) {
        return res.status(403).json({
            success: false,
            message: "Access denied"
        });
    }
    next();
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
