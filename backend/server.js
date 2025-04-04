require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(cors({
    origin: 'https://victorious-stone-011abec10.6.azurestaticapps.net',
    credentials: true
  }));
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 
  });

  

// Configurar conexión a MySQL
const db = mysql.createPool({
    host: "easymusicserver.mysql.database.azure.com",
    user: "ismaponce7",
    password: "easymusic_7", 
    database: "easymusic",
    port: 3306,                                  
    ssl: {
        rejectUnauthorized: true 
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});



async function testDB() {
    try {
        const [rows] = await db.query("SELECT 1");
        console.log("Conexión a la base de datos exitosa",);
    } catch (error) {
        console.error("Error en la conexión a la base de datos:", error);
    }
}

testDB();

app.post("/register", async (req, res) => {
    const { nombre, email, password, confirmPassword, telefono, rol, idProvincia, idInstrumento, nivelMusical, coche, fundacion } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await db.getConnection(); // Obtener una conexión del pool

        await connection.beginTransaction();

        // Insertar usuario
        const sqlUsuario = "INSERT INTO usuarios (email, password, nombre, rol, telefono, idProvincia) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await connection.query(sqlUsuario, [email, hashedPassword, nombre, rol, telefono, idProvincia]);

        const userId = result.insertId;

        // Insertar en clientes, musicos o charangas
        if(rol === "cliente") {
            const sql2 = "INSERT INTO clientes (idCliente) VALUES (?)";
            await connection.query(sql2, [userId]);
        }else if(rol === "musico") {
            const sql2 = "INSERT INTO musicos (idMusico, idInstrumento, nivelMusical, coche) VALUES (?, ?, ?, ?)";
            await connection.query(sql2, [userId, idInstrumento, nivelMusical, coche]);
        }
        else{

            const sql2 = "INSERT INTO charangas (idCharanga, fundacion) VALUES (?, ?)";
            await connection.query(sql2, [userId, fundacion]);
        }

        

        await connection.commit();
        connection.release(); // Liberar conexión
        let user = {};
        let foto = '';
        let valoracionMedia = 0.0;
        let biografia = '';

        if(rol === "musico") {
            user = { idUsuario: userId, nombre, email, telefono, rol, idProvincia, foto, valoracionMedia, biografia, 
                idMusico: userId, idInstrumento, nivelMusical, coche};
        }else if(rol === "charanga") {
            user = { idUsuario: userId, nombre, email, telefono, rol, idProvincia, foto, valoracionMedia, biografia,
                idCharanga: userId, fundacion };
        }else{
            user = { idUsuario: userId, nombre, email, telefono, rol, idProvincia, foto, valoracionMedia, biografia, idCliente: userId };
        }

        const token = jwt.sign({ id: userId }, "secretkey", { expiresIn: "1h" });

        res.json({
            message: "Usuario registrado con éxito",
            token,
            user,
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error en el registro del usuario" });
    }
});

// Inicio de sesión
//
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ?";

    try {
        // Ejecutar la consulta con await
        const [results] = await db.query(sql, [email]);

        if (results.length === 0) {
            return res.status(400).json({ error: "Usuario no encontrado" });
        }

        const usuario = results[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        //buscar datos del usuario en la tabla correspondiente
        let user = {};
        if(usuario.rol === "musico"){
            const sql2 = "SELECT * FROM musicos WHERE idMusico = ?";
            const [results2] = await db.query(sql2, [usuario.idUsuario]);
            user = {idUsuario: usuario.idUsuario, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono, 
                rol: usuario.rol, idProvincia: usuario.idProvincia, foto: usuario.foto, biografia: usuario.biografia, 
                valoracionMedia: usuario.valoracionMedia, idMusico: results2[0].idMusico, 
                idInstrumento: results2[0].idInstrumento, 
                nivelMusical: results2[0].nivelMusical, coche: results2[0].coche};
        }
        else if(usuario.rol === "cliente"){
            const sql2 = "SELECT * FROM clientes WHERE idCliente = ?";
            const [results2] = await db.query(sql2, [usuario.idUsuario]);
            user = {idUsuario: usuario.idUsuario, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono, 
                rol: usuario.rol, foto: usuario.foto, biografia: usuario.biografia, 
                valoracionMedia: usuario.valoracionMedia, idProvincia: usuario.idProvincia, idCliente: results2[0].idCliente};
        }
        else if(usuario.rol === "charanga"){
            const sql2 = "SELECT * FROM charangas WHERE idCharanga = ?";
            const [results2] = await db.query(sql2, [usuario.idUsuario]);
            user = {idUsuario: usuario.idUsuario, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono,
                rol: usuario.rol, idProvincia: usuario.idProvincia, foto: usuario.foto, biografia: usuario.biografia, 
                valoracionMedia: usuario.valoracionMedia, idCharanga: results2[0].idCharanga,
                fundacion: results2[0].fundacion};
        }


        // Generar token JWT
        const token = jwt.sign({ id: user.idUsuario }, "secretkey", { expiresIn: "1h" });
        res.json({ message: "Inicio de sesión exitoso", token, user });

    } catch (error) {
        console.error("Error al iniciar sesion con el usuario:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.get('/provincias', async (req, res) => {
    console.log("Peticion a:", req.originalUrl);
    try {
        const [rows] = await db.query("SELECT idProvincia, nombre FROM provincia");
        res.json(rows);  // Enviar el ID y el nombre de cada provincia
    } catch (error) {
        console.error("Error al obtener provincias:", error);
        res.status(500).json({ error: "Error al obtener provincias" });
    }
});

app.get("/instrumentos", async (req, res) => {
    console.log("Peticion a:", req.url);
    try {
        const [rows] = await db.query("SELECT idInstrumento, nombre FROM instrumentos");
        res.json(rows);  // Enviar el ID y el nombre de cada instrumento
    } catch (error) {
        console.error("Error al obtener instrumentos:", error);
        res.status(500).json({ error: "Error al obtener instrumentos" });
    }
});

app.post('/perfil', upload.single('foto'), async (req, res) => {
    console.log('⚡ Petición recibida en /perfil');
  
    const userId = req.headers['user-id'];
    console.log('🆔 ID del usuario:', userId);
  
    if (!userId) {
      console.log('❌ Error: Falta el ID de usuario');
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }
  
    const { nombre, telefono, biografia, password } = req.body;
    const foto = req.file ? req.file.buffer : null;
  
    console.log('📩 Datos recibidos:', { nombre, telefono, biografia, password, foto: foto ? 'Foto recibida' : 'Sin foto' });
  
    let sql = 'UPDATE usuarios SET nombre=?, telefono=?, biografia=?';
    let params = [nombre, telefono, biografia];
  
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        sql += ', password=?';
        params.push(hashedPassword);
    }
    if (foto) {
      const compressedImage = await sharp(foto)
        .resize(500, 500, { fit: 'inside' }) // Redimensiona la imagen sin deformarla
        .jpeg({ quality: 80 }) // Reduce la calidad al 80%
        .toBuffer(); 
      
      sql += ', foto=?';
      params.push(compressedImage);
    }
    sql += ' WHERE idUsuario=?';
    params.push(userId);
  
    console.log('🛠 Query:', sql);
    console.log('📌 Parámetros:', params);
  
    const connection = await db.getConnection(); // Obtener una conexión del pool
  
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(sql, params); // ✅ Usar execute en lugar de query
      await connection.commit();
      console.log('✅ Usuario actualizado correctamente');
  
      res.json({ success: true, message: 'Perfil actualizado correctamente' });
    } catch (err) {
      console.error('🚨 Error en MySQL:', err);
      await connection.rollback();
      res.status(500).json({ error: 'Error en el servidor' });
    } finally {
      connection.release(); // Liberar conexión en cualquier caso
    }
  });
  
  // Ruta para obtener la foto del usuario autenticado
  app.get('/fotoperfil', async (req, res) => {
    const userId = req.headers['user-id'];

    if (!userId) {
        return res.status(400).json({ message: 'ID de usuario no proporcionado' });
    }

    try {
        const [rows] = await db.query('SELECT foto FROM usuarios WHERE idUsuario = ?', [userId]);

        if (rows.length === 0 || !rows[0].foto) {
            return res.status(404).send('Imagen no encontrada');
        }

        // Convertir BLOB a Base64
        const fotoBase64 = Buffer.from(rows[0].foto).toString('base64');
        res.json({ foto: fotoBase64 });
    } catch (error) {
        console.error('Error al obtener la foto:', error);
        res.status(500).json({ message: 'Error al obtener la foto' });
    }
});

app.get("/charangas", async (req, res) => {
    let{ idProvincia } = req.query;

    let sql = `
        SELECT u.idUsuario, u.nombre, u.email, u.telefono, u.foto, u.biografia, 
               p.nombre AS provincia, c.fundacion
        FROM usuarios u
        JOIN charangas c ON u.idUsuario = c.idCharanga
        JOIN provincia p ON u.idProvincia = p.idProvincia
    `;

    let params = [];
    if (idProvincia) {
        sql += " WHERE u.idProvincia = ?";
        params.push(idProvincia);
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener charangas:", error);
        res.status(500).json({ error: "Error al obtener charangas" });
    }
});

app.get("/anuncios_charangas", async (req, res) => {
    let { idProvincia, fechaInicio, fechaFin} = req.query;

    if (!fechaInicio) {
        fechaInicio = new Date().toISOString().split('T')[0];  // Asigna hoy por defecto
    }

    let sql = `
        SELECT a.idAnuncio, a.titulo, a.descripcion, a.fechaInicio, a.fechaFin,
               u.idUsuario, u.nombre, u.foto AS foto, 
               p.nombre AS provincia
        FROM anuncios a
        JOIN anuncios_charangas ac ON a.idAnuncio = ac.idAnuncio
        JOIN usuarios u ON ac.idUsuario = u.idUsuario
        JOIN provincia p ON a.idProvincia = p.idProvincia
        JOIN charangas c ON u.idUsuario = c.idCharanga
    `;

    let params = [];
    let conditions = [];

    if (idProvincia) {
        conditions.push("a.idProvincia = ?");
        params.push(idProvincia);
    }

    if (fechaInicio) {
        conditions.push("a.fechaInicio >= ?");
        params.push(fechaInicio);
    }
    if (fechaFin) {
        conditions.push("a.fechaFin <= ?");
        params.push(fechaFin);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows); 
    } catch (error) {
        console.error("Error al obtener anuncios:", error);
        res.status(500).json({ error: "Error al obtener anuncios" });
    }
}
);

app.get("/anuncios_musicos", async (req, res) => {
    let { idProvincia, idInstrumento, fechaInicio, fechaFin} = req.query;

    if (!fechaInicio) {
        fechaInicio = new Date().toISOString().split('T')[0];  // Asigna hoy por defecto
    }

    let sql = `
        SELECT a.idAnuncio, a.titulo, a.descripcion, a.fechaInicio, a.fechaFin,
               u.idUsuario, u.nombre, u.foto AS foto, 
               p.nombre AS provincia, m.idInstrumento
        FROM anuncios a
        JOIN anuncios_musicos am ON a.idAnuncio = am.idAnuncio
        JOIN usuarios u ON am.idUsuario = u.idUsuario
        JOIN provincia p ON a.idProvincia = p.idProvincia
        JOIN musicos m ON u.idUsuario = m.idMusico
    `;

    let params = [];
    let conditions = [];

    if (idProvincia) {
        conditions.push("a.idProvincia = ?");
        params.push(idProvincia);
    }

    if (idInstrumento) {
        conditions.push("m.idInstrumento = ?");
        params.push(idInstrumento);
    }
    if (fechaInicio) {
        conditions.push("a.fechaInicio >= ?");
        params.push(fechaInicio);
    }
    if (fechaFin) {
        conditions.push("a.fechaFin <= ?");
        params.push(fechaFin);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows); 
    } catch (error) {
        console.error("Error al obtener anuncios:", error);
        res.status(500).json({ error: "Error al obtener anuncios" });
    }
});


app.post("/crear_anuncio_musico", async (req, res) => {
    const { idUsuario, titulo, descripcion, fechaInicio, fechaFin, idProvincia } = req.body;

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool

        await connection.beginTransaction();

        // Insertar anuncio
        const sqlAnuncio = "INSERT INTO anuncios (titulo, descripcion, fechaInicio, fechaFin, idProvincia) VALUES (?, ?, ?, ?, ?)";
        const [result] = await connection.query(sqlAnuncio, [titulo, descripcion, fechaInicio, fechaFin, idProvincia]);

        const idAnuncio = result.insertId;

        // Insertar en anuncios_musicos
        const sql2 = "INSERT INTO anuncios_musicos (idAnuncio, idUsuario) VALUES (?, ?)";
        await connection.query(sql2, [idAnuncio, idUsuario]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Anuncio creado con éxito", idAnuncio });
    } catch (error) {
        console.error("Error al crear anuncio:", error);
        res.status(500).json({ error: "Error al crear anuncio" });
    }
}
);

app.post("/crear_anuncio_charanga", async (req, res) => {
    const { idUsuario, titulo, descripcion, fechaInicio, fechaFin, idProvincia } = req.body;

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool

        await connection.beginTransaction();

        // Insertar anuncio
        const sqlAnuncio = "INSERT INTO anuncios (titulo, descripcion, fechaInicio, fechaFin, idProvincia) VALUES (?, ?, ?, ?, ?)";
        const [result] = await connection.query(sqlAnuncio, [titulo, descripcion, fechaInicio, fechaFin, idProvincia]);

        const idAnuncio = result.insertId;

        // Insertar en anuncios_charangas
        const sql2 = "INSERT INTO anuncios_charangas (idAnuncio, idUsuario) VALUES (?, ?)";
        await connection.query(sql2, [idAnuncio, idUsuario]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Anuncio creado con éxito", idAnuncio });
    } catch (error) {
        console.error("Error al crear anuncio:", error);
        res.status(500).json({ error: "Error al crear anuncio" });
    }
}
);




// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

