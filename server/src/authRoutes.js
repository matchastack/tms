import express from "express";
import * as authController from "./authController.js";
import { validateLogin } from "./validation.js";

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout);

router.get("/accounts", authController.getAccounts);

export default router;
