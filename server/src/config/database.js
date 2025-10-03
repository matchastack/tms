import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "nodelogin",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export const query = async (sql, params) => {
    const [results] = await pool.execute(sql, params);
    return results;
};

export default pool;
