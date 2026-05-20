import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

const contenedores = [
  {
    contenedoresnombre: '10 cc - Bandeja micro-alvéolo (288 alvéolos)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 288,
    contenedoresvolumenalveolocc: 10,
    contenedoresvolumentotallitros: 2.88,
    contenedoresprofundidadalveolocm: 3.5,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '15 cc - Bandeja de alta densidad (200 alvéolos)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 200,
    contenedoresvolumenalveolocc: 15,
    contenedoresvolumentotallitros: 3,
    contenedoresprofundidadalveolocm: 4,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '20 cc - Bandeja de alta densidad profunda (150 alvéolos)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 150,
    contenedoresvolumenalveolocc: 20,
    contenedoresvolumentotallitros: 3,
    contenedoresprofundidadalveolocm: 5,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '24 cc - Bandeja hortícola pequeña (104 alvéolos)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 104,
    contenedoresvolumenalveolocc: 24,
    contenedoresvolumentotallitros: 2.5,
    contenedoresprofundidadalveolocm: 4.5,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '30 cc - Bandeja de 98 cavidades',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 98,
    contenedoresvolumenalveolocc: 30,
    contenedoresvolumentotallitros: 2.94,
    contenedoresprofundidadalveolocm: 5,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '40 cc - Bandeja hortícola (84 cavidades)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 84,
    contenedoresvolumenalveolocc: 40,
    contenedoresvolumentotallitros: 3.36,
    contenedoresprofundidadalveolocm: 5.5,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '55 cc - Bandeja estándar (72 cavidades)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 72,
    contenedoresvolumenalveolocc: 55,
    contenedoresvolumentotallitros: 3.96,
    contenedoresprofundidadalveolocm: 6,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '75 cc - Bandeja de 60 cavidades',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 60,
    contenedoresvolumenalveolocc: 75,
    contenedoresvolumentotallitros: 4.5,
    contenedoresprofundidadalveolocm: 6.5,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '110 cc - Bandeja de 50 cavidades',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 50,
    contenedoresvolumenalveolocc: 110,
    contenedoresvolumentotallitros: 5.5,
    contenedoresprofundidadalveolocm: 7,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '115 cc - Bandeja de 40 cavidades',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 40,
    contenedoresvolumenalveolocc: 115,
    contenedoresvolumentotallitros: 4.6,
    contenedoresprofundidadalveolocm: 7,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '150 cc - Bandeja forestal estándar (35 cavidades)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 35,
    contenedoresvolumenalveolocc: 150,
    contenedoresvolumentotallitros: 5.25,
    contenedoresprofundidadalveolocm: 12,
    contenedoresantiespiralizacion: 1,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '178 cc - Bandeja de 32 cavidades',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 32,
    contenedoresvolumenalveolocc: 178,
    contenedoresvolumentotallitros: 5.7,
    contenedoresprofundidadalveolocm: 8,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '230 cc - Bandeja grande / Macetita forestal (20 cavidades)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 20,
    contenedoresvolumenalveolocc: 230,
    contenedoresvolumentotallitros: 4.6,
    contenedoresprofundidadalveolocm: 15,
    contenedoresantiespiralizacion: 1,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '350 cc - Bandeja forestal profunda (15 cavidades)',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'semillero',
    contenedorescantidadalveolos: 15,
    contenedoresvolumenalveolocc: 350,
    contenedoresvolumentotallitros: 5.25,
    contenedoresprofundidadalveolocm: 18,
    contenedoresantiespiralizacion: 1,
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '230 cc - Maceta termoconformada de 6,5 cm',
    contenedorestipo: 'maceta_individual',
    contenedoresclasificacion: 'ambos',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 230,
    contenedoresvolumentotallitros: 0.23,
    contenedoresprofundidadalveolocm: 7,
    contenedoresdimensiones: '6.5x6.5x7 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '500 cc - Maceta cuadrada P9 (9x9 cm)',
    contenedorestipo: 'maceta_individual',
    contenedoresclasificacion: 'ambos',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 500,
    contenedoresvolumentotallitros: 0.5,
    contenedoresprofundidadalveolocm: 10,
    contenedoresdimensiones: '9x9x10 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '700 cc - Maceta redonda 11 cm',
    contenedorestipo: 'maceta_individual',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 700,
    contenedoresvolumentotallitros: 0.7,
    contenedoresprofundidadalveolocm: 10,
    contenedoresdimensiones: '11x11x10 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '1000 cc - Maceta redonda 13 cm (1 Litro)',
    contenedorestipo: 'maceta_individual',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 1000,
    contenedoresvolumentotallitros: 1,
    contenedoresprofundidadalveolocm: 12,
    contenedoresdimensiones: '13x13x12 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '1500 cc - Maceta redonda 15 cm (1,5 Litros)',
    contenedorestipo: 'maceta_mediana',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 1500,
    contenedoresvolumentotallitros: 1.5,
    contenedoresprofundidadalveolocm: 14,
    contenedoresdimensiones: '15x15x14 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '2000 cc - Maceta redonda 17 cm (2 Litros)',
    contenedorestipo: 'maceta_mediana',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 2000,
    contenedoresvolumentotallitros: 2,
    contenedoresprofundidadalveolocm: 15,
    contenedoresdimensiones: '17x17x15 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '2500 cc - Maceta 1 Galón Comercial (2,5 Litros)',
    contenedorestipo: 'maceta_mediana',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 2500,
    contenedoresvolumentotallitros: 2.5,
    contenedoresprofundidadalveolocm: 17,
    contenedoresdimensiones: '18x18x17 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '3000 cc - Maceta redonda 19 cm (3 Litros)',
    contenedorestipo: 'maceta_mediana',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 3000,
    contenedoresvolumentotallitros: 3,
    contenedoresprofundidadalveolocm: 18,
    contenedoresdimensiones: '19x19x18 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '5000 cc - Maceta redonda 22 cm (5 Litros)',
    contenedorestipo: 'maceta_mediana',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 5000,
    contenedoresvolumentotallitros: 5,
    contenedoresprofundidadalveolocm: 20,
    contenedoresdimensiones: '22x22x20 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '7000 cc - Maceta redonda 25 cm (7 Litros)',
    contenedorestipo: 'maceta_grande',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 7000,
    contenedoresvolumentotallitros: 7,
    contenedoresprofundidadalveolocm: 23,
    contenedoresdimensiones: '25x25x23 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '10000 cc - Contenedor 27 cm (10 Litros)',
    contenedorestipo: 'maceta_grande',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 10000,
    contenedoresvolumentotallitros: 10,
    contenedoresprofundidadalveolocm: 25,
    contenedoresdimensiones: '27x27x25 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '15000 cc - Contenedor 30 cm (15 Litros)',
    contenedorestipo: 'maceta_grande',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 15000,
    contenedoresvolumentotallitros: 15,
    contenedoresprofundidadalveolocm: 28,
    contenedoresdimensiones: '30x30x28 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '20000 cc - Contenedor 35 cm (20 Litros)',
    contenedorestipo: 'maceta_grande',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 20000,
    contenedoresvolumentotallitros: 20,
    contenedoresprofundidadalveolocm: 30,
    contenedoresdimensiones: '35x35x30 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '25000 cc - Contenedor con asas (25 Litros)',
    contenedorestipo: 'maceta_grande',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 25000,
    contenedoresvolumentotallitros: 25,
    contenedoresprofundidadalveolocm: 33,
    contenedoresdimensiones: '38x38x33 cm',
    contenedoresactivo: 1
  },
  {
    contenedoresnombre: '50000 cc - Capazo grande (50 Litros)',
    contenedorestipo: 'maceta_grande',
    contenedoresclasificacion: 'maceta',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 50000,
    contenedoresvolumentotallitros: 50,
    contenedoresprofundidadalveolocm: 40,
    contenedoresdimensiones: '45x45x40 cm',
    contenedoresactivo: 1
  }
];

async function run() {
  try {
    const [cols] = await pool.query('DESCRIBE contenedores');
    
    await pool.query('SET FOREIGN_KEY_CHECKS=0;');
    await pool.query('DELETE FROM contenedores;');
    await pool.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log("Tabla contenedores vaciada.");

    for (const c of contenedores) {
      const keys = Object.keys(c);
      const values = Object.values(c);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `INSERT INTO contenedores (${keys.join(', ')}) VALUES (${placeholders})`;
      await pool.query(sql, values);
    }
    
    console.log(`Insertados ${contenedores.length} contenedores nuevos correctamente.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
