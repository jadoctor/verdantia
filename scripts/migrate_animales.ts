
import pool from '../src/lib/db';

async function main() {
  try {
    console.log('Renombrando tabla consumidores...');
    await pool.query('RENAME TABLE `consumidores` TO `animales`');

    console.log('Renombrando columnas de animales...');
    await pool.query('ALTER TABLE `animales` CHANGE `idconsumidores` `idanimales` INT AUTO_INCREMENT');
    await pool.query('ALTER TABLE `animales` CHANGE `consumidoresnombre` `animalesnombre` VARCHAR(255)');
    await pool.query('ALTER TABLE `animales` CHANGE `consumidoresicono` `animalesicono` VARCHAR(255)');
    await pool.query('ALTER TABLE `animales` CHANGE `consumidoresdescripcion` `animalesdescripcion` TEXT');
    await pool.query('ALTER TABLE `animales` CHANGE `consumidoresactivo` `animalesactivo` TINYINT(1) DEFAULT 1');

    console.log('Renombrando tabla especiesconsumidores...');
    await pool.query('RENAME TABLE `especiesconsumidores` TO `especiesanimales`');

    console.log('Renombrando columnas de especiesanimales...');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `idespeciesconsumidores` `idespeciesanimales` INT AUTO_INCREMENT');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `xespeciesconsumidoresidespecies` `xespeciesanimalesidespecies` INT');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `xespeciesconsumidoresidconsumidores` `xespeciesanimalesidanimales` INT');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `especiesconsumidoresesapto` `especiesanimalesesapto` TINYINT(1)');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `xespeciesconsumidoresidplantasparte` `xespeciesanimalesidplantasparte` INT');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `especiesconsumidorespartes` `especiesanimalespartes` VARCHAR(255)');
    await pool.query('ALTER TABLE `especiesanimales` CHANGE `especiesconsumidoresnotas` `especiesanimalesnotas` TEXT');

    console.log('Migración completada con éxito!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
