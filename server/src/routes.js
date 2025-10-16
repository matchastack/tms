import express from "express";
import * as controllers from "./controllers.js";
import * as validations from "./validations.js";

const router = express.Router();

router.post("/auth/login", validations.validateLogin, controllers.login);
router.post("/auth/logout", validations.authenticateToken, controllers.logout);

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
    validations.validateAccountCreation,
    controllers.createAccount
);

router.put(
    "/accounts/:username",
    validations.authenticateToken,
    validations.requireSelfOrAdmin,
    validations.validateAccountUpdate,
    controllers.updateAccount
);

export default router;
