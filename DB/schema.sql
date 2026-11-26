-- Base de datos MySQL para el Sistema de Liquidación e Informe Tributario (RC-IVA Bolivia)
-- Si aún no existe el usuario MySQL, ejecutar como root:
--   CREATE USER IF NOT EXISTS 'admin_impuestos'@'localhost' IDENTIFIED BY '123';
--   GRANT ALL PRIVILEGES ON `sistema_impuestos`.* TO 'admin_impuestos'@'localhost';
--   FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS `sistema_impuestos`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sistema_impuestos`;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(64) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `documento` VARCHAR(50) NOT NULL,
  `empresa` VARCHAR(150) NOT NULL DEFAULT '',
  `cargo` VARCHAR(150) NOT NULL DEFAULT '',
  `tipo_cuenta` ENUM('Dependiente', 'Independiente', 'Auditor', 'Administrador') NOT NULL DEFAULT 'Dependiente',
  `password_hash` VARCHAR(255) NOT NULL,
  `avatar_color` VARCHAR(20) NOT NULL DEFAULT '#2563eb',
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `datos_tributarios` (
  `usuario_id` VARCHAR(64) NOT NULL,
  `sueldo_bruto` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `saldo_anterior` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `ufv_anterior` DECIMAL(10, 5) NOT NULL DEFAULT 0.00000,
  `ufv_actual` DECIMAL(10, 5) NOT NULL DEFAULT 0.00000,
  `total_facturas_manual` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `usa_facturas_detalladas` TINYINT(1) NOT NULL DEFAULT 0,
  `periodo` VARCHAR(7) NOT NULL DEFAULT '2026-11',
  `config_json` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`),
  CONSTRAINT `fk_datos_tributarios_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `facturas` (
  `id` VARCHAR(64) NOT NULL,
  `usuario_id` VARCHAR(64) NOT NULL,
  `numero` VARCHAR(60) NOT NULL,
  `proveedor` VARCHAR(150) NOT NULL DEFAULT '',
  `fecha` DATE NOT NULL,
  `monto` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `concepto` VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_facturas_usuario` (`usuario_id`),
  CONSTRAINT `fk_facturas_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `declaraciones` (
  `id` VARCHAR(64) NOT NULL,
  `usuario_id` VARCHAR(64) NOT NULL,
  `fecha_guardado` DATETIME NOT NULL,
  `periodo` VARCHAR(7) NOT NULL,
  `sueldo_bruto` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `saldo_anterior` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_facturas_manual` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `usa_facturas_detalladas` TINYINT(1) NOT NULL DEFAULT 0,
  `impuesto_determinado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_pagar` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status_label` VARCHAR(100) NOT NULL DEFAULT '',
  `contribuyente_json` JSON NOT NULL,
  `resultado_json` JSON NOT NULL,
  `config_json` JSON NOT NULL,
  `facturas_json` JSON NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_declaraciones_usuario_fecha` (`usuario_id`, `fecha_guardado`),
  CONSTRAINT `fk_declaraciones_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `normativa_global` (
  `id` TINYINT NOT NULL DEFAULT 1,
  `config_json` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
