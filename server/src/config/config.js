/**
 * @fileoverview Application configuration module.
 * Loads environment variables from .env file and exports configuration object.
 *
 * @requires dotenv - For loading environment variables from .env file
 */

import dotenv from "dotenv";

dotenv.config();

/**
 * Application configuration object.
 * Contains all environment-based configuration values with sensible defaults.
 *
 * @type {Object}
 * @property {number} port - Server port number (default: 5000)
 * @property {string} jwtSecret - Secret key for JWT token signing
 * @property {string} jwtExpiration - JWT token expiration time (default: "1d")
 * @property {number} bcryptRounds - Number of bcrypt hashing rounds (default: 10)
 * @property {string} nodeEnv - Node environment: development|production (default: "development")
 */
export const config = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || "1d",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    nodeEnv: process.env.NODE_ENV || "development"
};
