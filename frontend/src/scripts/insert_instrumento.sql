
DELETE FROM instrumentos;

ALTER TABLE instrumentos AUTO_INCREMENT = 1;

INSERT INTO instrumentos (nombre)  VALUES 
('Clarinete'), ('Saxofón'), ('Flauta'), ('Oboe'),
('Trompa'), ('Trombón'), ('Trompeta'), ('Tuba'),
('Bombardino'),('Percusión');