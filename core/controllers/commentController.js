const express = require("express");
const router = express.Router();
const isAuthenticated = require("../auth/authController");
const db = require("../../config/dbsettings"); 
const authorizeRoles = require("../auth/roleController");
const { format } = require("date-fns");
const sanitizeHtml = require('sanitize-html'); 

router.post("/comentarios/agregar", authorizeRoles([2]), isAuthenticated, async (req, res) => {

    const { comentario } = req.body;

    const comentarioLimpio = sanitizeHtml(comentario, { 
        allowedTags: [], 
        allowedAttributes: {} 
    }); 


    const id_usuario = req.session.user.id;
    const fecha_comentario = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const fecha_expiracion = format(new Date(new Date().setDate(new Date().getDate() + 7)), "yyyy-MM-dd HH:mm:ss");

    try {
        const query = "INSERT INTO comentarios (id_usuario, comentario, fecha_comentario, fecha_expiracion) VALUES (?, ?, ?, ?)";
        await db.query(query, [id_usuario, comentarioLimpio, fecha_comentario, fecha_expiracion]);

        res.redirect("/comentarios");
    } catch (err) {
        console.error("Error al agregar comentario:", err);
        res.redirect("/comentarios");
    }
});

router.get("/comentarios/eliminar/:id", authorizeRoles([1]), isAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        const query = "DELETE FROM comentarios WHERE id_comentario = ?";
        await db.query(query, [id]);

        res.redirect("/comentarios");
    } catch (err) {
        console.error("Error al eliminar comentario:", err);
        res.redirect("/comentarios");
    }
});

module.exports = router;