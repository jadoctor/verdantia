import pool from '../src/lib/db';

async function run() {
  try {
    await pool.query('DROP TRIGGER IF EXISTS after_especies_update');
    await pool.query(`
      CREATE TRIGGER after_especies_update 
      AFTER UPDATE ON especies 
      FOR EACH ROW 
      BEGIN 
        UPDATE variedades SET 
          variedadesdiasgerminacion = NEW.especiesdiasgerminacion, 
          variedadesdiashastatrasplante = NEW.especiesdiashastatrasplante, 
          variedadesviabilidadsemilla = NEW.especiesviabilidadsemilla, 
          variedadespeso1000semillas = NEW.especiespeso1000semillas, 
          variedadesdiashastafructificacion = NEW.especiesdiashastafructificacion, 
          variedadestemperaturaminima = NEW.especiestemperaturaminima, 
          variedadestemperaturaoptima = NEW.especiestemperaturaoptima, 
          variedadesmarcoplantas = NEW.especiesmarcoplantas, 
          variedadesmarcofilas = NEW.especiesmarcofilas, 
          variedadesprofundidadsiembra = NEW.especiesprofundidadsiembra, 
          variedadessemillerodesde = NEW.especiesfechasemillerodesde, 
          variedadessemillerohasta = NEW.especiesfechasemillerohasta, 
          variedadessiembradirectadesde = NEW.especiesfechasiembradirectadesde, 
          variedadessiembradirectahasta = NEW.especiesfechasiembradirectahasta, 
          variedadestrasplantedesde = NEW.especiestrasplantedesde, 
          variedadestrasplantehasta = NEW.especiestrasplantehasta, 
          variedadesrecolecciondesde = NEW.especiesfecharecolecciondesde, 
          variedadesrecoleccionhasta = NEW.especiesfecharecoleccionhasta, 
          variedadesautosuficiencia = NEW.especiesautosuficiencia, 
          variedadesautosuficienciaconserva = NEW.especiesautosuficienciaconserva, 
          variedadesdiashastarecoleccion = NEW.especiesdiashastarecoleccion, 
          variedadesautosuficienciaparcial = NEW.especiesautosuficienciaparcial, 
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
    `);
    
    await pool.query('DROP TRIGGER IF EXISTS after_especies_insert');
    await pool.query(`
      CREATE TRIGGER after_especies_insert 
      AFTER INSERT ON especies 
      FOR EACH ROW 
      BEGIN 
        INSERT INTO variedades (
          variedadesnombre, xvariedadesidespecies, variedadesesgenerica,
          variedadesdiasgerminacion, variedadesdiashastatrasplante, 
          variedadesviabilidadsemilla, variedadespeso1000semillas,
          variedadesdiashastafructificacion, variedadestemperaturaminima, 
          variedadestemperaturaoptima, variedadesmarcoplantas, 
          variedadesmarcofilas, variedadesprofundidadsiembra, 
          variedadessemillerodesde, variedadessemillerohasta, 
          variedadessiembradirectadesde, variedadessiembradirectahasta, 
          variedadestrasplantedesde, variedadestrasplantehasta, 
          variedadesrecolecciondesde, variedadesrecoleccionhasta, 
          variedadesautosuficiencia, variedadesautosuficienciaconserva, 
          variedadesdiashastarecoleccion, variedadesautosuficienciaparcial, 
          variedadesbiodinamicacategoria, variedadesbiodinamicanotas, 
          variedadesprofundidadtrasplante, variedadesphsuelo, 
          variedadesnecesidadriego, variedadestiposiembra, 
          variedadesvolumenmaceta, variedadesluzsolar, 
          variedadescaracteristicassuelo, variedadesdificultad, 
          variedadestemperaturamaxima
        ) VALUES (
          'Variedad Genérica', NEW.idespecies, 1,
          NEW.especiesdiasgerminacion, NEW.especiesdiashastatrasplante, 
          NEW.especiesviabilidadsemilla, NEW.especiespeso1000semillas,
          NEW.especiesdiashastafructificacion, NEW.especiestemperaturaminima, 
          NEW.especiestemperaturaoptima, NEW.especiesmarcoplantas, 
          NEW.especiesmarcofilas, NEW.especiesprofundidadsiembra, 
          NEW.especiesfechasemillerodesde, NEW.especiesfechasemillerohasta, 
          NEW.especiesfechasiembradirectadesde, NEW.especiesfechasiembradirectahasta, 
          NEW.especiestrasplantedesde, NEW.especiestrasplantehasta, 
          NEW.especiesfecharecolecciondesde, NEW.especiesfecharecoleccionhasta, 
          NEW.especiesautosuficiencia, NEW.especiesautosuficienciaconserva, 
          NEW.especiesdiashastarecoleccion, NEW.especiesautosuficienciaparcial, 
          NEW.especiesbiodinamicacategoria, NEW.especiesbiodinamicanotas, 
          NEW.especiesprofundidadtrasplante, NEW.especiesphsuelo, 
          NEW.especiesnecesidadriego, NEW.especiestiposiembra, 
          NEW.especiesvolumenmaceta, NEW.especiesluzsolar, 
          NEW.especiescaracteristicassuelo, NEW.especiesdificultad, 
          NEW.especiestemperaturamaxima
        );
      END;
    `);

    console.log('Triggers successfully recreated with variedadespeso1000semillas');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

run();
