import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./config/database.js";
import { config } from "./config/config.js";

export const loginUser = async (username, password) => {
    const user = await query("SELECT * FROM accounts WHERE username = ?", [
        username
    ]).then(results => results[0]);

    if (!user) {
        throw new Error("User does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken({
        username: user.username,
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

export const getUserByUsername = async username => {
    const user = await query(
        "SELECT username, email, userGroups, isActive FROM accounts WHERE username = ?",
        [username]
    ).then(results => results[0]);

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const getAllAccounts = async () => {
    return await query(
        "SELECT username, email, userGroups, isActive FROM accounts"
    );
};

export const createAccount = async accountData => {
    const { username, email, password, userGroups, isActive } = accountData;

    const existingUser = await query(
        "SELECT * FROM accounts WHERE username = ?",
        [username]
    ).then(results => results[0]);
    if (existingUser) {
        throw new Error("Username already exists");
    }

    const existingEmail = await query(
        "SELECT * FROM accounts WHERE email = ?",
        [email]
    ).then(results => results[0]);
    if (existingEmail) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    const sql = `
        INSERT INTO accounts (username, email, password, userGroups, isActive)
        VALUES (?, ?, ?, ?, ?)
    `;
    await query(sql, [username, email, hashedPassword, userGroups, isActive]);
    return {
        username,
        email,
        userGroups,
        isActive
    };
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroups, isActive } = accountData;

    let sql;
    let params;

    if (password) {
        const updatedPassword = await bcrypt.hash(
            password,
            config.bcryptRounds
        );
        sql = `
            UPDATE accounts 
            SET email = ?, password = ?, userGroups = ?, isActive = ?
            WHERE username = ?
            `;
        params = [email, updatedPassword, userGroups, isActive, username];
    } else {
        sql = `
            UPDATE accounts 
            SET email = ?, userGroups = ?, isActive = ?
            WHERE username = ?
            `;
        params = [email, userGroups, isActive, username];
    }

    await query(sql, params);

    return {
        username,
        email,
        userGroups,
        isActive
    };
};

export const getAllUserGroups = async () => {
    return await query("SELECT group_name FROM user_groups").then(results =>
        results.map(row => row.group_name)
    );
};

export const createGroup = async groupName => {
    const existingGroups = await query(
        "SELECT group_name FROM user_groups"
    ).then(results => results.map(row => row.group_name));

    if (existingGroups.includes(groupName)) {
        throw new Error("Group already exists");
    }

    const insertQuery = "INSERT INTO user_groups (group_name) VALUES (?)";
    await query(insertQuery, [groupName]);
    return { groupName };
};
