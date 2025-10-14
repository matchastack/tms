import jwt from "jsonwebtoken";
import { config } from "./config/config.js";

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

    if (req.user.group?.toLowerCase() !== "admin") {
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

        const userRole = req.user.group?.toLowerCase();
        const hasPermission = allowedRoles.some(
            role => role.toLowerCase() === userRole
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

    const isAdmin = req.user.group?.toLowerCase() === "admin";
    const isSelf = parseInt(req.params.id, 10) === req.user.id;
    if (!isAdmin && !isSelf) {
        return res.status(403).json({
            success: false,
            message: "Access denied"
        });
    }
    next();
};
