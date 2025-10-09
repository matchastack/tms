import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import * as userModel from "./userModel.js";

export const loginUser = async (username, password) => {
    const user = await userModel.findUserByName(username);

    if (!user) {
        throw new Error("User does not exist");
    }

    const isPasswordValid = password === user.password;
    // const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        email: user.email,
        group: user.userGroup
    });

    const refreshToken = generateRefreshToken({
        id: user.id
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.username,
            email: user.email,
            group: user.userGroup,
            isActive: user.isActive
        }
    };
};

export const getAllAccounts = async () => {
    return await userModel.getAllAccounts();
};

const generateAccessToken = payload => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiration
    });
};

const generateRefreshToken = payload => {
    return jwt.sign(payload, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiration
    });
};
