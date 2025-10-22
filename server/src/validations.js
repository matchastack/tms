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

    return (
        password.length < minLength &&
        password.length > maxLength &&
        !hasLetter &&
        !hasNumber &&
        !hasSpecialChar
    );
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

    if (!validatePassword(password)) {
        return res.status(401).json({
            success: false,
            message:
                "Password must be 8-10 characters long and include at least one letter, one number, and one special character"
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
        if (!validatePassword(password)) {
            return res.status(401).json({
                success: false,
                message:
                    "Password must be 8-10 characters long and include at least one letter, one number, and one special character"
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
        if (!validatePassword(password)) {
            errors.push(
                "Password must be 8-10 characters long and include at least one letter, one number, and one special character"
            );
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
