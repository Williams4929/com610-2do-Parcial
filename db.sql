-- Base de datos y tabla para la API de libros (ejecutar en RDS desde EC2)
CREATE DATABASE IF NOT EXISTS db_libros
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE db_libros;

CREATE TABLE IF NOT EXISTS libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150) NOT NULL,
  anio_publicacion INT NOT NULL
);

-- Datos iniciales de ejemplo (ejecutar una sola vez)
INSERT INTO libros (titulo, autor, anio_publicacion) VALUES
  ('Cien años de soledad', 'Gabriel García Márquez', 1967),
  ('Raza de bronce', 'Alcides Arguedas', 1919),
  ('Clean Code', 'Robert C. Martin', 2008);
