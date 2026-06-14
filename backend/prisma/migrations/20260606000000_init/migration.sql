-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nama_lengkap` VARCHAR(100) NOT NULL,
    `role` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Anak` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `tanggal_lahir` DATE NOT NULL,
    `jenis_kelamin` VARCHAR(1) NOT NULL,
    `created_by` INTEGER NULL,
    `created_by_admin` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skala` (
    `id_skala` VARCHAR(10) NOT NULL,
    `nama_skala` VARCHAR(100) NOT NULL,
    `nama_skala_en` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_skala`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pertanyaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `teks_pertanyaan` TEXT NOT NULL,
    `teks_pertanyaan_en` TEXT NOT NULL,
    `id_skala` VARCHAR(10) NOT NULL,
    `skor_tidak_benar` INTEGER NOT NULL,
    `skor_agak_benar` INTEGER NOT NULL,
    `skor_selalu_benar` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AmbangBatas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_skala` VARCHAR(10) NULL,
    `batas_normal_max` INTEGER NOT NULL,
    `batas_borderline_max` INTEGER NOT NULL,
    `is_reversed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skrining` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `anak_id` INTEGER NOT NULL,
    `pengasuh_id` INTEGER NOT NULL,
    `tanggal_skrining` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total_score` INTEGER NOT NULL,
    `kategori_total` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HasilSkala` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `skrining_id` INTEGER NOT NULL,
    `id_skala` VARCHAR(10) NOT NULL,
    `skor` INTEGER NOT NULL,
    `kategori` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jawaban` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `skrining_id` INTEGER NOT NULL,
    `id_pertanyaan` INTEGER NOT NULL,
    `jawaban` VARCHAR(20) NOT NULL,
    `skor_diberikan` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Edukasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(255) NOT NULL,
    `judul_en` VARCHAR(255) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `deskripsi_en` TEXT NOT NULL,
    `tipe` VARCHAR(10) NOT NULL,
    `url_atau_file` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Psikolog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `spesialisasi` VARCHAR(200) NOT NULL,
    `spesialisasi_en` VARCHAR(200) NOT NULL,
    `nomor_whatsapp` VARCHAR(20) NOT NULL,
    `pesan_default` TEXT NOT NULL,
    `pesan_default_en` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Anak` ADD CONSTRAINT `Anak_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pertanyaan` ADD CONSTRAINT `Pertanyaan_id_skala_fkey` FOREIGN KEY (`id_skala`) REFERENCES `Skala`(`id_skala`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AmbangBatas` ADD CONSTRAINT `AmbangBatas_id_skala_fkey` FOREIGN KEY (`id_skala`) REFERENCES `Skala`(`id_skala`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Skrining` ADD CONSTRAINT `Skrining_anak_id_fkey` FOREIGN KEY (`anak_id`) REFERENCES `Anak`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Skrining` ADD CONSTRAINT `Skrining_pengasuh_id_fkey` FOREIGN KEY (`pengasuh_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HasilSkala` ADD CONSTRAINT `HasilSkala_skrining_id_fkey` FOREIGN KEY (`skrining_id`) REFERENCES `Skrining`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HasilSkala` ADD CONSTRAINT `HasilSkala_id_skala_fkey` FOREIGN KEY (`id_skala`) REFERENCES `Skala`(`id_skala`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jawaban` ADD CONSTRAINT `Jawaban_skrining_id_fkey` FOREIGN KEY (`skrining_id`) REFERENCES `Skrining`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jawaban` ADD CONSTRAINT `Jawaban_id_pertanyaan_fkey` FOREIGN KEY (`id_pertanyaan`) REFERENCES `Pertanyaan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
