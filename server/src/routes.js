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

router.put(
    "/profile",
    validations.authenticateToken,
    validations.validateProfileUpdate,
    controllers.updateCurrentUser
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
    "/accounts",
    validations.authenticateToken,
    validations.requireSelfOrAdmin,
    validations.validateAccountUpdate,
    controllers.updateAccount
);

router.get(
    "/user_groups",
    validations.authenticateToken,
    validations.requireAdmin,
    controllers.getUserGroups
);

router.post(
    "/user_groups",
    validations.authenticateToken,
    validations.requireAdmin,
    validations.validateGroupCreation,
    controllers.createGroup
);

// ============= APPLICATION ROUTES =============

router.post(
    "/applications",
    validations.authenticateToken,
    validations.requireAdmin,
    validations.validateApplicationCreation,
    controllers.createApplication
);


export default router;
