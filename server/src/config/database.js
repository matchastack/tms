/**
 * @fileoverview Database configuration and utility functions.
 * Provides MySQL connection pool and transaction management utilities.
 *
 * @requires mysql2/promise - MySQL driver with promise support
 * @requires dotenv - For loading environment variables
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * MySQL connection pool.
 * Configured with environment variables for database connection settings.
 * Uses connection pooling for efficient database access with a limit of 10 concurrent connections.
 *
 * @type {mysql.Pool}
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "nodelogin",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

/**
 * Execute a SQL query using the connection pool.
 * Automatically handles parameterized queries to prevent SQL injection.
 *
 * @async
 * @param {string} sql - SQL query string with ? placeholders for parameters
 * @param {Array} params - Array of parameter values to bind to the query
 * @returns {Promise<Array>} Query results as an array of rows
 * @throws {Error} If the database query fails
 *
 * @example
 * const users = await query("SELECT * FROM accounts WHERE username = ?", ["admin"]);
 */
export const query = async (sql, params) => {
    const [results] = await pool.execute(sql, params);
    return results;
};

/**
 * Execute multiple database operations within a single transaction.
 * Provides ACID compliance by automatically handling commit/rollback.
 * If any operation fails, all changes are rolled back.
 *
 * @async
 * @param {Function} callback - Async function that receives a database connection and performs operations
 * @returns {Promise<*>} The result returned by the callback function
 * @throws {Error} If any operation within the transaction fails (triggers rollback)
 *
 * @example
 * const result = await withTransaction(async (connection) => {
 *     await connection.execute("INSERT INTO accounts ...", [...]);
 *     await connection.execute("UPDATE user_groups ...", [...]);
 *     return { success: true };
 * });
 */
export const withTransaction = async callback => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
