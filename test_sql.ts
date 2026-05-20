import pool from './src/lib/db'; 
async function run() { 
  try { 
    const user = { id: 1 }; 
    const [cultivos] = await pool.query("SELECT c.*, vu.variedadesnombre as nombre_variedad_usuario, vg.variedadesnombre as nombre_variedad_gold, e.idespecies, e.especiesnombre, e.especiesicono, COALESCE(vu.variedadesdiasgerminacion, vg.variedadesdiasgerminacion, e.especiesdiasgerminacion) AS dias_germinacion, COALESCE(vu.variedadesdiastrasplante, vg.variedadesdiastrasplante, e.especiesdiastrasplante) AS dias_trasplante, COALESCE(vu.variedadesdiascrecimiento, vg.variedadesdiascrecimiento, e.especiesdiascrecimiento) AS dias_crecimiento, COALESCE(vu.variedadesdiasfructificacion, vg.variedadesdiasfructificacion, e.especiesdiasfructificacion) AS dias_fructificacion, COALESCE(vu.variedadesdiasrecoleccion, vg.variedadesdiasrecoleccion, e.especiesdiasrecoleccion) AS dias_recoleccion, COALESCE(vu.variedadesciclovidadias, vg.variedadesciclovidadias, e.especiesciclovidadias) AS duracion_total FROM cultivos c JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades JOIN especies e ON vg.xvariedadesidespecies = e.idespecies WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1 AND c.cultivosestado != 'perdido' AND c.cultivosestado != 'finalizado'", [user.id]); 
    console.log('Cultivos count:', cultivos.length); 
    const [pautasRows] = await pool.query("SELECT lp.*, l.laboresnombre, l.laboresicono, l.laborescolor FROM laborespauta lp JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores WHERE lp.xlaborespautaidusuarios = ? OR lp.xlaborespautaidvariedades IN (SELECT xcultivosidvariedades FROM cultivos WHERE xcultivosidusuarios = ? AND cultivosactivosino = 1) OR lp.xlaborespautaidvariedades IN (SELECT vg.idvariedades FROM cultivos c JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1) OR lp.xlaborespautaidespecies IN (SELECT e.idespecies FROM cultivos c JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades JOIN especies e ON vg.xvariedadesidespecies = e.idespecies WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1)", [user.id, user.id, user.id, user.id]); 
    console.log('Pautas count:', pautasRows.length); 
  } catch (e) { 
    console.error(e); 
  } 
  process.exit(0); 
} 
run();
