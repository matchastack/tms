import { query } from "./config/database.js";

export const findUserByName = async name => {
    const sql = "SELECT * FROM accounts WHERE username = ?";
    const results = await query(sql, [name]);
    return results[0];
};

export const getAllAccounts = async () => {
    const sql = "SELECT * FROM accounts";
    return await query(sql);
};
