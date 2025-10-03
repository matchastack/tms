import express from "express";
import * as authController from "../controllers/authController.js";
import { validateLogin } from "../middleware/validation.js";

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout);

export default router;
