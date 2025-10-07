import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", routes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toUTCString() });
});

export default app;
