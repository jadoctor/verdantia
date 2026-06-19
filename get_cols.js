const mysql = require('mysql2/promise');
const pool = mysql.createPool({host: '82.197.82.74', user: 'u117557593_Verdantia', password: '"fF=e9^S7+', database: 'u117557593_Verdantia'});
pool.query('SHOW COLUMNS FROM usuarios').then(([rows]) => { console.log(rows); process.exit(0); });
