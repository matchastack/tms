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
            errors,
        });
    }

    next();
};
