import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";
import * as userModel from "./userModel.js";

export const loginUser = async (username, password) => {
    const user = await userModel.findUserByName(username);

    if (!user) {
        throw new Error("User does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken({
        username: user.username,
        email: user.email,
        group: user.userGroup
    });

    return {
        accessToken,
        user: {
            username: user.username,
            email: user.email,
            group: user.userGroup,
            isActive: user.isActive
        }
    };
};

const generateAccessToken = payload => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiration
    });
};

export const getAllAccounts = async () => {
    return await userModel.getAllAccounts();
};

export const createAccount = async accountData => {
    const { username, email, password, userGroup } = accountData;

    const existingUser = await userModel.findUserByName(username);
    if (existingUser) {
        throw new Error("Username already exists");
    }

    const existingEmail = await userModel.findUserByEmail(email);
    if (existingEmail) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    return await userModel.createAccount({
        username,
        email,
        password: hashedPassword,
        userGroup,
        isActive: 1
    });
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroup, isActive, newUsername } = accountData;

    // Check if new username already exists (if username is being changed)
    if (newUsername && newUsername !== username) {
        const existingUser = await userModel.findUserByName(newUsername);
        if (existingUser) {
            throw new Error("Username already exists");
        }
    }

    const updateData = {
        email,
        userGroup,
        isActive,
        newUsername
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, config.bcryptRounds);
    }

    return await userModel.updateAccount(username, updateData);
};
