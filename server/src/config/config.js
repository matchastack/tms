import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || "your-secret-key",
    jwtExpiration: process.env.JWT_EXPIRATION || "24h",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    nodeEnv: process.env.NODE_ENV || "development",
};
