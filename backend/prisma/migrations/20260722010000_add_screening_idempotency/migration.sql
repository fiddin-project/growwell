ALTER TABLE `Skrining`
    ADD COLUMN `client_submission_id` VARCHAR(36) NULL,
    ADD COLUMN `submission_hash` CHAR(64) NULL,
    ADD COLUMN `instrument_revision` VARCHAR(80) NULL;

CREATE UNIQUE INDEX `Skrining_client_submission_id_key`
    ON `Skrining`(`client_submission_id`);
