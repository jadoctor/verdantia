import mysql from 'mysql2/promise';

// Configuración global del pool de conexiones para reutilizarlas en Serverless/Server Actions
const pool = mysql.createPool({
  host: process.env.DB_HOST || '34.175.111.133',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Verdantiaja0334',
  database: process.env.DB_NAME || 'semillas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
