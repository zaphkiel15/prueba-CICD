const express = require("express");
const router = express.Router();
const db = require("../../config/dbsettings"); 
const { format } = require("date-fns");
const bcrypt = require("bcrypt");
const isAuthenticated = require("../auth/authController");
const authorizeRoles = require("../auth/roleController");

router.post("/registrar",  isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { nombre_usuario, contraseña, correo } = req.body;
    let fecha = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const checkEmailQuery = 'SELECT * FROM usuarios WHERE correo = ?';
    const insertUserQuery = 'INSERT INTO usuarios (nombre, correo, contraseña, fecha_registro) VALUES (?, ?, ?, ?)';

    try {
        const [emailResults] = await db.query(checkEmailQuery, [correo]);

        if (emailResults.length > 0) {
            req.session.errorMessage = "Este correo ya ha sido registrado";
            return res.redirect("/registro");
        }
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        
        await db.query(insertUserQuery, [nombre_usuario, correo, hashedPassword, fecha]);
        req.session.successMessage = "Registro exitoso";
        res.redirect("/registro");
    } catch (err) {
        console.error("Error en la consulta:", err);
        req.session.errorMessage = "Error en el servidor";
        res.redirect("/registro");
    }
});

module.exports = router;