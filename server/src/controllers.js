import * as services from "./services.js";

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

export const getAccounts = async (req, res, next) => {
    try {
        const accounts = await services.getAllAccounts();
        res.status(200).json({
            success: true,
            data: accounts,
            message: "Accounts retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req, res, next) => {
    try {
        const { username, email, password, userGroups, isActive } = req.body;

        const newAccount = await services.createAccount({
            username,
            email,
            password,
            userGroups: Array.isArray(userGroups) ? userGroups : [], // TODO: default should be handled at higher level or frontend
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

export const updateAccount = async (req, res, next) => {
    try {
        const { username, email, password, userGroups, isActive, newUsername } =
            req.body;

        const updatedAccount = await services.updateAccount(username, {
            email,
            password,
            userGroups: Array.isArray(userGroups) ? userGroups : [], // TODO: default should be handled at higher level or frontend
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

export const getUserGroups = async (req, res, next) => {
    try {
        const groups = await services.getAllUserGroups();
        res.status(200).json({
            success: true,
            data: groups,
            message: "User groups retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};

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
        next(error);
    }
};

// ============= APPLICATION CONTROLLERS =============

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

