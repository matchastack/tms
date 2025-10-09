import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || "30m",
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "1d",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    nodeEnv: process.env.NODE_ENV || "development"
};
