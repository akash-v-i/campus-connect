CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NULL,
    full_name VARCHAR(255) NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    wallet_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reward_points INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
