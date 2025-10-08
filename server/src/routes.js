import express from "express";
import * as controllers from "./controllers.js";
import * as validations from "./validations.js";

const router = express.Router();

router.post("/auth/login", validations.validateLogin, controllers.login);
router.post("/auth/logout", controllers.logout);

router.get(
    "/accounts",
    validations.authenticateToken,
    validations.requireAdmin,
    controllers.getAccounts
);

export default router;
