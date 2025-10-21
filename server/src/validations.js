import jwt from "jsonwebtoken";
import { config } from "./config/config.js";

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

export const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username) {
        errors.push("Username is required");
    }

    if (!password) {
        errors.push("Password is required");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const validateAccountCreation = (req, res, next) => {
    const { username, email, password, userGroups } = req.body;
    const errors = [];

    if (!username) {
        errors.push("Username is required");
    }

    if (!email) {
        errors.push("Email is required");
    }

    if (!password) {
        errors.push("Password is required");
    } else {
        const passwordError = validatePassword(password);
        if (passwordError) {
            errors.push(passwordError);
        }
    }

    if (!userGroups || userGroups.length === 0) {
        errors.push("At least one user group is required");
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

export const validateAccountUpdate = (req, res, next) => {
    const { password } = req.body;
    const errors = [];

    if (password) {
        const passwordError = validatePassword(password);
        if (passwordError) {
            errors.push(passwordError);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token required"
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired"
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
    const targetIsRootAdmin = req.body.username === "admin";
    const requesterIsRootAdmin = req.user.username === "admin";

    if (targetIsRootAdmin && !requesterIsRootAdmin) {
        return res.status(403).json({
            success: false,
            message: "Cannot modify root admin account"
        });
    }

    if (!isAdmin && !isSelf) {
        return res.status(403).json({
            success: false,
            message: "Access denied"
        });
    }
    next();
};
