import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { findUserByName } from "../models/userModel.js";

export const loginUser = async (username, password) => {
    const user = await findUserByName(username);

    if (!user) {
        throw new Error("User does not exist");
    }

    const isPasswordValid = password === user.password;
    // const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
    };
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        throw new Error("Invalid token");
    }
};
