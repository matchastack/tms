import express from "express";
import * as controllers from "./controllers.js";
import * as validations from "./validations.js";

const router = express.Router();

router.post("/auth/login", controllers.login);
router.post("/auth/logout", validations.authenticateToken, controllers.logout);
router.post("/auth/refresh", controllers.refreshToken);

router.get(
    "/profile",
    validations.authenticateToken,
    controllers.getCurrentUser
);
router.get(
    "/accounts",
    validations.authenticateToken,
    validations.requireAdmin,
    controllers.getAccounts
);

router.post(
    "/accounts",
    validations.authenticateToken,
    validations.requireAdmin,
    controllers.createAccount
);

export default router;
