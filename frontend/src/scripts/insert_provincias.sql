-- Vaciar la tabla provincias
DELETE FROM provincia;

-- Resetear el autoincremento (opcional)
ALTER TABLE provincia AUTO_INCREMENT = 1;

-- Insertar todas las provincias de España
INSERT INTO provincia (nombre) VALUES
('Álava'), ('Albacete'), ('Alicante'), ('Almería'), ('Asturias'),
('Ávila'), ('Badajoz'), ('Barcelona'), ('Burgos'), ('Cáceres'),
('Cádiz'), ('Cantabria'), ('Castellón'), ('Ciudad Real'), ('Córdoba'),
('La Coruña'), ('Cuenca'), ('Gerona'), ('Granada'), ('Guadalajara'),
('Guipúzcoa'), ('Huelva'), ('Huesca'), ('Islas Baleares'), ('Jaén'),
('León'), ('Lérida'), ('Lugo'), ('Madrid'), ('Málaga'),
('Murcia'), ('Navarra'), ('Orense'), ('Palencia'), ('Las Palmas'),
('Pontevedra'), ('La Rioja'), ('Salamanca'), ('Santa Cruz de Tenerife'), ('Segovia'),
('Sevilla'), ('Soria'), ('Tarragona'), ('Teruel'), ('Toledo'),
('Valencia'), ('Valladolid'), ('Vizcaya'), ('Zamora'), ('Zaragoza'), ('Ceuta'), ('Melilla');
