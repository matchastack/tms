import nodemailer from "nodemailer";
import * as services from "./services.js";

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await services.loginUser(username, password);

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: null
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

export const getCurrentUser = async (req, res) => {
    try {
        const username = req.user.username;
        const user = await services.getUserByUsername(username);
        res.status(200).json({
            success: true,
            data: {
                username: user.username,
                email: user.email,
                groups: user.userGroups
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile"
        });
    }
};

export const updateCurrentUser = async (req, res, next) => {
    try {
        const username = req.user.username;
        const { email, currentPassword, password } = req.body;

        const updatedUser = await services.updateUserProfile(username, {
            email,
            currentPassword,
            password
        });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAccounts = async (req, res, next) => {
    try {
        const accounts = await services.getAllAccounts();
        res.status(200).json({
            success: true,
            data: accounts,
            message: "Accounts retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req, res, next) => {
    try {
        const { username, email, password, userGroups, isActive } = req.body;

        const newAccount = await services.createAccount({
            username,
            email,
            password,
            userGroups: Array.isArray(userGroups) ? userGroups : [], // TODO: default should be handled at higher level or frontend
            isActive
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: newAccount
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateAccount = async (req, res, next) => {
    try {
        const { username, email, password, userGroups, isActive, newUsername } =
            req.body;

        const updatedAccount = await services.updateAccount(username, {
            email,
            password,
            userGroups: Array.isArray(userGroups) ? userGroups : [], // TODO: default should be handled at higher level or frontend
            isActive,
            newUsername
        });

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            data: updatedAccount
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getUserGroups = async (req, res, next) => {
    try {
        const groups = await services.getAllUserGroups();
        res.status(200).json({
            success: true,
            data: groups,
            message: "User groups retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const createGroup = async (req, res, next) => {
    try {
        const { groupName } = req.body;
        const newGroup = await services.createGroup(groupName.trim());
        res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: newGroup
        });
    } catch (error) {
        next(error);
    }
};

// ============= APPLICATION CONTROLLERS =============

export const createApplication = async (req, res, next) => {
    try {
        const newApp = await services.createApplication(req.body);
        res.status(201).json({
            success: true,
            message: "Application created successfully",
            data: newApp
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getApplications = async (req, res, next) => {
    try {
        const apps = await services.getAllApplications();
        res.status(200).json({
            success: true,
            data: apps
        });
    } catch (error) {
        next(error);
    }
};

export const getApplicationByAcronym = async (req, res, next) => {
    try {
        const { acronym } = req.params;
        const app = await services.getApplicationByAcronym(acronym);
        res.status(200).json({
            success: true,
            data: app
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const updateApplication = async (req, res, next) => {
    try {
        const { acronym } = req.params;
        const updatedApp = await services.updateApplication(acronym, req.body);
        res.status(200).json({
            success: true,
            message: "Application updated successfully",
            data: updatedApp
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ============= PLAN CONTROLLERS =============

export const createPlan = async (req, res, next) => {
    try {
        const newPlan = await services.createPlan(req.body);
        res.status(201).json({
            success: true,
            message: "Plan created successfully",
            data: newPlan
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getPlans = async (req, res, next) => {
    try {
        const { app_acronym } = req.params;
        const plans = await services.getPlansByApp(app_acronym);
        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        next(error);
    }
};

export const getPlan = async (req, res, next) => {
    try {
        const { name } = req.params;
        const plan = await services.getPlanByName(name);
        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

// ============= TASK CONTROLLERS =============

export const createTask = async (req, res, next) => {
    try {
        const username = req.user.username;
        const newTask = await services.createTask(req.body, username);
        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: newTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getTasks = async (req, res, next) => {
    try {
        const { app_acronym } = req.params;
        const { state } = req.query;

        let tasks;
        if (state) {
            tasks = await services.getTasksByState(app_acronym, state);
        } else {
            tasks = await services.getTasksByApp(app_acronym);
        }

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

export const getTask = async (req, res, next) => {
    try {
        const { task_id } = req.params;
        const task = await services.getTaskById(task_id);
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const promoteTask = async (req, res, next) => {
    try {
        const { task_id, notes, expected_state } = req.body;
        const username = req.user.username;
        const updatedTask = await services.promoteTaskState(
            task_id,
            username,
            notes,
            expected_state
        );

        // If promoted to "Done", send email notification
        if (updatedTask.Task_state === "Done") {
            try {
                // Get application details to find users to notify
                const app = await services.getApplicationByAcronym(
                    updatedTask.Task_app_Acronym
                );

                // Get all accounts to find users in App_permit_Done group
                const allAccounts = await services.getAllAccounts();
                const permitDoneGroups = app.App_permit_Done || [];

                // Find users who are in any of the permit_Done groups
                const usersToNotify = allAccounts.filter(account => {
                    const userGroups = account.userGroups || [];
                    return permitDoneGroups.some(group =>
                        userGroups.includes(group)
                    );
                });

                // Get email addresses
                const emailAddresses = usersToNotify
                    .map(user => user.email)
                    .filter(email => email);

                if (emailAddresses.length > 0) {
                    const transporter = nodemailer.createTransport({
                        host: "smtp.ethereal.email",
                        port: 587,
                        auth: {
                            user: process.env.EMAIL_USERNAME,
                            pass: process.env.EMAIL_PASSWORD
                        }
                    });

                    const mailOptions = {
                        from: process.env.EMAIL_USERNAME,
                        to: emailAddresses.join(", "),
                        subject: `Task ${updatedTask.Task_id} Ready for Review`,
                        text: `Task "${updatedTask.Task_name}" (${
                            updatedTask.Task_id
                        }) has been moved to "Done" state and is ready for approval.\n\nApplication: ${
                            updatedTask.Task_app_Acronym
                        }\nTask Owner: ${
                            updatedTask.Task_owner || "N/A"
                        }\n\nPlease review and approve or reject the task.`,
                        html: `<h2>Task Ready for Review</h2>
                        <p>Task <strong>"${updatedTask.Task_name}"</strong> (${
                            updatedTask.Task_id
                        }) has been moved to <strong>"Done"</strong> state and is ready for approval.</p>
                        <ul>
                            <li><strong>Application:</strong> ${
                                updatedTask.Task_app_Acronym
                            }</li>
                            <li><strong>Task Owner:</strong> ${
                                updatedTask.Task_owner || "N/A"
                            }</li>
                        </ul>
                        <p>Please review and approve or reject the task.</p>`
                    };

                    await transporter.sendMail(mailOptions);
                }
            } catch (emailError) {
                // Log email error but don't fail the task promotion
                console.error("Failed to send email notification:", emailError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Task promoted successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const demoteTask = async (req, res, next) => {
    try {
        const { task_id, notes, expected_state } = req.body;
        const username = req.user.username;
        const updatedTask = await services.demoteTaskState(
            task_id,
            username,
            notes,
            expected_state
        );
        res.status(200).json({
            success: true,
            message: "Task demoted successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const { task_id, plan_name, notes } = req.body;
        const username = req.user.username;

        let updatedTask;

        // If notes are provided, add them
        if (notes && notes.trim()) {
            updatedTask = await services.addTaskNote(task_id, notes, username);
        }

        // If plan_name is provided (could be changed or same), update plan
        if (plan_name !== undefined) {
            updatedTask = await services.updateTaskPlan(
                task_id,
                plan_name,
                username
            );
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
