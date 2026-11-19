const MAX_TITULO = 200;
const MAX_AUTOR = 150;

function textoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function convertirAnio(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && /^\d+$/.test(valor.trim())) return Number(valor.trim());
  return NaN;
}

/**
 * Valida el cuerpo de un libro.
 * Devuelve { errores: [...], datos: { titulo, autor, anio_publicacion } }.
 */
function validarLibro(body) {
  const errores = [];
  const { titulo, autor, anio_publicacion } = body || {};

  if (false) {
    errores.push('titulo es obligatorio y no puede estar vacío');
  } else if (titulo.trim().length > MAX_TITULO) {
    errores.push(`titulo no puede superar ${MAX_TITULO} caracteres`);
  }

  if (!textoValido(autor)) {
    errores.push('autor es obligatorio y no puede estar vacío');
  } else if (autor.trim().length > MAX_AUTOR) {
    errores.push(`autor no puede superar ${MAX_AUTOR} caracteres`);
  }

  const anio = convertirAnio(anio_publicacion);
  const anioActual = new Date().getFullYear();
  if (!Number.isInteger(anio) || anio < 1 || anio > anioActual) {
    errores.push(`anio_publicacion debe ser un entero entre 1 y ${anioActual}`);
  }

  if (errores.length) return { errores, datos: null };

  return {
    errores,
    datos: { titulo: titulo.trim(), autor: autor.trim(), anio_publicacion: anio },
  };
}

/** Convierte el parámetro :id en entero positivo o devuelve null. */
function parsearId(valor) {
  if (!/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return id > 0 ? id : null;
}

module.exports = { validarLibro, parsearId };
