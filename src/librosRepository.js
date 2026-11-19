/**
 * Capa de datos: todas las consultas SQL a la tabla libros.
 * Se usan consultas parametrizadas (?) para evitar inyección SQL.
 */
function crearRepositorio(pool) {
  const COLUMNAS = 'id, titulo, autor, anio_publicacion';

  async function obtener(id) {
    const [filas] = await pool.execute(`SELECT ${COLUMNAS} FROM libros WHERE id = ?`, [id]);
    return filas[0] || null;
  }

  return {
    async listar() {
      const [filas] = await pool.execute(`SELECT ${COLUMNAS} FROM libros ORDER BY id`);
      return filas;
    },

    obtener,

    async crear({ titulo, autor, anio_publicacion }) {
      const [resultado] = await pool.execute(
        'INSERT INTO libros (titulo, autor, anio_publicacion) VALUES (?, ?, ?)',
        [titulo, autor, anio_publicacion]
      );
      return obtener(resultado.insertId);
    },

    async actualizar(id, { titulo, autor, anio_publicacion }) {
      const existente = await obtener(id);
      if (!existente) return null;
      await pool.execute(
        'UPDATE libros SET titulo = ?, autor = ?, anio_publicacion = ? WHERE id = ?',
        [titulo, autor, anio_publicacion, id]
      );
      return obtener(id);
    },

    async eliminar(id) {
      const [resultado] = await pool.execute('DELETE FROM libros WHERE id = ?', [id]);
      return resultado.affectedRows > 0;
    },
  };
}

module.exports = { crearRepositorio };
