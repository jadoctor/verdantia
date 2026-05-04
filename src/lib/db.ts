import type { Pool } from 'mysql2/promise';

// Bypass para evitar que Turbopack hashee el nombre del módulo en producción
const mysql = require('my' + 'sql2');

const pool: Pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 5000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
}).promise();

export default pool;
