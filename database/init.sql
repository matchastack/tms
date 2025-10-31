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

-- Plan table
CREATE TABLE IF NOT EXISTS plans (
    Plan_MVP_name VARCHAR(255) PRIMARY KEY,
    Plan_startDate DATE,
    Plan_endDate DATE,
    Plan_app_Acronym VARCHAR(50) NOT NULL,
    FOREIGN KEY (Plan_app_Acronym) REFERENCES applications(App_Acronym) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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
    Task_owner VARCHAR(50),
    Task_createDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Task_app_Acronym) REFERENCES applications(App_Acronym) ON DELETE CASCADE,
    FOREIGN KEY (Task_plan) REFERENCES plans(Plan_MVP_name) ON DELETE SET NULL,
    FOREIGN KEY (Task_creator) REFERENCES accounts(username),
    FOREIGN KEY (Task_owner) REFERENCES accounts(username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
