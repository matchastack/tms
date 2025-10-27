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

router.get(
    "/applications",
    validations.authenticateToken,
    controllers.getApplications
);

router.get(
    "/applications/:acronym",
    validations.authenticateToken,
    controllers.getApplicationByAcronym
);

router.put(
    "/applications/:acronym",
    validations.authenticateToken,
    validations.requireAdmin,
    validations.validateApplicationUpdate,
    controllers.updateApplication
);

// ============= PLAN ROUTES =============

router.post(
    "/plans",
    validations.authenticateToken,
    validations.validatePlanCreation,
    controllers.createPlan
);

router.get(
    "/plans/:app_acronym",
    validations.authenticateToken,
    controllers.getPlans
);

router.get("/plan/:name", validations.authenticateToken, controllers.getPlan);

router.put(
    "/plan/:name",
    validations.authenticateToken,
    controllers.updatePlan
);

// ============= TASK ROUTES =============

router.post(
    "/tasks",
    validations.authenticateToken,
    validations.validateTaskCreation,
    validations.requirePermitGroup("App_permit_Create"),
    controllers.createTask
);

router.get(
    "/tasks/:app_acronym",
    validations.authenticateToken,
    controllers.getTasks
);

router.get(
    "/task/:task_id",
    validations.authenticateToken,
    controllers.getTask
);

router.post(
    "/tasks/promote",
    validations.authenticateToken,
    controllers.promoteTask
);

router.post(
    "/tasks/demote",
    validations.authenticateToken,
    controllers.demoteTask
);


export default router;
