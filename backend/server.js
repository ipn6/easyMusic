require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { send } = require("process");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '10mb' }));
app.use(cors());

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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ipn6@gcloud.ua.es',         // Tu correo
      pass: 'xdka tham sbdw clif'        // Tu contraseña o App Password (más seguro)
    }
  });

async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: 'ipn6@gcloud.ua.es',
        to: to,
        subject: subject,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center;">
            <h2 style="color:rgb(0, 221, 255);">🎶 EasyMusic 🎺</h2>
          </div>
          <hr style="border: none; border-top: 2px solid rgb(0, 221, 255); margin: 20px 0;">
          <div style="font-size: 16px; color: #333;">
            <p>${text}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <div style="text-align: center; font-size: 12px; color: #777;">
            <p>Este correo fue enviado automáticamente desde EasyMusic.</p>
            <p>http://victorious-stone-011abec10.6.azurestaticapps.net</p>
          </div>
        </div>
         `
      
    };

    try{
        await transporter.sendMail(mailOptions);
    }catch(error){
        console.error('Error al enviar el email:', error);
    }
}

app.post("/register", upload.single("foto"), async (req, res) => {
    let { nombre, email, password, confirmPassword, biografia, telefono, rol, idProvincia, idInstrumento, nivelMusical, coche, fundacion } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }
    let valoracionMedia = 0.0;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await db.getConnection(); // Obtener una conexión del pool
        let foto = req.file ? req.file.buffer : null;
        console.log("Foto recibida:", req.file);
        await connection.beginTransaction();

        // Insertar usuario
        const sqlUsuario = "INSERT INTO usuarios (email, password, nombre, rol, telefono, idProvincia, foto, biografia, valoracionMedia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await connection.query(sqlUsuario, [email, hashedPassword, nombre, rol, telefono, idProvincia, foto, biografia, valoracionMedia]);

        const userId = result.insertId;

        if(coche === "false"){
            coche2 = 0;
        }else{
            coche2 = 1;
        }

        //convierte idProvincia y idInstrumento de String a Int
        idProvincia = parseInt(idProvincia, 10);
        idInstrumento = parseInt(idInstrumento, 10);

        // Insertar en clientes, musicos o charangas
        if(rol === "cliente") {
            const sql2 = "INSERT INTO clientes (idCliente) VALUES (?)";
            await connection.query(sql2, [userId]);
        }else if(rol === "musico") {
            const sql2 = "INSERT INTO musicos (idMusico, idInstrumento, nivelMusical, coche) VALUES (?, ?, ?, ?)";
            await connection.query(sql2, [userId, idInstrumento, nivelMusical, coche2]);
        }
        else{

            const sql2 = "INSERT INTO charangas (idCharanga, fundacion) VALUES (?, ?)";
            await connection.query(sql2, [userId, fundacion]);
        }

        

        await connection.commit();
        connection.release(); // Liberar conexión
        let user = {};
        
        if(foto){
            foto = foto.toString('base64');
        }

        if(rol === "musico") {
            user = { idUsuario: userId, nombre, email, telefono, rol, idProvincia, valoracionMedia, biografia, 
                idMusico: userId, idInstrumento, nivelMusical, coche};
        }else if(rol === "charanga") {
            user = { idUsuario: userId, nombre, email, telefono, rol, idProvincia, valoracionMedia, biografia,
                idCharanga: userId, fundacion };
        }else{
            user = { idUsuario: userId, nombre, email, telefono, rol, idProvincia, valoracionMedia, biografia, idCliente: userId };
        }
        
        
        await sendEmail(email, "Bienvenido a EasyMusic", "Hola " + user.nombre + ", bienvenido a EasyMusic. Te has registrado con éxito en nuestra web.");

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
                rol: usuario.rol, idProvincia: usuario.idProvincia, biografia: usuario.biografia, 
                valoracionMedia: usuario.valoracionMedia, idMusico: results2[0].idMusico, 
                idInstrumento: results2[0].idInstrumento, 
                nivelMusical: results2[0].nivelMusical, coche: results2[0].coche};
        }
        else if(usuario.rol === "cliente"){
            const sql2 = "SELECT * FROM clientes WHERE idCliente = ?";
            const [results2] = await db.query(sql2, [usuario.idUsuario]);
            user = {idUsuario: usuario.idUsuario, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono, 
                rol: usuario.rol, biografia: usuario.biografia, 
                valoracionMedia: usuario.valoracionMedia, idProvincia: usuario.idProvincia, idCliente: results2[0].idCliente};
        }
        else if(usuario.rol === "charanga"){
            const sql2 = "SELECT * FROM charangas WHERE idCharanga = ?";
            const [results2] = await db.query(sql2, [usuario.idUsuario]);
            user = {idUsuario: usuario.idUsuario, nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono,
                rol: usuario.rol, idProvincia: usuario.idProvincia, biografia: usuario.biografia, 
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
    try {
        const [rows] = await db.query("SELECT idProvincia, nombre FROM provincia");
        res.json(rows);  // Enviar el ID y el nombre de cada provincia
    } catch (error) {
        console.error("Error al obtener provincias:", error);
        res.status(500).json({ error: "Error al obtener provincias" });
    }
});

app.get("/instrumentos", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT idInstrumento, nombre FROM instrumentos");
        res.json(rows);  // Enviar el ID y el nombre de cada instrumento
    } catch (error) {
        console.error("Error al obtener instrumentos:", error);
        res.status(500).json({ error: "Error al obtener instrumentos" });
    }
});

app.get("/usuario/:id/foto", async (req, res) => {
    const userId = req.params.id;
  
    try {
      const [rows] = await db.query("SELECT foto FROM usuarios WHERE idUsuario = ?", [userId]);
  
      if (rows.length === 0 || !rows[0].foto) {
        return res.status(404).send("Foto no encontrada");
      }
  
      const foto = rows[0].foto;
      res.setHeader("Content-Type", "image/jpeg"); // o image/png si corresponde
      res.send(foto);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al obtener la imagen");
    }
  });

app.post('/perfil', upload.single('foto'), async (req, res) => {
  
    const userId = req.headers['user-id'];

  
    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }
  
    const { nombre, telefono, biografia, password } = req.body;
    const foto = req.file ? req.file.buffer : null;
  
  
    let sql = 'UPDATE usuarios SET nombre=?, telefono=?, biografia=?';
    let params = [nombre, telefono, biografia];
  
    if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        sql += ', password=?';
        params.push(hashedPassword);
    }
    if (foto) {
      sql += ', foto=?';
      params.push(foto);
    }
    sql += ' WHERE idUsuario=?';
    params.push(userId);
  
  
    const connection = await db.getConnection(); // Obtener una conexión del pool
  
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(sql, params); 
      await connection.commit();
  
      res.json({ success: true, message: 'Perfil actualizado correctamente' });
    } catch (err) {
      console.error('Error en MySQL:', err);
      await connection.rollback();
      res.status(500).json({ error: 'Error en el servidor' });
    } finally {
      connection.release(); // Liberar conexión en cualquier caso
    }
  });
  


app.get("/charangas", async (req, res) => {
    let{ idProvincia } = req.query;

    let sql = `
        SELECT u.idUsuario, u.nombre, u.email, u.telefono, u.foto, u.biografia, u.valoracionMedia, 
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
        fechaInicio = new Date().toISOString().split('T')[0];
    }

    let sql = `
        SELECT a.idAnuncio, a.titulo, a.descripcion, a.fechaInicio, a.fechaFin,
               u.idUsuario, u.nombre, u.valoracionMedia, 
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
               u.idUsuario, u.nombre, u.valoracionMedia,
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

app.get("/ofertas", async (req, res) => {
    let { idProvincia, fechaInicio, fechaFin, tipo} = req.query;

    if (!fechaInicio) {
        fechaInicio = new Date().toISOString().split('T')[0];  // Asigna hoy por defecto
    }

    let sql = `
        SELECT o.idOferta, o.titulo, o.direccion, o.tipo, o.descripcion, 
        o.fechaInicio, o.fechaFin, o.contratada, o.valoracionCliente, o.valoracionCharanga,
               u.idUsuario, u.nombre, u.email, u.valoracionMedia, u.telefono, 
               p.nombre AS provincia
        FROM ofertas o
        JOIN usuarios u ON o.idCliente = u.idUsuario
        JOIN provincia p ON o.idProvincia = p.idProvincia
    `;

    let params = [];
    let conditions = [];

    if (idProvincia) {
        conditions.push("o.idProvincia = ?");
        params.push(idProvincia);
    }

    if (fechaInicio) {
        conditions.push("o.fechaInicio >= ?");
        params.push(fechaInicio);
    }
    if (fechaFin) {
        conditions.push("o.fechaFin <= ?");
        params.push(fechaFin);
    }
    if (tipo) {
        conditions.push("o.tipo = ?");
        params.push(tipo);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows); 
    } catch (error) {
        console.error("Error al obtener ofertas:", error);
        res.status(500).json({ error: "Error al obtener ofertas" });
    }
}
);

app.post("/crear_oferta", async (req, res) => {
    const { idCliente, titulo, direccion, tipo, descripcion, fechaInicio, fechaFin, idProvincia } = req.body;

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool

        await connection.beginTransaction();

        // Insertar oferta
        const sqlAnuncio = "INSERT INTO ofertas (idCliente, titulo, direccion, tipo, descripcion, fechaInicio, fechaFin, idProvincia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await connection.query(sqlAnuncio, [idCliente, titulo, direccion, tipo, descripcion, fechaInicio, fechaFin, idProvincia]);

        const idOferta = result.insertId;

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Oferta creado con éxito", idOferta });
    } catch (error) {
        console.error("Error al crear oferta:", error);
        res.status(500).json({ error: "Error al crear oferta" });
    }
}
);

app.post('/crear_solicitud', async (req, res) => {
    const { idOferta, idCharanga } = req.body;
    
    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        const sql = "INSERT INTO solicitudes (idOferta, idCharanga) VALUES (?, ?)";
        const [result] = await connection.query(sql, [idOferta, idCharanga]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Solicitud creada con éxito", idSolicitud: result.insertId });
    } catch (error) {
        console.error("Error al crear solicitud:", error);
        res.status(500).json({ error: "Error al crear solicitud" });
    }
});

app.get("/solicitudes", async (req, res) => {
    const idOferta = req.query.idOferta;


    
        const sql = `
            SELECT s.id, s.idOferta, s.idCharanga, s.estado, u.nombre, u.valoracionMedia, u.email, u.telefono,
            p.nombre AS provincia
            FROM solicitudes s
            JOIN charangas c ON s.idCharanga = c.idCharanga
            JOIN usuarios u ON c.idCharanga = u.idUsuario
            JOIN provincia p ON u.idProvincia = p.idProvincia
            WHERE s.idOferta = ?
        `;
    
        try {
            const [rows] = await db.query(sql, [idOferta]);
            res.json(rows);
        }catch (error) {
            console.error("Error al obtener solicitudes:", error);
            res.status(500).json({ error: "Error al obtener solicitudes" });
        }
    }
);

app.get("/solicitudes_user", async (req, res) => {
    const idCharanga = req.query.idCharanga;

    
        try {
            const [rows] = await db.query("SELECT id, idOferta, estado FROM solicitudes WHERE idCharanga = ?", [idCharanga]);
            res.json(rows);

        }catch (error) {
            console.error("Error al obtener solicitudes:", error);
            res.status(500).json({ error: "Error al obtener solicitudes" });
        }
    }
);

app.post("/aceptar_solicitud", async (req, res) => {
    const { idOferta, idCharanga} = req.body;

    const sql = 'UPDATE ofertas set idCharanga = ?, contratada = 1 WHERE idOferta = ?';
    const sql2 = 'UPDATE solicitudes SET estado = ? WHERE idOferta = ? AND idCharanga = ?';
    const estado = "Aceptada";

    //Rechaza las demas solicitudes de esa oferta
    const sql3 = 'UPDATE solicitudes SET estado = ? WHERE idOferta = ? AND idCharanga != ?';
    const estado2 = "Rechazada";

    const tituloOferta = 'SELECT titulo FROM ofertas WHERE idOferta = ?';
    const emailCharanga = 'SELECT email FROM usuarios WHERE idUsuario = ?';


    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar oferta
        await connection.query(sql, [idCharanga, idOferta]);

        // Actualizar solicitud
        await connection.query(sql2, [estado, idOferta, idCharanga]);

        // Rechazar otras solicitudes
        await connection.query(sql3, [estado2, idOferta, idCharanga]);

        // Obtener el título de la oferta
        const [rows] = await connection.query(tituloOferta, [idOferta]);
        const oferta = rows[0].titulo;

        // Obtener el email de la charanga
        const [rows2] = await connection.query(emailCharanga, [idCharanga]);
        const email = rows2[0].email;

        await connection.commit();
        connection.release(); // Liberar conexión

        // Enviar email a la charanga
        await sendEmail(email, "Solicitud aceptada", `¡Enhorabuena! Tu solicitud para la oferta "${oferta}" ha sido aceptada. 
            Inicia sesión para conocer los datos de contacto del cliente. 
            https://victorious-stone-011abec10.6.azurestaticapps.net`);

        res.json({ message: "Solicitud aceptada con éxito" });
    }
    catch (error) {
        console.error("Error al aceptar solicitud:", error);
        res.status(500).json({ error: "Error al aceptar solicitud" });
    }
}
);

app.post("/rechazar_solicitud", async (req, res) => {
    const { idOferta, idCharanga} = req.body;

    const sql = 'UPDATE solicitudes SET estado = ? WHERE idOferta = ? AND idCharanga = ?';
    const estado = "Rechazada";

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar oferta
        await connection.query(sql, [estado, idOferta, idCharanga]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Solicitud rechazada con éxito" });
    }
    catch (error) {
        console.error("Error al rechazar solicitud:", error);
        res.status(500).json({ error: "Error al rechazar solicitud" });
    }
}
);

app.post("/asignar_valoracion_charanga", async (req, res) => {
    const { idOferta, idCharanga, valoracion, tipoActo } = req.body;


    const sql = 'UPDATE ofertas SET valoracionCharanga = ? WHERE idOferta = ?';
    const sql2 = 'UPDATE solicitudes SET estado = ? WHERE idOferta = ? AND idCharanga = ?';
    const sql3 = 'INSERT INTO valoraciones (idUsuario, puntuacion, tipoActo) VALUES (?, ?, ?)';
    const estado = "Valorada";


    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar oferta
        await connection.query(sql, [valoracion, idOferta]);

        // Actualizar solicitud
        await connection.query(sql2, [estado, idOferta, idCharanga]);

        await connection.query(sql3, [idCharanga, valoracion, tipoActo]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Valoración asignada con éxito" });
    }
    catch (error) {
        console.error("Error al asignar valoración a charanga:", error);
        res.status(500).json({ error: "Error al asignar valoración a charanga" });
    }
}
);

app.post("/asignar_valoracion_cliente", async (req, res) => {
    const { idOferta,  idCharanga, idUsuario, valoracion} = req.body;


    const sql = 'UPDATE ofertas SET valoracionCliente = ? WHERE idOferta = ?';
    const sql2 = 'UPDATE solicitudes SET estado = ? WHERE idOferta = ? AND idCharanga = ?';
    const sql3 = 'INSERT INTO valoraciones (idUsuario, puntuacion) VALUES (?, ?)';
    const estado = "Finalizada";


    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar oferta
        await connection.query(sql, [valoracion, idOferta]);
        await connection.query(sql2, [estado, idOferta, idCharanga]);

        await connection.query(sql3, [idUsuario, valoracion]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Valoración asignada con éxito" });
    }
    catch (error) {
        console.error("Error al asignar valoración a cliente:", error);
        res.status(500).json({ error: "Error al asignar valoración a cliente" });
    }
}
);

app.post("/setValoracionMedia", async (req, res) => {
    const { idUsuario} = req.body;

    //Busca todas las valoraciones de ese usuario y saca la media
    //despues hace update de usuario.valoracionMedia con ese valor
    const sql = 'SELECT puntuacion FROM valoraciones WHERE idUsuario = ?';
    const sql2 = 'UPDATE usuarios SET valoracionMedia = ? WHERE idUsuario = ?';

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Obtener la media de valoraciones
        const [rows] = await connection.query(sql, [idUsuario]);

        const media = rows.reduce((acc, row) => acc + row.puntuacion, 0) / rows.length || 0;


        // Actualizar la valoración media del usuario
        await connection.query(sql2, [media, idUsuario]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Valoración media actualizada con éxito", media });
    }
    catch (error) {
        console.error("Error al actualizar valoración media:", error);
        res.status(500).json({ error: "Error al actualizar valoración media" });
    }

}
);

app.get("/valoracionMediaTipoActo", async (req, res) => {
    const { idUsuario, tipoActo } = req.query;
  
    const sql = 'SELECT puntuacion FROM valoraciones WHERE idUsuario = ? AND tipoActo = ?';
  
    try {
      const connection = await db.getConnection();
      const [rows] = await connection.query(sql, [idUsuario, tipoActo]);
  
      let media = 0.0;
      if (rows.length > 0) {
        media = rows.reduce((acc, row) => acc + row.puntuacion, 0) / rows.length;
      }
  
      connection.release();
      res.json({ message: "Valoración media de este tipo obtenida con éxito", media });
      
    } catch (error) {
      console.error("Error al obtener valoración:", error);
      res.status(500).json({ error: "Error al obtener valoración" });
    }
  });

  app.post("/crear_acto", async (req, res) => {
    const { idCharanga, titulo, tipo, descripcion, fechaInicio, fechaFin, idProvincia, musicos} = req.body;
    


    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool

        await connection.beginTransaction();

        const numMusicos = musicos.length;

        // Insertar acto
        const sqlActo = "INSERT INTO actos (idCharanga, idProvincia, tipo, fechaInicio, fechaFin, titulo, descripcion, musicosBuscados) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
    

        const [result] = await connection.query(sqlActo, [idCharanga, idProvincia, tipo, fechaInicio, fechaFin, titulo, descripcion, numMusicos]);

        const idActo = result.insertId;

        

        for (const musico of musicos) {
            const sqlMusicos = "INSERT INTO acto_instrumentos (idActo, idInstrumento, cantidad) VALUES (?, ?, ?)";
            await connection.query(sqlMusicos, [idActo, musico.idInstrumento, musico.cantidad]);
        }

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Acto creado con éxito", idActo });
    } catch (error) {
        console.error("Error al crear acto:", error);
        res.status(500).json({ error: "Error al crear acto" });
    }
});

app.get("/actos", async (req, res) => {
    let { idProvincia, fechaInicio, fechaFin, idInstrumento, tipo} = req.query;

    if (!fechaInicio) {
        fechaInicio = new Date().toISOString().split('T')[0];  // Asigna hoy por defecto
    }

    let sql = `
        SELECT a.idActo, a.idCharanga, a.titulo, a.descripcion, a.fechaInicio, a.fechaFin, a.tipo, a.musicosBuscados,
               u.idUsuario, u.nombre, u.valoracionMedia,
               p.nombre AS provincia,
               i.nombre AS instrumento,
               ai.idInstrumento, ai.cantidad,
               mc.idMusico AS musicoContratado, mc.valoracionCharanga, mc.valoracionMusico
        FROM actos a
        LEFT JOIN acto_instrumentos ai ON a.idActo = ai.idActo
        LEFT JOIN instrumentos i ON ai.idInstrumento = i.idInstrumento
        JOIN usuarios u ON a.idCharanga = u.idUsuario
        JOIN provincia p ON a.idProvincia = p.idProvincia
        LEFT JOIN musicos_contratados mc ON a.idActo = mc.idActo
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
    if (tipo) {
        conditions.push("a.tipo = ?");
        params.push(tipo);
    }
    if (idInstrumento){
        conditions.push("ai.idInstrumento = ?");
        params.push(idInstrumento);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    try {
        const [rows] = await db.query(sql, params);
        const actosMap = new Map();
        
        rows.forEach(row => {
            if (!actosMap.has(row.idActo)) {
                actosMap.set(row.idActo, {
                    idActo: row.idActo,
                    idCharanga: row.idCharanga,
                    titulo: row.titulo,
                    descripcion: row.descripcion,
                    fechaInicio: row.fechaInicio,
                    fechaFin: row.fechaFin,
                    tipo: row.tipo,
                    idUsuario: row.idUsuario,
                    nombre: row.nombre,
                    valoracionMedia: row.valoracionMedia,
                    provincia: row.provincia,
                    musicosBuscados: row.musicosBuscados,
                    musicosContratados: [],
                    musicos: []
                });
            }
            
            //musicos buscados en el acto
            const musicosSet = new Set(actosMap.get(row.idActo).musicos.map(m => JSON.stringify(m)));
            const musicoData = {
                idInstrumento: row.idInstrumento,
                instrumento: row.instrumento,
                cantidad: row.cantidad
            };
            if (!musicosSet.has(JSON.stringify(musicoData))) {
                actosMap.get(row.idActo).musicos.push(musicoData);
            }

            //musicos contratados en el acto
            
            if (row.musicoContratado) {
                const musicosContratadosSet = new Set(actosMap.get(row.idActo).musicosContratados.map(m => m.idMusico));
                if (!musicosContratadosSet.has(row.musicoContratado)) {
                    actosMap.get(row.idActo).musicosContratados.push({
                        idMusico: row.musicoContratado,
                        valoracionCharanga: row.valoracionCharanga,
                        valoracionMusico: row.valoracionMusico
                    });
                }
            }
        });

        const actos = Array.from(actosMap.values());
        res.json(actos); 
    } catch (error) {
        console.error("Error al obtener actos:", error);
        res.status(500).json({ error: "Error al obtener actos" });
    }
}
);

app.post('/crear_solicitud_musico', async (req, res) => {
    const { idActo, idMusico } = req.body;

    const datosActo = 'SELECT titulo, idCharanga FROM actos WHERE idActo = ?';
    const emailCharanga = 'SELECT email FROM usuarios WHERE idUsuario = ?';
    
    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        const sql = "INSERT INTO solicitudes_musicos (idActo, idMusico) VALUES (?, ?)";
        const [result] = await connection.query(sql, [idActo, idMusico]);

        // Obtener el título e idCharanga de la oferta
        const [rows] = await connection.query(datosActo, [idActo]);
        const acto = rows[0].titulo;
        const idCharanga = rows[0].idCharanga;
        
        // Obtener el email de la charanga
        const [rows3] = await connection.query(emailCharanga, [idCharanga]);
        const email = rows3[0].email;

        await connection.commit();
        connection.release(); // Liberar conexión

        // Enviar email a la charanga
        await sendEmail(email, "Solicitud recibida", `Has recibido una solicitud para participar en el acto "${acto}". 
                    Inicia sesión para conocer los datos de contacto del músico. 
                    https://victorious-stone-011abec10.6.azurestaticapps.net`);

        res.json({ message: "Solicitud creada con éxito", idSolicitud: result.insertId });
    } catch (error) {
        console.error("Error al crear solicitud:", error);
        res.status(500).json({ error: "Error al crear solicitud" });
    }
});

app.get("/solicitudes_musico", async (req, res) => {
    const idMusico = req.query.idMusico;

    
        try {
            const [rows] = await db.query("SELECT id, idActo, estado FROM solicitudes_musicos WHERE idMusico = ?", [idMusico]);
            res.json(rows);

        }catch (error) {
            console.error("Error al obtener solicitudes:", error);
            res.status(500).json({ error: "Error al obtener solicitudes" });
        }
    }
);

app.get("/solicitudes_acto", async (req, res) => {
    const idActo = req.query.idActo;


    
        const sql = `
            SELECT s.id, s.idActo, s.idMusico, s.estado, u.nombre, u.valoracionMedia, m.idInstrumento, m.nivelMusical, m.coche,
            p.nombre AS provincia
            FROM solicitudes_musicos s
            JOIN musicos m ON s.idMusico = m.idMusico
            JOIN usuarios u ON m.idMusico = u.idUsuario
            JOIN provincia p ON u.idProvincia = p.idProvincia
            WHERE s.idActo = ?
        `;
    
        try {
            const [rows] = await db.query(sql, [idActo]);
            res.json(rows);
        }catch (error) {
            console.error("Error al obtener solicitudes:", error);
            res.status(500).json({ error: "Error al obtener solicitudes" });
        }
    }
);

app.post("/aceptar_solicitud_musico", async (req, res) => {
    const { idActo, idMusico, idInstrumento} = req.body;



    const sql0 = 'UPDATE acto_instrumentos SET cantidad = cantidad - 1 WHERE idActo = ? AND idInstrumento = ?';

    const sql1 = 'DELETE FROM acto_instrumentos WHERE idActo = ? AND idInstrumento = ? AND cantidad = 0';

    const sql2 = 'UPDATE solicitudes_musicos SET estado = ? WHERE idActo = ? AND idMusico = ?';

    const sql3 = 'UPDATE actos SET musicosBuscados = musicosBuscados - 1 WHERE idActo = ?';

    const sql4 = 'INSERT into musicos_contratados (idActo, idMusico) VALUES (?, ?)';
    
    const estado = "Aceptada";

    const tituloActo = 'SELECT titulo FROM actos WHERE idActo = ?';
    const emailMusico = 'SELECT email FROM usuarios WHERE idUsuario = ?';

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        //busca acto_instrumentos con idActo e idInstrumento iguales y resta 1 a cantidad, si cantidad es = 0 borra esa fila

        // Actualizar cantidad en acto_instrumentos
        await connection.query(sql0, [idActo, idInstrumento]);

        // Eliminar fila si cantidad es igual a 1
        await connection.query(sql1, [idActo, idInstrumento]);

        // Actualizar solicitud
        await connection.query(sql2, [estado, idActo, idMusico]);

        //le resta 1 a musicosBuscados
        await connection.query(sql3, [idActo]);

        //inserta en musicos_contratados
        await connection.query(sql4, [idActo, idMusico]);

        // Obtener el título de la oferta
        const [rows] = await connection.query(tituloActo, [idActo]);
        const acto = rows[0].titulo;
        
        // Obtener el email del musico
        const [rows2] = await connection.query(emailMusico, [idMusico]);
        const email = rows2[0].email;

        await connection.commit();
        connection.release(); // Liberar conexión

         // Enviar email a la charanga
         await sendEmail(email, "Solicitud aceptada", `¡Enhorabuena! Tu solicitud para el acto "${acto}" ha sido aceptada. 
            Inicia sesión para conocer los datos de contacto de la Charanga. 
            https://victorious-stone-011abec10.6.azurestaticapps.net`);

 

        res.json({ message: "Solicitud aceptada con éxito" });
    }
    catch (error) {
        console.error("Error al aceptar solicitud:", error);
        res.status(500).json({ error: "Error al aceptar solicitud" });
    }
}
);

app.post("/rechazar_solicitud_musico", async (req, res) => {
    const { idActo, idMusico} = req.body;

    const sql = 'UPDATE solicitudes_musicos SET estado = ? WHERE idActo = ? AND idMusico = ?';
    const estado = "Rechazada";

    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar oferta
        await connection.query(sql, [estado, idActo, idMusico]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Solicitud rechazada con éxito" });
    }
    catch (error) {
        console.error("Error al rechazar solicitud:", error);
        res.status(500).json({ error: "Error al rechazar solicitud" });
    }
}
);

app.get("/numero_usuarios", async (req, res) => {

    const sql1 = 'SELECT COUNT(*) as numClientes FROM clientes';
    const sql2 = 'SELECT COUNT(*) as numMusicos FROM musicos';
    const sql3 = 'SELECT COUNT(*) as numCharangas FROM charangas';

    try{
        const [rows1] = await db.query(sql1);
        const [rows2] = await db.query(sql2);
        const [rows3] = await db.query(sql3);

        const numClientes = rows1[0].numClientes;
        const numMusicos = rows2[0].numMusicos;
        const numCharangas = rows3[0].numCharangas;

        res.json({ numClientes, numMusicos, numCharangas });
    }catch (error) {
        console.error("Error al obtener el número de usuarios:", error);
        res.status(500).json({ error: "Error al obtener el número de usuarios" });
    }
}
);


app.get("/datos_musicos", async (req, res) => {
    const {idMusicos, idActo} = req.query;



    //devuelve los datos de los musicos que estan en el array de idMusicos

    const sql = `
        SELECT m.idMusico, u.nombre, u.email, u.telefono, 
               i.nombre as instrumento, m.coche, p.nombre AS provincia, mc.valoracionCharanga, mc.valoracionMusico
        FROM usuarios u
        JOIN musicos m ON u.idUsuario = m.idMusico
        JOIN provincia p ON u.idProvincia = p.idProvincia
        JOIN instrumentos i ON m.idInstrumento = i.idInstrumento
        JOIN musicos_contratados mc ON mc.idMusico = m.idMusico
        WHERE u.idUsuario IN (?) and mc.idActo = ?
    `;

    try {
        const ids = Array.isArray(idMusicos) ? idMusicos : idMusicos.split(',');
        const [rows] = await db.query(sql, [ids, idActo]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos de músicos:", error);
        res.status(500).json({ error: "Error al obtener datos de músicos" });
    }

    }
);

app.post("/asignar_valoracion_charanga_acto", async (req, res) => {
    const { idActo, idCharanga, idMusico, valoracion, tipoActo } = req.body;


    const sql = 'UPDATE musicos_contratados SET valoracionCharanga = ? WHERE idActo = ? AND idMusico = ?';
    const sql2 = 'UPDATE solicitudes_musicos SET estado = ? WHERE idActo = ? AND idMusico = ?';
    const sql3 = 'INSERT INTO valoraciones (idUsuario, puntuacion, tipoActo) VALUES (?, ?, ?)';
    const estado = "Valorada";


    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar acto
        await connection.query(sql, [valoracion, idActo, idMusico]);

        // Actualizar solicitud
        await connection.query(sql2, [estado, idActo, idMusico]);

        await connection.query(sql3, [idCharanga, valoracion, tipoActo]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Valoración asignada con éxito" });
    }
    catch (error) {
        console.error("Error al asignar valoración a charanga:", error);
        res.status(500).json({ error: "Error al asignar valoración a charanga" });
    }
}
);

app.post("/asignar_valoracion_musico", async (req, res) => {
    const { idActo, idMusico, valoracion, tipoActo } = req.body;


    const sql = 'UPDATE musicos_contratados SET valoracionMusico = ? WHERE idActo = ? AND idMusico = ?';
    const sql3 = 'INSERT INTO valoraciones (idUsuario, puntuacion, tipoActo) VALUES (?, ?, ?)';
    const estado = "Valorada";


    try {
        const connection = await db.getConnection(); // Obtener una conexión del pool
        await connection.beginTransaction();

        // Actualizar acto
        await connection.query(sql, [valoracion, idActo, idMusico]);


        await connection.query(sql3, [idMusico, valoracion, tipoActo]);

        await connection.commit();
        connection.release(); // Liberar conexión

        res.json({ message: "Valoración asignada con éxito" });
    }
    catch (error) {
        console.error("Error al asignar valoración a charanga:", error);
        res.status(500).json({ error: "Error al asignar valoración a charanga" });
    }
}
);




// Iniciar el servidor

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto  ${PORT}`);
});

