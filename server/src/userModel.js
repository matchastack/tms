import { query } from "./config/database.js";

export const findUserByName = async name => {
    const sql = "SELECT * FROM accounts WHERE username = ?";
    const results = await query(sql, [name]);
    return results[0];
};

export const findUserById = async id => {
    const sql = "SELECT * FROM accounts WHERE id = ?";
    const results = await query(sql, [id]);
    return results[0];
};

export const findUserByEmail = async email => {
    const sql = "SELECT * FROM accounts WHERE email = ?";
    const results = await query(sql, [email]);
    return results[0];
};

export const getAllAccounts = async () => {
    const sql = "SELECT id, username, email, userGroup, isActive FROM accounts";
    return await query(sql);
};

export const createAccount = async accountData => {
    const { username, email, password, userGroup, isActive } = accountData;
    const sql = `
        INSERT INTO accounts (username, email, password, userGroup, isActive)
        VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
        username,
        email,
        password,
        userGroup,
        isActive
    ]);
    return {
        id: result.insertId,
        username,
        email,
        userGroup,
        isActive
    };
};
