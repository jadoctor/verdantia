const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    multipleStatements: true
  });

  const dropInsert = `DROP TRIGGER IF EXISTS trg_especies_after_insert;`;
  const triggerInsert = `
CREATE TRIGGER trg_especies_after_insert
AFTER INSERT ON especies
FOR EACH ROW
BEGIN
  INSERT INTO variedades (
    xvariedadesidespecies, variedadesnombre, variedadesesgenerica, variedadesdescripcion, variedadescolor,
    variedadestamano, variedadesdiasgerminacion, variedadesviabilidadsemilla, variedadesdiashastafructificacion,
    variedadestemperaturaminima, variedadestemperaturaoptima, variedadesmarcoplantas, variedadesmarcofilas,
    variedadesprofundidadsiembra, variedadeshistoria, variedadessemillerodesde, variedadessemillerohasta,
    variedadessiembradirectadesde, variedadessiembradirectahasta, variedadestrasplantedesde, variedadestrasplantehasta,
    variedadesrecolecciondesde, variedadesrecoleccionhasta, variedadesvisibilidadsino, variedadesautosuficiencia,
    variedadesautosuficienciaconserva, variedadesdiashastatrasplante, variedadesdiashastarecoleccion,
    variedadesautosuficienciaparcial, variedadesicono, variedadesbiodinamicacategoria, variedadesbiodinamicanotas,
    variedadesprofundidadtrasplante, variedadesphsuelo, variedadesnecesidadriego, variedadestiposiembra,
    variedadesvolumenmaceta, variedadesluzsolar, variedadescaracteristicassuelo, variedadesdificultad, variedadestemperaturamaxima
  ) VALUES (
    NEW.idespecies, CONCAT(NEW.especiesnombre, ' (Genérica)'), 1, NEW.especiesdescripcion, NEW.especiescolor,
    NEW.especiestamano, NEW.especiesdiasgerminacion, NEW.especiesviabilidadsemilla, NEW.especiesdiashastafructificacion,
    NEW.especiestemperaturaminima, NEW.especiestemperaturaoptima, NEW.especiesmarcoplantas, NEW.especiesmarcofilas,
    NEW.especiesprofundidadsiembra, NEW.especieshistoria, NEW.especiesfechasemillerodesde, NEW.especiesfechasemillerohasta,
    NEW.especiesfechasiembradirectadesde, NEW.especiesfechasiembradirectahasta, NEW.especiestrasplantedesde, NEW.especiestrasplantehasta,
    NEW.especiesfecharecolecciondesde, NEW.especiesfecharecoleccionhasta, NEW.especiesvisibilidadsino, NEW.especiesautosuficiencia,
    NEW.especiesautosuficienciaconserva, NEW.especiesdiashastatrasplante, NEW.especiesdiashastarecoleccion,
    NEW.especiesautosuficienciaparcial, NEW.especiesicono, NEW.especiesbiodinamicacategoria, NEW.especiesbiodinamicanotas,
    NEW.especiesprofundidadtrasplante, NEW.especiesphsuelo, NEW.especiesnecesidadriego, NEW.especiestiposiembra,
    NEW.especiesvolumenmaceta, NEW.especiesluzsolar, NEW.especiescaracteristicassuelo, NEW.especiesdificultad, NEW.especiestemperaturamaxima
  );
END;
  `;

  const dropUpdate = `DROP TRIGGER IF EXISTS trg_especies_after_update;`;
  const triggerUpdate = `
CREATE TRIGGER trg_especies_after_update
AFTER UPDATE ON especies
FOR EACH ROW
BEGIN
  UPDATE variedades SET
    variedadesnombre = CONCAT(NEW.especiesnombre, ' (Genérica)'),
    variedadesdescripcion = NEW.especiesdescripcion,
    variedadescolor = NEW.especiescolor,
    variedadestamano = NEW.especiestamano,
    variedadesdiasgerminacion = NEW.especiesdiasgerminacion,
    variedadesviabilidadsemilla = NEW.especiesviabilidadsemilla,
    variedadesdiashastafructificacion = NEW.especiesdiashastafructificacion,
    variedadestemperaturaminima = NEW.especiestemperaturaminima,
    variedadestemperaturaoptima = NEW.especiestemperaturaoptima,
    variedadesmarcoplantas = NEW.especiesmarcoplantas,
    variedadesmarcofilas = NEW.especiesmarcofilas,
    variedadesprofundidadsiembra = NEW.especiesprofundidadsiembra,
    variedadeshistoria = NEW.especieshistoria,
    variedadessemillerodesde = NEW.especiesfechasemillerodesde,
    variedadessemillerohasta = NEW.especiesfechasemillerohasta,
    variedadessiembradirectadesde = NEW.especiesfechasiembradirectadesde,
    variedadessiembradirectahasta = NEW.especiesfechasiembradirectahasta,
    variedadestrasplantedesde = NEW.especiestrasplantedesde,
    variedadestrasplantehasta = NEW.especiestrasplantehasta,
    variedadesrecolecciondesde = NEW.especiesfecharecolecciondesde,
    variedadesrecoleccionhasta = NEW.especiesfecharecoleccionhasta,
    variedadesvisibilidadsino = NEW.especiesvisibilidadsino,
    variedadesautosuficiencia = NEW.especiesautosuficiencia,
    variedadesautosuficienciaconserva = NEW.especiesautosuficienciaconserva,
    variedadesdiashastatrasplante = NEW.especiesdiashastatrasplante,
    variedadesdiashastarecoleccion = NEW.especiesdiashastarecoleccion,
    variedadesautosuficienciaparcial = NEW.especiesautosuficienciaparcial,
    variedadesicono = NEW.especiesicono,
    variedadesbiodinamicacategoria = NEW.especiesbiodinamicacategoria,
    variedadesbiodinamicanotas = NEW.especiesbiodinamicanotas,
    variedadesprofundidadtrasplante = NEW.especiesprofundidadtrasplante,
    variedadesphsuelo = NEW.especiesphsuelo,
    variedadesnecesidadriego = NEW.especiesnecesidadriego,
    variedadestiposiembra = NEW.especiestiposiembra,
    variedadesvolumenmaceta = NEW.especiesvolumenmaceta,
    variedadesluzsolar = NEW.especiesluzsolar,
    variedadescaracteristicassuelo = NEW.especiescaracteristicassuelo,
    variedadesdificultad = NEW.especiesdificultad,
    variedadestemperaturamaxima = NEW.especiestemperaturamaxima
  WHERE xvariedadesidespecies = NEW.idespecies AND variedadesesgenerica = 1;
END;
  `;

  const retrofit = `
INSERT INTO variedades (
    xvariedadesidespecies, variedadesnombre, variedadesesgenerica, variedadesdescripcion, variedadescolor,
    variedadestamano, variedadesdiasgerminacion, variedadesviabilidadsemilla, variedadesdiashastafructificacion,
    variedadestemperaturaminima, variedadestemperaturaoptima, variedadesmarcoplantas, variedadesmarcofilas,
    variedadesprofundidadsiembra, variedadeshistoria, variedadessemillerodesde, variedadessemillerohasta,
    variedadessiembradirectadesde, variedadessiembradirectahasta, variedadestrasplantedesde, variedadestrasplantehasta,
    variedadesrecolecciondesde, variedadesrecoleccionhasta, variedadesvisibilidadsino, variedadesautosuficiencia,
    variedadesautosuficienciaconserva, variedadesdiashastatrasplante, variedadesdiashastarecoleccion,
    variedadesautosuficienciaparcial, variedadesicono, variedadesbiodinamicacategoria, variedadesbiodinamicanotas,
    variedadesprofundidadtrasplante, variedadesphsuelo, variedadesnecesidadriego, variedadestiposiembra,
    variedadesvolumenmaceta, variedadesluzsolar, variedadescaracteristicassuelo, variedadesdificultad, variedadestemperaturamaxima
)
SELECT 
    idespecies, CONCAT(especiesnombre, ' (Genérica)'), 1, especiesdescripcion, especiescolor,
    especiestamano, especiesdiasgerminacion, especiesviabilidadsemilla, especiesdiashastafructificacion,
    especiestemperaturaminima, especiestemperaturaoptima, especiesmarcoplantas, especiesmarcofilas,
    especiesprofundidadsiembra, especieshistoria, especiesfechasemillerodesde, especiesfechasemillerohasta,
    especiesfechasiembradirectadesde, especiesfechasiembradirectahasta, especiestrasplantedesde, especiestrasplantehasta,
    especiesfecharecolecciondesde, especiesfecharecoleccionhasta, especiesvisibilidadsino, especiesautosuficiencia,
    especiesautosuficienciaconserva, especiesdiashastatrasplante, especiesdiashastarecoleccion,
    especiesautosuficienciaparcial, especiesicono, especiesbiodinamicacategoria, especiesbiodinamicanotas,
    especiesprofundidadtrasplante, especiesphsuelo, especiesnecesidadriego, especiestiposiembra,
    especiesvolumenmaceta, especiesluzsolar, especiescaracteristicassuelo, especiesdificultad, especiestemperaturamaxima
FROM especies 
WHERE idespecies NOT IN (SELECT xvariedadesidespecies FROM variedades WHERE variedadesesgenerica = 1);
  `;

  try {
    await conn.query(dropInsert);
    await conn.query(triggerInsert);
    console.log('✅ Trigger AFTER INSERT creado.');

    await conn.query(dropUpdate);
    await conn.query(triggerUpdate);
    console.log('✅ Trigger AFTER UPDATE creado.');

    const [ret] = await conn.query(retrofit);
    console.log('✅ Retrofit completado. Variedades genéricas creadas:', ret.affectedRows);
  } catch(e) {
    console.error('Error:', e.message);
  }
  
  await conn.end();
}

main();
