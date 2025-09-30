const express = require("express");
const crypto = require("crypto");
const sendEmail = require("../service/emailService");
const db = require("../../config/dbsettings"); 
const router = express.Router();
const bcrypt = require("bcrypt");


router.post("/forgot-password", async (req, res) => {

    const params = new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: req.body["g-recaptcha-response"],
        remoteip: req.ip,
    });

    // Validar el reCAPTCHA
    fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: params, 

    })
    .then(res => res.json())
    .then(async (data) => {
        if (data.success) {
            const { correo } = req.body;

            try {
                // ver si existe usuario
                const query = "SELECT * FROM usuarios WHERE correo = ?";
                const [results] = await db.query(query, [correo]);
        
                if (results.length === 0) {
                    return res.status(404).send("No existe un usuario con ese correo.");
                }
        
                // generar un token de reset
                const resetToken = crypto.randomBytes(32).toString("hex");
                const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        
                // guardar token en la base de datos
                const updateQuery = "UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE correo = ?";
                await db.query(updateQuery, [resetToken, resetTokenExpiry, correo]);
        
                // enviar correo con el enlace de restablecimiento
                const resetLink = `http://localhost:${process.env.PORT}/reset-password/${resetToken}`;
                const emailHtml = `
                    <h1>Restablecer contraseña</h1>
                    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>Este enlace es válido por 1 hora.</p>
                `;
        
                await sendEmail(correo, "Restablecer contraseña", emailHtml);
        
                res.json({ captchaSuccess: true });
            } catch (err) {
                console.error("Error en el proceso de restablecimiento de contraseña:", err);
                res.status(500).send("Error en el servidor.");
            }
        } else {
            res.json({ captchaSuccess: false });
        }})
});

router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { nueva_contraseña } = req.body;

    try {
        // Check if the token is valid
        const query = "SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expiry > ?";
        const [results] = await db.query(query, [token, Date.now()]);

        if (results.length === 0) {
            return res.status(400).send("El token es inválido o ha expirado.");
        }

        // Update the user's password
        const hashedPassword = await bcrypt.hash(nueva_contraseña, 10);

        const updateQuery = "UPDATE usuarios SET contraseña = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?";
        await db.query(updateQuery, [hashedPassword, token]);

        req.session.successMessage = "Contraseña restablecida con éxito. Puedes iniciar sesión ahora.";
        res.redirect("/");
    } catch (err) {
        console.error("Error al restablecer la contraseña:", err);
        res.status(500).send("Error en el servidor.");
    }
});

router.get("/reset-password/:token", async (req, res) => {
    const { token } = req.params;

    try {
        // Check if the token is valid
        const query = "SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expiry > ?";
        const [results] = await db.query(query, [token, Date.now()]);

        if (results.length === 0) {
            return res.status(400).send("El token es inválido o ha expirado.");
        }

        // Render the reset-password.ejs page, passing the token
        res.render("reset-password", { token });
    } catch (err) {
        console.error("Error al verificar el token:", err);
        res.status(500).send("Error en el servidor.");
    }
});

module.exports = router;