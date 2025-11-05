/**
 * @fileoverview Entry point for the Task Management System (TMS) Express server.
 * Initializes the Express application and starts the HTTP server.
 */

import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * Start the Express server on the configured port.
 * Logs a message to the console when the server is successfully started.
 */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
