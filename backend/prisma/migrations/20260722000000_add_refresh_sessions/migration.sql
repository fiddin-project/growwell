CREATE TABLE `RefreshSession` (
    `id` VARCHAR(36) NOT NULL,
    `family_id` VARCHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `replaced_by_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(255) NULL,
    `ip_address` VARCHAR(64) NULL,

    UNIQUE INDEX `RefreshSession_token_hash_key`(`token_hash`),
    INDEX `RefreshSession_user_id_idx`(`user_id`),
    INDEX `RefreshSession_family_id_idx`(`family_id`),
    INDEX `RefreshSession_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RefreshSession`
    ADD CONSTRAINT `RefreshSession_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
