CREATE DATABASE IF NOT EXISTS nodelogin DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci; 

USE nodelogin;

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    userGroups JSON NOT NULL,
    isActive TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8; 

INSERT INTO accounts (username, password, email, userGroups, isActive) VALUES
("admin", "$2a$10$xjP1qgUcVGXwCyu5OYEZFuGt5CsbjcK6oHFV.IJu4qyuXo62Dip46", "admin@m.com", '["admin"]', 1);

CREATE TABLE IF NOT EXISTS user_groups (
    group_name VARCHAR(50) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO user_groups (group_name) VALUES
("admin"),
("project lead"),
("project manager"),
("dev team");

-- Application table
CREATE TABLE IF NOT EXISTS applications (
    App_Acronym VARCHAR(50) PRIMARY KEY,
    App_Description TEXT,
    App_Rnumber INT DEFAULT 0,
    App_startDate DATE,
    App_endDate DATE,
    App_permit_Create JSON,
    App_permit_Open JSON,
    App_permit_toDoList JSON,
    App_permit_Doing JSON,
    App_permit_Done JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO applications (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) VALUES
('WEBAPP', 'Customer-facing web application with user authentication and dashboard features', 3, '2025-01-01', '2025-06-30', '["dev team", "project lead"]', '["project lead"]', '["project lead"]', '["dev team"]', '["project lead", "project manager"]'),
('MOBILE', 'Cross-platform mobile application for iOS and Android', 2, '2025-02-01', '2025-08-31', '["dev team"]', '["project lead"]', '["project lead", "project manager"]', '["dev team"]', '["project manager"]'),
('API', 'RESTful API service for third-party integrations', 2, '2025-01-15', '2025-05-15', '["dev team", "project lead"]', '["project lead", "admin"]', '["project lead"]', '["dev team", "project lead"]', '["admin"]');

-- Plan table
CREATE TABLE IF NOT EXISTS plans (
    Plan_MVP_name VARCHAR(255) PRIMARY KEY,
    Plan_startDate DATE,
    Plan_endDate DATE,
    Plan_app_Acronym VARCHAR(50) NOT NULL,
    FOREIGN KEY (Plan_app_Acronym) REFERENCES applications(App_Acronym) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO plans (Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym) VALUES
('Sprint 1', '2025-01-01', '2025-01-14', 'WEBAPP'),
('Phase 1 - Core Features', '2025-02-01', '2025-03-15', 'MOBILE'),
('v1.0 Release', '2025-01-15', '2025-03-01', 'API');

-- Task table
CREATE TABLE IF NOT EXISTS tasks (
    Task_id VARCHAR(100) PRIMARY KEY,
    Task_name VARCHAR(255) NOT NULL UNIQUE,
    Task_description TEXT,
    Task_notes LONGTEXT,
    Task_plan VARCHAR(255),
    Task_app_Acronym VARCHAR(50) NOT NULL,
    Task_state ENUM('Open', 'To-Do', 'Doing', 'Done', 'Closed') DEFAULT 'Open',
    Task_creator VARCHAR(50) NOT NULL,
    Task_owner VARCHAR(50) NOT NULL,
    Task_createDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Task_app_Acronym) REFERENCES applications(App_Acronym) ON DELETE CASCADE,
    FOREIGN KEY (Task_plan) REFERENCES plans(Plan_MVP_name) ON DELETE SET NULL,
    FOREIGN KEY (Task_creator) REFERENCES accounts(username),
    FOREIGN KEY (Task_owner) REFERENCES accounts(username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO tasks (Task_id, Task_name, Task_description, Task_notes, Task_plan, Task_app_Acronym, Task_state, Task_creator, Task_owner, Task_createDate) VALUES
('WEBAPP_1', 'Implement user authentication', 'Create login and registration pages with JWT token authentication', '
[admin] [Open] [2025-01-02T08:00:00.000Z]
Initial task creation
==================================================
[admin] [To-Do] [2025-01-03T09:30:00.000Z]
Ready for development
==================================================', 'Sprint 1', 'WEBAPP', 'To-Do', 'admin', 'admin', '2025-01-02 08:00:00'),

('MOBILE_1', 'Design home screen UI', 'Create wireframes and mockups for the mobile app home screen', '
[admin] [Open] [2025-02-02T10:15:00.000Z]
Task created for UI design
==================================================
[admin] [To-Do] [2025-02-03T11:00:00.000Z]
Assigned to design team
==================================================
[admin] [Doing] [2025-02-05T14:20:00.000Z]
Work in progress
==================================================', 'Phase 1 - Core Features', 'MOBILE', 'Doing', 'admin', 'admin', '2025-02-02 10:15:00'),

('API_1', 'Setup database schema', 'Design and implement the initial database schema with all required tables', '
[admin] [Open] [2025-01-16T09:00:00.000Z]
Database setup task
==================================================
[admin] [To-Do] [2025-01-17T10:00:00.000Z]
Schema approved
==================================================
[admin] [Doing] [2025-01-18T11:00:00.000Z]
Implementation started
==================================================
[admin] [Done] [2025-01-20T16:30:00.000Z]
Schema implemented and tested
==================================================', 'v1.0 Release', 'API', 'Done', 'admin', 'admin', '2025-01-16 09:00:00');
