CREATE DATABASE IF NOT EXISTS nodelogin DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci; 

USE nodelogin;

CREATE TABLE IF NOT EXISTS accounts (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    userGroups JSON NOT NULL,
    isActive TINYINT(1) DEFAULT 1
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8; 

INSERT INTO accounts (username, password, email, userGroups, isActive) VALUES
("admin", "$2a$10$xjP1qgUcVGXwCyu5OYEZFuGt5CsbjcK6oHFV.IJu4qyuXo62Dip46", "admin@m.com", '["admin"]', 1);
