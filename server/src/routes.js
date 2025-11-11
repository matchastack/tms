/**
 * @fileoverview API route definitions for the TMS application.
 * Defines all HTTP endpoints with their middleware chains (authentication, validation, authorization).
 * Routes are organized into sections: Auth, User, Admin, Application, Plan, and Task.
 *
 * Middleware execution order for protected routes:
 * 1. Authentication (authenticateToken) - Verifies JWT token
 * 2. Validation (validate*) - Validates request data
 * 3. Authorization (requireUserGroup/requirePermitGroup) - Checks user permissions
 * 4. Controller - Handles the request and returns response
 */

import express from "express";
import * as controllers from "./controllers.js";
import * as validations from "./validations.js";

const router = express.Router();

// ============= AUTH ROUTES =============

router.post("/auth/login", validations.validateLogin, controllers.login);
router.post("/auth/logout", validations.authenticateToken, controllers.logout);

// ============= USER ROUTES =============

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

// ============= ADMIN ROUTES =============

router.get(
    "/accounts",
    validations.authenticateToken,
    validations.requireUserGroup("admin"),
    controllers.getAccounts
);

router.post(
    "/accounts",
    validations.authenticateToken,
    validations.requireUserGroup("admin"),
    validations.validateAccountCreation,
    controllers.createAccount
);

router.put(
    "/accounts",
    validations.authenticateToken,
    validations.requireUserGroup("admin"),
    validations.validateAccountUpdate,
    controllers.updateAccount
);

router.get(
    "/user_groups",
    validations.authenticateToken,
    controllers.getUserGroups
);

router.post(
    "/user_groups",
    validations.authenticateToken,
    validations.requireUserGroup("admin"),
    validations.validateGroupCreation,
    controllers.createGroup
);

// ============= APPLICATION ROUTES =============

router.post(
    "/applications",
    validations.authenticateToken,
    validations.requireUserGroup("project lead"),
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
    validations.requireUserGroup("project lead"),
    validations.validateApplicationUpdate,
    controllers.updateApplication
);

// ============= PLAN ROUTES =============

router.post(
    "/plans",
    validations.authenticateToken,
    validations.requireUserGroup("project manager"),
    validations.validatePlanCreation,
    controllers.createPlan
);

router.get(
    "/plans/:app_acronym",
    validations.authenticateToken,
    controllers.getPlans
);

router.get("/plan/:name", validations.authenticateToken, controllers.getPlan);

// ============= TASK ROUTES =============

router.post(
    "/tasks",
    validations.authenticateToken,
    validations.validateTaskCreation,
    validations.requirePermitGroup("App_permit_Create"),
    controllers.createTask
);

router.post(
    "/CreateTask",
    validations.validateCreateTaskRequest,
    validations.authenticateToken,
    validations.validateTaskCreation,
    validations.requirePermitGroup("App_permit_Create"),
    controllers.createTask
);

// Catch-all for non-POST methods on /CreateTask (return U_1)
router.all("/CreateTask", (req, res) => {
    return res.status(400).json({
        status: "U_1"
    });
});

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

router.get(
    "/tasks/state/:state",
    validations.authenticateToken,
    controllers.getTasksByState
);

router.get(
    "/GetTaskByState/:state",
    validations.authenticateToken,
    validations.validateGetTaskByStateRequest,
    controllers.getTasksByState
);

router.post(
    "/tasks/promote",
    validations.authenticateToken,
    controllers.promoteTask
);

router.post(
    "/PromoteTask2Done",
    validations.authenticateToken,
    controllers.PromoteTask2Done
);

router.post(
    "/tasks/demote",
    validations.authenticateToken,
    controllers.demoteTask
);

router.put("/tasks", validations.authenticateToken, controllers.updateTask);

export default router;
