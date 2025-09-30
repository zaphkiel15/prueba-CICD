const express = require("express");
const router = express.Router();
const db = require("../../config/dbsettings"); 
const bcrypt = require("bcrypt");

router.post("/iniciosesion", async (req, res) => {
    const { correo, contraseña } = req.body;
    // Sanitizar entradas para evitar inyecciones SQL
    const sanitizedCorreo = sanitize(correo);
    const sanitizedContraseña = sanitize(contraseña);
    const query = 'SELECT * FROM usuarios WHERE correo = ?';

    try {
        const [results] = await db.query(query, [sanitizedCorreo]);

        if (results.length > 0) {
            // guardar informacion del usuario en la sesion
            const user = results[0];
            const isPasswordValid = await bcrypt.compare(sanitizedContraseña, user.contraseña);
            if (isPasswordValid) {
                req.session.user = {
                    id: results[0].id_usuario,
                    nombre: results[0].nombre,
                    correo: results[0].correo,
                    rol: results[0].id_rol
                };
                // Redireccionar usuario
                if (results[0].id_rol === 1) {
                    // Admin
                    res.redirect("/index");
                } else if (results[0].id_rol === 2) {
                    // User
                    res.redirect("/productos");
                } else if (results[0].id_rol === 3) {
                    // Receptionista
                    res.redirect("/reservaciones");
                } else {
                    // rol desconocido
                    req.session.errorMessage = "Rol desconocido";
                    res.redirect("/");
                }
            } else {
                // mensaje de error
                req.session.errorMessage = "Credenciales incorrectas";
                res.redirect("/");
            }
        } else {
            // mensaje de error
            req.session.errorMessage = "El correo no existe";
            res.redirect("/");
        }
    } catch (err) {
        console.log("Error en la consulta:", err);
        req.session.errorMessage = "Error en el servidor";
        res.redirect("/");
    }
});

function sanitize(input) { 
     return input.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
 } 


router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error al cerrar sesión:", err);
            return res.status(500).send("Error al cerrar sesión");
        }
            res.render("login", { errorMessage: "Sesión cerrada correctamente", successMessage: null });
    });
});

module.exports = router;