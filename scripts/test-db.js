const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({ host: 'srv2070.hstgr.io', user: 'u117557593_Verdantia', password: 'Hostingerja0334&', database: 'u117557593_Verdantia' });
  try {
    const query = `UPDATE especies SET
      especiesnombre = ?, especiesnombrecientifico = ?, especiesfamilia = ?, especiestipo = ?, especiesciclo = ?, 
      especiesdiasgerminacion = ?, especiesdiashastatrasplante = ?, especiesviabilidadsemilla = ?, especiespeso1000semillas = ?, especiesdiashastafructificacion = ?, especiesdiascrecimientofirme = ?,
      especiestemperaturaminima = ?, especiestemperaturaoptima = ?, especiesmarcoplantas = ?, especiesmarcofilas = ?, 
      especiesprofundidadsiembra = ?, especieshistoria = ?, especiesdescripcion = ?, especiescolor = ?, especiestamano = ?, 
      especiesfechasemillerodesde = ?, especiesfechasemillerohasta = ?, especiesfechasiembradirectadesde = ?, 
      especiesfechasiembradirectahasta = ?, especiestrasplantedesde = ?, especiestrasplantehasta = ?, 
      especiesfecharecolecciondesde = ?, especiesfecharecoleccionhasta = ?, especiesvisibilidadsino = ?, 
      especiesfuentesinformacion = ?, especiesautosuficiencia = ?, especiesautosuficienciaparcial = ?, especiesautosuficienciaconserva = ?, especiesicono = ?,
      especiesbiodinamicacategoria = ?, especiesbiodinamicanotas = ?,
      especiesprofundidadtrasplante = ?, especiesphsuelo = ?, especiesnecesidadriego = ?, especiestiposiembra = ?, especiestiposiembrapreferente = ?,
      especiesvolumenmaceta = ?, especiesluzsolar = ?, especiescaracteristicassuelo = ?, especiesdificultad = ?,
      especiestemperaturamaxima = ?, especiesdiashastarecoleccion = ?,
      especieslunarfasesiembra = ?, especieslunarfasetrasplante = ?, especieslunarobservaciones = ?,
      especiesbiodinamicafasesiembra = ?, especiesbiodinamicafasetrasplante = ?,
      especiesemillerovolumendesde = ?, especiesemillerovolumenhasta = ?
    WHERE idespecies = ?`;
    const params = Array(54).fill(null);
    params[0] = 'Test';
    params[28] = 1; // visibilidad
    params[54] = 9; // id = 9
    const [result] = await pool.query(query, params);
    console.log("Success:", result);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}
run();
