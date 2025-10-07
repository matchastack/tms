import express from "express";
import * as controllers from "./controllers.js";
import { validateLogin } from "./validations.js";

const router = express.Router();

router.post("/login", validateLogin, controllers.login);
router.post("/logout", controllers.logout);

router.get("/accounts", controllers.getAccounts);

export default router;
