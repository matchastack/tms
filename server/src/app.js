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

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toUTCString() });
});

export default app;
