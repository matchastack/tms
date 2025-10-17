import { query } from "./config/database.js";

export const findUserByName = async name => {
    const sql = "SELECT * FROM accounts WHERE username = ?";
    const results = await query(sql, [name]);
    return results[0];
};

export const findUserByEmail = async email => {
    const sql = "SELECT * FROM accounts WHERE email = ?";
    const results = await query(sql, [email]);
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
    const { email, password, userGroups, isActive } = accountData;

    let sql;
    let params;

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

    await query(sql, params);

    return {
        username,
        email,
        userGroups,
        isActive
    };
};

export const getAllUserGroups = async () => {
    const sql = "SELECT group_name FROM user_groups";
    const results = await query(sql);
    return results.map(row => row.group_name);
};
