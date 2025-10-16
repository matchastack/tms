import { query } from "./config/database.js";

export const findUserByName = async name => {
    const sql = "SELECT * FROM accounts WHERE username = ?";
    const results = await query(sql, [name]);
    return results[0];
};

export const findUserByEmail = async email => {
    const sql = "SELECT * FROM accounts WHERE email = ?";
    const results = await query(sql, [email]);
    if (results[0] && results[0].userGroups) {
        results[0].userGroups = JSON.parse(results[0].userGroups);
    }
    return results[0];
};

export const getAllAccounts = async () => {
    const sql = "SELECT username, email, userGroups, isActive FROM accounts";
    return await query(sql);
};

export const createAccount = async accountData => {
    const { username, email, password, userGroups, isActive } = accountData;
    const sql = `
        INSERT INTO accounts (username, email, password, userGroups, isActive)
        VALUES (?, ?, ?, ?, ?)
    `;
    await query(sql, [username, email, password, userGroups, isActive]);
    return {
        username,
        email,
        userGroups,
        isActive
    };
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroups, isActive, newUsername } = accountData;

    let sql;
    let params;

    if (newUsername && newUsername !== username) {
        if (password) {
            sql = `
                UPDATE accounts 
                SET username = ?, email = ?, password = ?, userGroups = ?, isActive = ?
                WHERE username = ?
            `;
            params = [
                newUsername,
                email,
                password,
                userGroups,
                isActive,
                username
            ];
        } else {
            sql = `
                UPDATE accounts 
                SET username = ?, email = ?, userGroups = ?, isActive = ?
                WHERE username = ?
            `;
            params = [newUsername, email, userGroups, isActive, username];
        }
    } else {
        if (password) {
            sql = `
                UPDATE accounts 
                SET email = ?, password = ?, userGroups = ?, isActive = ?
                WHERE username = ?
            `;
            params = [email, password, userGroups, isActive, username];
        } else {
            sql = `
                UPDATE accounts 
                SET email = ?, userGroups = ?, isActive = ?
                WHERE username = ?
            `;
            params = [email, userGroups, isActive, username];
        }
    }

    await query(sql, params);

    return {
        username: newUsername || username,
        email,
        userGroups,
        isActive
    };
};
