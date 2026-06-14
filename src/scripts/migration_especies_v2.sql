-- ============================================================
-- MIGRACIÓN ESPECIES V2 — Reestructuración del esquema
-- Ejecutar manualmente contra la DB de producción/staging
-- Fecha: 2026-06-14
-- ============================================================

-- PASO 1: Eliminar 6 campos huérfanos (sustituidos por especiesfases)
-- ATENCIÓN: alertas-hoy y plantas/[id] ya NO referencian estos campos tras la refactorización del código.

ALTER TABLE especies
  DROP COLUMN IF EXISTS especiesdiasgerminacion,
  DROP COLUMN IF EXISTS especiesdiashastatrasplante,
  DROP COLUMN IF EXISTS especiesdiashastafructificacion,
  DROP COLUMN IF EXISTS especiesdiashastarecoleccion,
  DROP COLUMN IF EXISTS especiesdiascrecimientofirme,
  DROP COLUMN IF EXISTS especiesduraciontotal;


-- PASO 2: Migrar pH de varchar a dos columnas decimales

ALTER TABLE especies
  ADD COLUMN especiesphminimosuelo DECIMAL(3,1) DEFAULT NULL AFTER especiesphsuelo,
  ADD COLUMN especiesphmaximosuelo DECIMAL(3,1) DEFAULT NULL AFTER especiesphminimosuelo;

-- Migrar datos existentes (parsear "6.0 - 6.8" → 6.0 y 6.8)
UPDATE especies 
SET 
  especiesphminimosuelo = CAST(TRIM(SUBSTRING_INDEX(especiesphsuelo, '-', 1)) AS DECIMAL(3,1)),
  especiesphmaximosuelo = CAST(TRIM(SUBSTRING_INDEX(especiesphsuelo, '-', -1)) AS DECIMAL(3,1))
WHERE especiesphsuelo IS NOT NULL AND especiesphsuelo LIKE '%-%';

-- Para registros con un solo valor (sin guión), poner el mismo en ambos
UPDATE especies
SET
  especiesphminimosuelo = CAST(TRIM(especiesphsuelo) AS DECIMAL(3,1)),
  especiesphmaximosuelo = CAST(TRIM(especiesphsuelo) AS DECIMAL(3,1))
WHERE especiesphsuelo IS NOT NULL AND especiesphsuelo NOT LIKE '%-%' AND especiesphsuelo != '';

-- Eliminar la columna varchar original
ALTER TABLE especies DROP COLUMN IF EXISTS especiesphsuelo;


-- PASO 3: Resolver overlap Biodinámica/Tipo
-- Renombrar especiesbiodinamicacategoria → especiesorganocomestible

ALTER TABLE especies CHANGE COLUMN especiesbiodinamicacategoria especiesorganocomestible VARCHAR(50) DEFAULT NULL;


-- PASO 4: Añadir campo de fecha de actualización

ALTER TABLE especies 
  ADD COLUMN especiesfechaactualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


-- PASO 5: Añadir 6 campos agronómicos nuevos

ALTER TABLE especies
  ADD COLUMN especiesresistenciahelada ENUM('nula','baja','media','alta') DEFAULT NULL,
  ADD COLUMN especiesnecesidadtutoraje ENUM('no','opcional','obligatorio') DEFAULT NULL,
  ADD COLUMN especiesporteplanta ENUM('rastrero','arbusto','mata','trepador','erecto') DEFAULT NULL,
  ADD COLUMN especiesrendimientoestimado VARCHAR(100) DEFAULT NULL,
  ADD COLUMN especiespartecosechable SET('fruto','hoja','raiz','bulbo','tallo','flor','semilla') DEFAULT NULL,
  ADD COLUMN especiesgerminaroscuridad TINYINT(1) DEFAULT NULL;


-- ============================================================
-- VERIFICACIÓN: Ejecutar tras la migración
-- ============================================================
-- SELECT idespecies, especiesnombre, especiesphminimosuelo, especiesphmaximosuelo, especiesorganocomestible, especiesresistenciahelada FROM especies LIMIT 10;
