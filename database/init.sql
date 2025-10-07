CREATE DATABASE IF NOT EXISTS nodelogin DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci; 

USE nodelogin;

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    userGroup VARCHAR(50) NOT NULL,
    isActive TINYINT(1) DEFAULT 1
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8; 

INSERT INTO accounts (username, password, email, userGroup, isActive) VALUES
("test", "test", "test@test.com", "dev", 1);
INSERT INTO accounts (username, password, email, userGroup, isActive) VALUES
("admin", "admin", "admin@m.com", "admin", 1);
