-- 1. Crear la tabla de Fases de Cultivo
CREATE TABLE IF NOT EXISTS `fasescultivo` (
  `idfasescultivo` int(11) NOT NULL AUTO_INCREMENT,
  `fasescultivoclave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fasescultivonombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fasescultivoorden` int(11) NOT NULL,
  `fasescultivocolor` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#3b82f6',
  `fasescultivoicono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '🌱',
  `fasescultivodescripcion` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idfasescultivo`),
  UNIQUE KEY `uk_fasescultivoclave` (`fasescultivoclave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insertar los 7 estados iniciales
INSERT IGNORE INTO `fasescultivo` (`fasescultivoclave`, `fasescultivonombre`, `fasescultivoorden`, `fasescultivocolor`, `fasescultivoicono`, `fasescultivodescripcion`) VALUES
('planificado', 'Planificado / En espera', 1, '#94a3b8', '📅', 'El cultivo está registrado pero aún no hay semilla en tierra.'),
('germinando', 'Germinando (Bajo tierra)', 2, '#60a5fa', '💧', 'Semilla plantada, esperando a que brote.'),
('semillero', 'En Semillero / Plántula', 3, '#10b981', '🌱', 'Ha brotado y está creciendo antes del trasplante.'),
('crecimiento', 'Crecimiento vegetativo', 4, '#059669', '🌿', 'En el huerto definitivo, echando hojas y altura.'),
('produccion', 'En Producción / Cosecha', 5, '#f59e0b', '🍅', 'Época de floración y recogida de frutos.'),
('finalizado', 'Finalizado', 6, '#475569', '🏁', 'El cultivo ha terminado su ciclo de forma natural.'),
('perdido', 'Perdido', 99, '#ef4444', '🥀', 'El cultivo fracasó por plagas, clima, o no germinó.');

-- 3. Añadir la relación a la tabla de cultivos
ALTER TABLE `cultivos` 
ADD COLUMN `xcultivosidfasescultivo` int(11) DEFAULT NULL;

ALTER TABLE `cultivos` 
ADD CONSTRAINT `fk_cultivos_fasescultivo` FOREIGN KEY (`xcultivosidfasescultivo`) REFERENCES `fasescultivo` (`idfasescultivo`);

-- 4. Opcional: Migrar el valor antiguo de 'cultivosestado' al nuevo campo si es necesario.
-- Ejemplo de migración:
-- UPDATE `cultivos` SET `xcultivosidfasescultivo` = 4 WHERE `cultivosestado` = 'crecimiento';
-- UPDATE `cultivos` SET `xcultivosidfasescultivo` = 5 WHERE `cultivosestado` = 'produccion';
