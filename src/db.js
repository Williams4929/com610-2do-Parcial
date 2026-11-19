const fs = require('fs');
const mysql = require('mysql2/promise');

/** Crea el pool de conexiones a RDS usando variables de entorno. */
function crearPool() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  };

  // Certificado de AWS RDS para conexión cifrada (TLS)
  if (process.env.DB_SSL_CA) {
    config.ssl = { ca: fs.readFileSync(process.env.DB_SSL_CA) };
  }

  return mysql.createPool(config);
}

module.exports = { crearPool };