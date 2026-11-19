const request = require('supertest');
const { createApp } = require('../src/app');

/**
 * Doble de prueba de la capa de datos: guarda los libros en memoria.
 * Así las pruebas se ejecutan sin una instancia RDS real.
 */
function crearRepoFalso() {
  let libros = [
    { id: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio_publicacion: 1967 },
  ];
  let siguienteId = 2;

  return {
    listar: async () => libros,
    obtener: async (id) => libros.find((l) => l.id === id) || null,
    crear: async (datos) => {
      const libro = { id: siguienteId++, ...datos };
      libros.push(libro);
      return libro;
    },
    actualizar: async (id, datos) => {
      const i = libros.findIndex((l) => l.id === id);
      if (i === -1) return null;
      libros[i] = { id, ...datos };
      return libros[i];
    },
    eliminar: async (id) => {
      const antes = libros.length;
      libros = libros.filter((l) => l.id !== id);
      return libros.length < antes;
    },
  };
}

describe('API de libros', () => {
  let app;

  beforeEach(() => {
    app = createApp(crearRepoFalso());
  });

  test('GET /health responde 200 y status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /libros devuelve la lista de libros', async () => {
    const res = await request(app).get('/libros');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  test('POST /libros crea un libro válido y responde 201', async () => {
    const nuevo = { titulo: 'Rayuela', autor: 'Julio Cortázar', anio_publicacion: 1963 };
    const res = await request(app).post('/libros').send(nuevo);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(nuevo);
    expect(res.body.id).toBeDefined();
  });

  test('POST /libros rechaza datos inválidos con 400', async () => {
    const res = await request(app)
      .post('/libros')
      .send({ titulo: '', autor: '', anio_publicacion: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.errores.length).toBeGreaterThan(0);
  });

  test('GET /libros/:id responde 404 si el libro no existe', async () => {
    const res = await request(app).get('/libros/999');
    expect(res.status).toBe(404);
  });

  test('PUT /libros/:id responde 404 si el libro no existe', async () => {
    const res = await request(app)
      .put('/libros/999')
      .send({ titulo: 'X', autor: 'Y', anio_publicacion: 2000 });
    expect(res.status).toBe(404);
  });

  test('DELETE /libros/:id elimina un libro existente', async () => {
    const res = await request(app).delete('/libros/1');
    expect(res.status).toBe(200);
    const res2 = await request(app).get('/libros/1');
    expect(res2.status).toBe(404);
  });
});
