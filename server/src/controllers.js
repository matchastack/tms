import * as services from "./services.js";

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide username and password"
            });
        }

        const result = await services.loginUser(username, password);

        res.json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token required"
            });
        }

        const result = await services.refreshAccessToken(refreshToken);

        res.json({
            success: true,
            message: "Token refreshed successfully",
            data: result
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = (req, res) => {
    res.json({
        success: true,
        message: "Logout successful"
    });
};

export const getCurrentUser = async (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            group: req.user.group
        }
    });
};

export const getAccounts = async (req, res, next) => {
    try {
        const accounts = await services.getAllAccounts();
        res.json({
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
        const { username, email, password, userGroup } = req.body;

        if (!username || !email || !password || !userGroup) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const result = await services.createAccount({
            username,
            email,
            password,
            userGroup
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};
