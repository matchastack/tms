import express from "express";
import cors from "cors";
import authRoutes from "./authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toUTCString() });
});

export default app;
