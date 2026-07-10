-- ============================================================
-- AI-Powered Task & Knowledge Management System
-- MySQL Database Setup Script
-- Run this in MySQL Workbench before starting the backend
-- ============================================================

-- Step 1: Create the database
CREATE DATABASE IF NOT EXISTS ai_task_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ai_task_db;

-- ============================================================
-- TABLE 1: roles
-- Stores Admin/User roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id     INT          NOT NULL AUTO_INCREMENT,
    role_name   VARCHAR(50)  NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 2: users
-- Stores all users (Admins and regular Users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id       INT          NOT NULL AUTO_INCREMENT,
    role_id       INT          NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  DEFAULT NULL,
    profile_image VARCHAR(255) DEFAULT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login    DATETIME     DEFAULT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 3: documents
-- Stores uploaded document metadata (NOT embeddings - those go to FAISS)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    document_id        INT          NOT NULL AUTO_INCREMENT,
    uploaded_by        INT          NOT NULL,
    file_name          VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type          VARCHAR(20)  NOT NULL,
    file_size          BIGINT       DEFAULT NULL,
    file_path          VARCHAR(500) DEFAULT NULL,
    total_pages        INT          DEFAULT NULL,
    total_chunks       INT          DEFAULT NULL,
    upload_date        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_status  ENUM('Processing','Completed','Failed') NOT NULL DEFAULT 'Completed',
    PRIMARY KEY (document_id),
    CONSTRAINT fk_documents_user FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 4: tasks
-- Stores task assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    task_id     INT          NOT NULL AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL,
    assigned_to INT          NOT NULL,
    created_by  INT          NOT NULL,
    priority    ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
    status      ENUM('Pending','Completed') NOT NULL DEFAULT 'Pending',
    due_date    DATE         DEFAULT NULL,
    answer      TEXT         DEFAULT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id),
    CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id),
    CONSTRAINT fk_tasks_created  FOREIGN KEY (created_by)  REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 5: activity_logs
-- Stores every important activity: LOGIN, DOCUMENT_UPLOAD, TASK_CREATED, TASK_UPDATE, SEARCH
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id               INT          NOT NULL AUTO_INCREMENT,
    user_id              INT          NOT NULL,
    activity_type        VARCHAR(100) NOT NULL,
    activity_description TEXT         DEFAULT NULL,
    ip_address           VARCHAR(45)  DEFAULT NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE 6: search_logs
-- Stores search history for analytics (most searched queries)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_logs (
    search_id     INT      NOT NULL AUTO_INCREMENT,
    user_id       INT      NOT NULL,
    search_query  TEXT     NOT NULL,
    results_found INT      NOT NULL DEFAULT 0,
    searched_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (search_id),
    CONSTRAINT fk_search_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: Roles
-- ============================================================
INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
(1, 'Admin', 'System Administrator - full access'),
(2, 'User',  'Regular User - limited access');

-- ============================================================
-- Verify tables created
-- ============================================================
SHOW TABLES;
