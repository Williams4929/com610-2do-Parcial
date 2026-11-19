require('dotenv').config({ quiet: true });

const { createApp } = require('./app');
const { crearPool } = require('./db');
const { crearRepositorio } = require('./librosRepository');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const pool = crearPool();
const app = createApp(crearRepositorio(pool));

app.listen(PORT, HOST, () => {
  console.log(`API de libros escuchando en http://${HOST}:${PORT}`);
});
