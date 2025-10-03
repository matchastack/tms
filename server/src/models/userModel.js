import { query } from "../config/database.js";

export const findUserByName = async (name) => {
    const sql = "SELECT * FROM accounts WHERE username = ?";
    const results = await query(sql, [name]);
    return results[0];
};
