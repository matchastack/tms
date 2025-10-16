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

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.json({
        success: true,
        message: "Logout successful"
    });
};

export const getCurrentUser = async (req, res) => {
    res.json({
        success: true,
        data: {
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
        const { username, email, password, userGroups, isActive } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email and password are required"
            });
        }

        const newAccount = await services.createAccount({
            username,
            email,
            password,
            userGroups: Array.isArray(userGroups) ? userGroups : []
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: newAccount
        });
    } catch (error) {
        next(error);
    }
};

export const updateAccount = async (req, res, next) => {
    try {
        const { username } = req.params;
        const { email, password, userGroups, isActive, newUsername } = req.body;

        const updatedAccount = await services.updateAccount(username, {
            email,
            password,
            userGroups: Array.isArray(userGroups) ? userGroups : [],
            isActive,
            newUsername
        });

        res.json({
            success: true,
            message: "Account updated successfully",
            data: updatedAccount
        });
    } catch (error) {
        next(error);
    }
};
