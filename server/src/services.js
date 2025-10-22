import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "./config/database.js";
import { config } from "./config/config.js";

export const loginUser = async (username, password) => {
    const user = await query("SELECT * FROM accounts WHERE username = ?", [
        username
    ]).then(results => results[0]);

    if (!user) {
        throw new Error("Invalid username and/or password");
    }

    if (!user.isActive) {
        throw new Error("Inactive account");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid username and/or password");
    }

    const accessToken = generateAccessToken({
        username: user.username,
        groups: user.userGroups // TODO: remove
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

export const updateUserProfile = async (username, profileData) => {
    const { email, currentPassword, password } = profileData;
    return await withTransaction(async connection => {
        const user = await query("SELECT * FROM accounts WHERE username = ?", [
            username
        ]).then(results => results[0]);

        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ?",
            [email]
        ).then(results => results[0]);
        if (existingEmail) {
            throw new Error("Email already exists");
        }

        if (password) {
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!isCurrentPasswordValid) {
                throw new Error("Current password is incorrect");
            }

            const hashedNewPassword = await bcrypt.hash(
                password,
                config.bcryptRounds
            );

            await connection.execute(
                "UPDATE accounts SET email = ?, password = ? WHERE username = ?",
                [email, hashedNewPassword, username]
            );
        } else {
            await connection.execute(
                "UPDATE accounts SET email = ? WHERE username = ?",
                [email, username]
            );
        }
        return {
            username,
            email
        };
    });
};

export const getAllAccounts = async () => {
    return await query(
        "SELECT username, email, userGroups, isActive FROM accounts"
    );
};

export const createAccount = async accountData => {
    const { username, email, password, userGroups, isActive } = accountData;

    return await withTransaction(async connection => {
        const existingUser = await query(
            "SELECT * FROM accounts WHERE username = ?",
            [username]
        ).then(results => results[0]);
        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ?",
            [email]
        ).then(results => results[0]);
        if (existingUser || existingEmail) {
            throw new Error("Username or email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

        await connection.execute(
            "INSERT INTO accounts (username, email, password, userGroups, isActive) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, userGroups, isActive]
        );

        return {
            username,
            email,
            userGroups,
            isActive
        };
    });
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroups, isActive } = accountData;

    return await withTransaction(async connection => {
        if (username === "admin") {
            if (isActive === 0) {
                throw new Error("Cannot deactivate the original admin");
            }
            if (userGroups && !userGroups.includes("admin")) {
                throw new Error("Cannot remove admin role from root admin");
            }
        }

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

        await connection.execute(sql, params);

        return {
            username,
            email,
            userGroups,
            isActive
        };
    });
};

export const getAllUserGroups = async () => {
    return await query("SELECT group_name FROM user_groups").then(results =>
        results.map(row => row.group_name)
    );
};

export const createGroup = async groupName => {
    return await withTransaction(async connection => {
        const existingGroups = await query(
            "SELECT group_name FROM user_groups"
        ).then(results => results.map(row => row.group_name));

        if (existingGroups.includes(groupName)) {
            throw new Error("Group already exists");
        }

        await connection.execute(
            "INSERT INTO user_groups (group_name) VALUES (?)",
            [groupName]
        );
        return { groupName };
    });
};

export const checkGroup = async (userId, groupName) => {
    const user = await query(
        "SELECT userGroups FROM accounts WHERE username = ?",
        [userId]
    ).then(results => results[0]);

    if (!user) {
        return false;
    }

    const userGroups = user.userGroups || [];
    return userGroups.some(
        group => group.toLowerCase() === groupName.toLowerCase()
    );
};
