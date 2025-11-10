/**
 * @fileoverview Express application configuration and middleware setup.
 * Configures CORS, JSON parsing, cookie handling, and routes for the TMS API.
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js";

const app = express();

app.use(
    cors({
        origin: ["http://localhost:3000"],
        credentials: true
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", routes);

/**
 * Health check endpoint.
 * Returns the server status and current timestamp.
 * @route GET /api/health
 * @returns {Object} JSON object with status and timestamp
 */
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toUTCString() });
});

app.use((req, res, next) => {
    res.status(400).json({ success: false, message: "U_1" });
    next();
});

export default app;
