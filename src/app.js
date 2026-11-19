const express = require('express');
const { validarLibro, parsearId } = require('./validacion');
const { version } = require('../package.json');

const VERSION = process.env.APP_VERSION || version;

/**
 * Crea la aplicación Express.
 * Recibe el repositorio (capa de datos) como parámetro para que en las
 * pruebas (ejercicio 2) se pueda reemplazar por un doble sin RDS real.
 */
function createApp(repo) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', servicio: 'api-libros', version: VERSION });
  });

  app.get('/libros', async (req, res, next) => {
    try {
      res.status(200).json(await repo.listar());
    } catch (err) {
      next(err);
    }
  });

  app.get('/libros/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

      const libro = await repo.obtener(id);
      if (!libro) return res.status(404).json({ error: `No existe el libro con id ${id}` });

      res.status(200).json(libro);
    } catch (err) {
      next(err);
    }
  });

  app.post('/libros', async (req, res, next) => {
    try {
      const { errores, datos } = validarLibro(req.body);
      if (errores.length) return res.status(400).json({ errores });

      const creado = await repo.crear(datos);
      res.status(201).json(creado);
    } catch (err) {
      next(err);
    }
  });

  app.put('/libros/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

      const { errores, datos } = validarLibro(req.body);
      if (errores.length) return res.status(400).json({ errores });

      const actualizado = await repo.actualizar(id, datos);
      if (!actualizado) return res.status(404).json({ error: `No existe el libro con id ${id}` });

      res.status(200).json(actualizado);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/libros/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (id === null) return res.status(400).json({ error: 'El id debe ser un entero positivo' });

      const eliminado = await repo.eliminar(id);
      if (!eliminado) return res.status(404).json({ error: `No existe el libro con id ${id}` });

      res.status(200).json({ mensaje: `Libro ${id} eliminado` });
    } catch (err) {
      next(err);
    }
  });

  // Ruta no encontrada
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejo de errores (JSON mal formado y errores internos)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { createApp };
