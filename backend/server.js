require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());


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

        const user = { id: userId, nombre, email, telefono, rol, idProvincia };
        const token = jwt.sign({ id: userId }, "secretkey", { expiresIn: "1h" });

        res.json({
            message: "Usuario registrado con éxito",
            token,
            user
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error en el registro del usuario" });
    }
});

// Inicio de sesión
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ?";

    try {
        // Ejecutar la consulta con await
        const [results] = await db.query(sql, [email]);

        if (results.length === 0) {
            return res.status(400).json({ error: "Usuario no encontrado" });
        }

        const user = results[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        // Generar token JWT
        const token = jwt.sign({ id: user.id }, "secretkey", { expiresIn: "1h" });
        res.json({ message: "Inicio de sesión exitoso", token, user });

    } catch (error) {
        console.error("Error al iniciar sesion con el usuario:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});




// Iniciar el servidor
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
