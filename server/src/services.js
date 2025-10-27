import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "./config/database.js";
import { config } from "./config/config.js";

export const loginUser = async (username, password) => {
    const user = await query("SELECT * FROM accounts WHERE username = ?", [
        username
    ]).then(results => results[0]);

    if (!user) {
        throw new Error("Invalid username and/or password");
    }

    if (!user.isActive) {
        throw new Error("Inactive account");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid username and/or password");
    }

    const accessToken = generateAccessToken({
        username: user.username
    });

    return {
        accessToken,
        user: {
            username: user.username,
            email: user.email,
            groups: user.userGroups,
            isActive: user.isActive
        }
    };
};

const generateAccessToken = payload => {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiration
    });
};

export const getUserByUsername = async username => {
    const user = await query(
        "SELECT username, email, userGroups, isActive FROM accounts WHERE username = ?",
        [username]
    ).then(results => results[0]);

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const updateUserProfile = async (username, profileData) => {
    const { email, currentPassword, password } = profileData;
    return await withTransaction(async connection => {
        const user = await query("SELECT * FROM accounts WHERE username = ?", [
            username
        ]).then(results => results[0]);

        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ?",
            [email]
        ).then(results => results[0]);
        if (existingEmail && existingEmail.email !== user.email) {
            throw new Error("Email already exists");
        }

        if (password) {
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!isCurrentPasswordValid) {
                throw new Error("Current password is incorrect");
            }

            const hashedNewPassword = await bcrypt.hash(
                password,
                config.bcryptRounds
            );

            await connection.execute(
                "UPDATE accounts SET email = ?, password = ? WHERE username = ?",
                [email, hashedNewPassword, username]
            );
        } else {
            await connection.execute(
                "UPDATE accounts SET email = ? WHERE username = ?",
                [email, username]
            );
        }
        return {
            username,
            email
        };
    });
};

export const getAllAccounts = async () => {
    return await query(
        "SELECT username, email, userGroups, isActive FROM accounts"
    );
};

export const createAccount = async accountData => {
    const { username, email, password, userGroups, isActive } = accountData;

    return await withTransaction(async connection => {
        const existingUser = await query(
            "SELECT * FROM accounts WHERE username = ?",
            [username]
        ).then(results => results[0]);
        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ?",
            [email]
        ).then(results => results[0]);
        if (existingUser || existingEmail) {
            throw new Error("Username or email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

        await connection.execute(
            "INSERT INTO accounts (username, email, password, userGroups, isActive) VALUES (?, ?, ?, ?, ?)",
            [username, email, hashedPassword, userGroups, isActive]
        );

        return {
            username,
            email,
            userGroups,
            isActive
        };
    });
};

export const updateAccount = async (username, accountData) => {
    const { email, password, userGroups, isActive } = accountData;

    return await withTransaction(async connection => {
        if (username === "admin") {
            if (isActive === 0) {
                throw new Error("Cannot deactivate the original admin");
            }
            if (userGroups && !userGroups.includes("admin")) {
                throw new Error(
                    "Cannot remove admin group from original admin"
                );
            }
        }

        const existingEmail = await query(
            "SELECT * FROM accounts WHERE email = ? AND username != ?",
            [email, username]
        ).then(results => results[0]);
        if (existingEmail) {
            throw new Error("Email already exists");
        }

        let sql;
        let params;

        if (password) {
            const updatedPassword = await bcrypt.hash(
                password,
                config.bcryptRounds
            );
            sql = `
            UPDATE accounts 
            SET email = ?, password = ?, userGroups = ?, isActive = ?
            WHERE username = ?
            `;
            params = [email, updatedPassword, userGroups, isActive, username];
        } else {
            sql = `
            UPDATE accounts 
            SET email = ?, userGroups = ?, isActive = ?
            WHERE username = ?
            `;
            params = [email, userGroups, isActive, username];
        }

        await connection.execute(sql, params);

        return {
            username,
            email,
            userGroups,
            isActive
        };
    });
};

export const getAllUserGroups = async () => {
    return await query("SELECT group_name FROM user_groups").then(results =>
        results.map(row => row.group_name)
    );
};

export const createGroup = async groupName => {
    return await withTransaction(async connection => {
        const existingGroups = await query(
            "SELECT group_name FROM user_groups"
        ).then(results => results.map(row => row.group_name));

        if (existingGroups.includes(groupName)) {
            throw new Error("Group already exists");
        }

        await connection.execute(
            "INSERT INTO user_groups (group_name) VALUES (?)",
            [groupName]
        );
        return { groupName };
    });
};

export const checkGroup = async (userId, groupName) => {
    const user = await query(
        "SELECT userGroups FROM accounts WHERE username = ?",
        [userId]
    ).then(results => results[0]);

    if (!user) {
        return false;
    }

    const userGroups = user.userGroups || [];
    return userGroups.some(
        group => group.toLowerCase() === groupName.toLowerCase()
    );
};

// ============= APPLICATION SERVICES =============

export const createApplication = async appData => {
    const {
        App_Acronym,
        App_Description,
        App_startDate,
        App_endDate,
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
    } = appData;

    if (App_startDate > App_endDate) {
        throw new Error("Start date cannot be after end date");
    }

    return await withTransaction(async connection => {
        const existing = await query(
            "SELECT App_Acronym FROM applications WHERE App_Acronym = ?",
            [App_Acronym]
        ).then(results => results[0]);

        if (existing) {
            throw new Error("Application acronym already exists");
        }

        await connection.execute(
            `INSERT INTO applications (
                App_Acronym, App_Description, App_Rnumber,
                App_startDate, App_endDate,
                App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done
            ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
            [
                App_Acronym,
                App_Description,
                App_startDate,
                App_endDate,
                JSON.stringify(
                    Array.isArray(App_permit_Create) ? App_permit_Create : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Open) ? App_permit_Open : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_toDoList)
                        ? App_permit_toDoList
                        : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Doing) ? App_permit_Doing : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Done) ? App_permit_Done : []
                )
            ]
        );

        return {
            App_Acronym,
            App_Description,
            App_startDate,
            App_endDate,
            App_permit_Create,
            App_permit_Open,
            App_permit_toDoList,
            App_permit_Doing,
            App_permit_Done
        };
    });
};

export const getAllApplications = async () => {
    return await query("SELECT * FROM applications ORDER BY App_Acronym");
};

export const getApplicationByAcronym = async acronym => {
    const app = await query(
        "SELECT * FROM applications WHERE App_Acronym = ?",
        [acronym]
    ).then(results => results[0]);

    if (!app) {
        throw new Error("Application not found");
    }

    return app;
};

export const updateApplication = async (acronym, appData) => {
    const {
        App_Description,
        App_startDate,
        App_endDate,
        App_permit_Create,
        App_permit_Open,
        App_permit_toDoList,
        App_permit_Doing,
        App_permit_Done
    } = appData;

    return await withTransaction(async connection => {
        const existing = await query(
            "SELECT App_Acronym FROM applications WHERE App_Acronym = ?",
            [acronym]
        ).then(results => results[0]);

        if (!existing) {
            throw new Error("Application not found");
        }

        await connection.execute(
            `UPDATE applications SET
                App_Description = ?,
                App_startDate = ?,
                App_endDate = ?,
                App_permit_Create = ?,
                App_permit_Open = ?,
                App_permit_toDoList = ?,
                App_permit_Doing = ?,
                App_permit_Done = ?
            WHERE App_Acronym = ?`,
            [
                App_Description,
                App_startDate,
                App_endDate,
                JSON.stringify(
                    Array.isArray(App_permit_Create) ? App_permit_Create : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Open) ? App_permit_Open : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_toDoList)
                        ? App_permit_toDoList
                        : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Doing) ? App_permit_Doing : []
                ),
                JSON.stringify(
                    Array.isArray(App_permit_Done) ? App_permit_Done : []
                ),
                acronym
            ]
        );

        return await getApplicationByAcronym(acronym);
    });
};

// ============= PLAN SERVICES =============

export const createPlan = async planData => {
    const { Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym } =
        planData;

    if (Plan_startDate > Plan_endDate) {
        throw new Error("Start date cannot be after end date");
    }

    return await withTransaction(async connection => {
        // Check if application exists
        const app = await query(
            "SELECT App_Acronym FROM applications WHERE App_Acronym = ?",
            [Plan_app_Acronym]
        ).then(results => results[0]);

        if (!app) {
            throw new Error("Application not found");
        }

        // Check if plan name already exists
        const existing = await query(
            "SELECT Plan_MVP_name FROM plans WHERE Plan_MVP_name = ?",
            [Plan_MVP_name]
        ).then(results => results[0]);

        if (existing) {
            throw new Error("Plan name already exists");
        }

        await connection.execute(
            `INSERT INTO plans (Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym)
             VALUES (?, ?, ?, ?)`,
            [Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym]
        );

        return {
            Plan_MVP_name,
            Plan_startDate,
            Plan_endDate,
            Plan_app_Acronym
        };
    });
};

export const getPlansByApp = async appAcronym => {
    return await query(
        "SELECT * FROM plans WHERE Plan_app_Acronym = ? ORDER BY Plan_startDate",
        [appAcronym]
    );
};

export const getPlanByName = async planName => {
    const plan = await query("SELECT * FROM plans WHERE Plan_MVP_name = ?", [
        planName
    ]).then(results => results[0]);

    if (!plan) {
        throw new Error("Plan not found");
    }

    return plan;
};

export const updatePlan = async (planName, planData) => {
    const { Plan_startDate, Plan_endDate } = planData;
    if (Plan_startDate > Plan_endDate) {
        throw new Error("Start date cannot be after end date");
    }

    return await withTransaction(async connection => {
        const existing = await query(
            "SELECT Plan_MVP_name FROM plans WHERE Plan_MVP_name = ?",
            [planName]
        ).then(results => results[0]);

        if (!existing) {
            throw new Error("Plan not found");
        }

        await connection.execute(
            `UPDATE plans SET Plan_startDate = ?, Plan_endDate = ? WHERE Plan_MVP_name = ?`,
            [Plan_startDate, Plan_endDate, planName]
        );

        return await getPlanByName(planName);
    });
};

// ============= TASK SERVICES =============

// Helper: Generate Task_id
const generateTaskId = async (appAcronym, connection) => {
    const app = await connection
        .execute("SELECT App_Rnumber FROM applications WHERE App_Acronym = ?", [
            appAcronym
        ])
        .then(([results]) => results[0]);

    const newRnumber = app.App_Rnumber + 1;

    await connection.execute(
        "UPDATE applications SET App_Rnumber = ? WHERE App_Acronym = ?",
        [newRnumber, appAcronym]
    );

    return `${appAcronym}_${newRnumber}`;
};

// Helper: Append audit note
const appendAuditNote = (currentNotes, username, state, note) => {
    const timestamp = new Date().toISOString();
    const newNote = `\n[${username}] [${state}] [${timestamp}]\n${
        note || "State transition"
    }\n${"=".repeat(50)}`;
    return (currentNotes || "") + newNote;
};

export const createTask = async (taskData, username) => {
    const { Task_name, Task_description, Task_plan, Task_app_Acronym, notes } =
        taskData;

    return await withTransaction(async connection => {
        // Check if application exists
        const app = await connection
            .execute("SELECT * FROM applications WHERE App_Acronym = ?", [
                Task_app_Acronym
            ])
            .then(([results]) => results[0]);

        if (!app) {
            throw new Error("Application not found");
        }

        // Check if task name already exists
        const existing = await connection
            .execute("SELECT Task_name FROM tasks WHERE Task_name = ?", [
                Task_name
            ])
            .then(([results]) => results[0]);

        if (existing) {
            throw new Error("Task name already exists");
        }

        // Validate plan if provided
        if (Task_plan) {
            const plan = await connection
                .execute(
                    "SELECT * FROM plans WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?",
                    [Task_plan, Task_app_Acronym]
                )
                .then(([results]) => results[0]);

            if (!plan) {
                throw new Error(
                    "Plan not found or does not belong to this application"
                );
            }
        }

        // Generate Task_id
        const taskId = await generateTaskId(Task_app_Acronym, connection);

        // Create audit trail
        const auditNotes = appendAuditNote("", username, "Open", notes);

        await connection.execute(
            `INSERT INTO tasks (
                Task_id, Task_name, Task_description, Task_notes, Task_plan,
                Task_app_Acronym, Task_state, Task_creator, Task_owner
            ) VALUES (?, ?, ?, ?, ?, ?, 'Open', ?, ?)`,
            [
                taskId,
                Task_name,
                Task_description,
                auditNotes,
                Task_plan || null,
                Task_app_Acronym,
                username,
                username
            ]
        );

        return {
            Task_id: taskId,
            Task_name,
            Task_description,
            Task_app_Acronym,
            Task_state: "Open",
            Task_creator: username,
            Task_owner: username
        };
    });
};

