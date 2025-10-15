import { query } from "./config/database.js";

export const findUserByName = async name => {
    const sql = "SELECT * FROM accounts WHERE username = ?";
    const results = await query(sql, [name]);
    return results[0];
};

// Remove findUserById function - no longer needed

export const findUserByEmail = async email => {
    const sql = "SELECT * FROM accounts WHERE email = ?";
    const results = await query(sql, [email]);
    return results[0];
};

export const getAllAccounts = async () => {
    const sql = "SELECT username, email, userGroup, isActive FROM accounts";
    return await query(sql);
};

export const createAccount = async accountData => {
    const { username, email, password, userGroup, isActive } = accountData;
    const sql = `
        INSERT INTO accounts (username, email, password, userGroup, isActive)
        VALUES (?, ?, ?, ?, ?)
    `;
    await query(sql, [username, email, password, userGroup, isActive]);
    return {
        username,
        email,
        userGroup,
        isActive
    };
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroup, isActive, newUsername } = accountData;

    let sql;
    let params;

    if (newUsername && newUsername !== username) {
        // Handle username change
        if (password) {
            sql = `
                UPDATE accounts 
                SET username = ?, email = ?, password = ?, userGroup = ?, isActive = ?
                WHERE username = ?
            `;
            params = [
                newUsername,
                email,
                password,
                userGroup,
                isActive,
                username
            ];
        } else {
            sql = `
                UPDATE accounts 
                SET username = ?, email = ?, userGroup = ?, isActive = ?
                WHERE username = ?
            `;
            params = [newUsername, email, userGroup, isActive, username];
        }
    } else {
        // No username change
        if (password) {
            sql = `
                UPDATE accounts 
                SET email = ?, password = ?, userGroup = ?, isActive = ?
                WHERE username = ?
            `;
            params = [email, password, userGroup, isActive, username];
        } else {
            sql = `
                UPDATE accounts 
                SET email = ?, userGroup = ?, isActive = ?
                WHERE username = ?
            `;
            params = [email, userGroup, isActive, username];
        }
    }

    await query(sql, params);

    return {
        username: newUsername || username,
        email,
        userGroup,
        isActive
    };
};
