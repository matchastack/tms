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
        groups: user.userGroups
    });

    return {
        accessToken,
        user: {
            username: user.username,
            email: user.email,
            groups: user.userGroups,
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
    const { username, email, password, userGroups } = accountData;

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
        userGroups: userGroups || [],
        isActive: 1
    });
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroups, isActive, newUsername } = accountData;

    // TODO: username cannot be changed. Remove this in future.
    if (newUsername && newUsername !== username) {
        const existingUser = await userModel.findUserByName(newUsername);
        if (existingUser) {
            throw new Error("Username already exists");
        }
    }

    const updateData = {
        email,
        userGroups: userGroups || [],
        isActive,
        newUsername
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, config.bcryptRounds);
    }

    return await userModel.updateAccount(username, updateData);
};
