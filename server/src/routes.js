import express from "express";
import * as authController from "./controllers.js";
import { validateLogin } from "./validations.js";

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout);

router.get("/accounts", authController.getAccounts);

export default router;
