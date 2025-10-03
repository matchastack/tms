import * as authService from "../services/authService.js";

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide username and password",
            });
        }

        const result = await authService.loginUser(username, password);

        res.json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const logout = (req, res) => {
    res.json({
        success: true,
        message: "Logout successful",
    });
};
