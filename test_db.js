const mysql = require('mysql2/promise');
async function run() {
  const con = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'verdantia'});
  const [rows] = await con.query('SELECT especiesnombre, especiestiposiembra FROM especies WHERE especiesnombre LIKE "%calab%";');
  console.log(rows);
  process.exit(0);
}
run();
