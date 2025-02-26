require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Configurar conexión a MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root", 
    database: "easymusic",
});

db.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL");
});

// Registro de usuario
app.post("/register", async (req, res) => {
    const { name, email, password, confirmPassword, telefono, rol} = req.body;

    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO usuarios (name, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, email, hashedPassword, telefono, rol], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Obtener el ID del usuario recién creado
        const userId = result.insertId;

        // Crear un objeto con los datos del usuario
        const user = { id: userId, name, email, telefono, rol };

        // Generar token JWT
        const token = jwt.sign({ id: userId }, "secretkey", { expiresIn: "1h" });

        res.json({
            message: "Usuario registrado con éxito",
            token,
            user
        });
    });
});

// Inicio de sesión
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

        const user = results[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

        // Generar token JWT
        const token = jwt.sign({ id: user.id }, "secretkey", { expiresIn: "1h" });
        res.json({ message: "Inicio de sesión exitoso", token, user });
    });
});

// Iniciar el servidor
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
