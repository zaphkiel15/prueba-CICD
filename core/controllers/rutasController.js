const express = require("express");
const router = express.Router();
const isAuthenticated = require("../auth/authController");
const db = require("../../config/dbsettings"); 
const authorizeRoles = require("../auth/roleController");
const { Pedidos, Notificaciones, Meseros } = require("../../config/mongoSchemas"); 
const dotenv = require("dotenv");

dotenv.config();

router.get("/ordenes-admin", isAuthenticated, authorizeRoles([1]), async (req, res) => {
    try {
        // Fetch all meseros
        const meseros = await Meseros.find();

        // Fetch all reservations with order data
        const query = `
            SELECT r.id_reservacion, r.id_orden, r.start, r.end, r.mesero_nombre,
                   o.estado AS estado_orden, u.nombre AS usuario_nombre, u.correo AS usuario_correo
            FROM reservaciones r
            INNER JOIN ordenes o ON r.id_orden = o.id_orden
            INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
            ORDER BY r.start DESC
        `;
        const [reservaciones] = await db.query(query);

        res.render("ordenesAdmin", {
            user: req.session.user,
            meseros,
            reservaciones,
        });
    } catch (err) {
        console.error("Error al cargar los datos:", err);
        req.session.errorMessage = "Error al cargar los datos.";
        res.redirect("/index");
    }
});



router.get("/", (req, res) => {
    const errorMessage = req.session.errorMessage || null;
    const successMessage = req.session.successMessage || null;

    req.session.successMessage = null;
    req.session.errorMessage = null; 
    res.render("login", { errorMessage, successMessage });
});

router.get("/ordenes", isAuthenticated, authorizeRoles([2]), async (req, res) => {
    const id_usuario = req.session.user.id; // Get the user ID from the session

    try {
        // Query the database for the user's orders
        const query = `
            SELECT o.id_orden, o.id_producto, p.nombre AS nombre_producto, o.estado, o.fecha_orden
            FROM ordenes o
            INNER JOIN productos p ON o.id_producto = p.id_producto
            WHERE o.id_usuario = ?
            ORDER BY o.fecha_orden DESC
        `;
        const [ordenes] = await db.query(query, [id_usuario]);

        // Render the template and pass the orders data
        res.render("ordenes", { user: req.session.user, ordenes });
    } catch (err) {
        console.error("Error al obtener las órdenes:", err);
        req.session.errorMessage = "Error al cargar las órdenes.";
        res.redirect("/productos");
    }
});

router.get("/forgot-password", (req, res) => {
    sitekey = process.env.RECAPTCHA_SITE_KEY;
    res.render("forgot-password", {sitekey});
});

router.get("/registro", isAuthenticated, authorizeRoles([1]), (req, res) => {
    const errorMessage = req.session.errorMessage || null;
    const successMessage = req.session.successMessage || null;
    req.session.errorMessage = null; 
    req.session.successMessage = null;
    res.render("registro", { errorMessage, successMessage, user: req.session.user });
});

router.get('/users', isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const errorMessage = req.session.errorMessage || null;
    const successMessage = req.session.successMessage || null;
    req.session.errorMessage = null; 
    req.session.successMessage = null;
    const [usuarios] = await db.query('SELECT id_usuario, nombre, correo, id_rol FROM usuarios');
    res.render('users', { user: req.session.user ,usuarios, errorMessage, successMessage });
});

router.get('/users/delete/:id_usuario', isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const query = "DELETE FROM usuarios WHERE id_usuario = ?";
        await db.query(query, [id_usuario]);

        req.session.successMessage = "Usuario eliminado exitosamente.";
        res.redirect('/users');
    } catch (err) {
        console.error("Error al eliminar el usuario:", err);
        req.session.errorMessage = "Error al eliminar el usuario.";
        res.redirect('/users');
    }
});

router.post('/users/update-role', async (req, res) => {
    const { id_usuario, id_rol } = req.body;

    try {
        const query = "UPDATE usuarios SET id_rol = ? WHERE id_usuario = ?";
        await db.query(query, [id_rol, id_usuario]);
        req.session.successMessage = "Rol actualizado exitosamente.";
        res.redirect('/users');
    } catch (err) {
        console.error("Error al actualizar el rol:", err);
        req.session.errorMessage = "Error al actualizar el rol.";
        res.redirect('/users');
    }
});

router.get("/index", isAuthenticated,authorizeRoles([1]), (req, res) => {
    res.render("index", { user: req.session.user });
});

router.get("/configuracion", isAuthenticated, authorizeRoles([1, 2, 3]), async (req, res) => {
    const id_usuario = req.session.user.id;

    const errorMessage = req.session.errorMessage || null;
    const successMessage = req.session.successMessage || null;

    // Clear the messages after rendering
    req.session.errorMessage = null;
    req.session.successMessage = null;

    try {
        const pedidoConfig = await Pedidos.findOne({ id_usuario });
        const notificacionConfig = await Notificaciones.findOne({ id_usuario });

        res.render("configuracion", {
            user: req.session.user,
            pedidoConfig: pedidoConfig || {}, 
            notificacionConfig: notificacionConfig || {}, 
            errorMessage,
            successMessage,
        });
    } catch (err) {
        console.error("Error al consultar las configuraciones:", err);
        res.redirect("/index");
    }
});

router.get("/perfil", isAuthenticated, authorizeRoles([1,2,3]), async (req, res) => {
    try {
        const query = "SELECT correo, foto_perfil, fecha_registro, id_rol AS rol FROM usuarios WHERE id_usuario = ?";
        const [results] = await db.query(query, [req.session.user.id]);

        if (results.length > 0) {
            const user = {
                nombre: req.session.user.nombre,
                correo: results[0].correo,
                fecha_registro: results[0].fecha_registro,
                rol: results[0].rol,
                pfp: results[0].foto_perfil || null
            };
            res.render("perfil", { user });
        } else {
            req.session.errorMessage = "Usuario no encontrado";
            res.redirect("/");
        }
    } catch (err) {
        console.error("Error al consultar la base de datos:", err);
        req.session.errorMessage = "Error en el servidor";
        res.redirect("/");
    }
});

router.get("/comentarios", isAuthenticated, authorizeRoles([1,2,3]), async (req, res) => {
    try {
        const query = `
            SELECT 
            c.id_comentario,
            c.comentario, 
            c.fecha_comentario, 
            u.nombre AS usuario_nombre, 
            u.foto_perfil AS usuario_foto 
            FROM comentarios c
            INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
            ORDER BY c.fecha_comentario DESC
        `;

        const [comentarios] = await db.query(query);

        res.render("comentarios", { user: req.session.user, comentarios });
    } catch (err) {
        console.error("Error al consultar los comentarios:", err);
        res.redirect("/index");
    }
});

router.get("/productos", isAuthenticated, authorizeRoles([1,2,3]), async (req, res) => {
    try {
        const query = "SELECT id_producto, nombre, descripcion, precio, imagen_producto FROM productos";
        const [products] = await db.query(query);

        res.render("productos", { user: req.session.user, products });
    } catch (err) {
        console.error("Error al consultar los productos:", err);
        res.redirect("/index");
    }
});

router.get("/reservaciones", isAuthenticated, authorizeRoles([3]), (req, res) => {
    

    const errorMessage = req.session.errorMessage || null;
    const successMessage = req.session.successMessage || null;

    // Clear the messages after rendering
    req.session.errorMessage = null;
    req.session.successMessage = null;

    // Check for query parameters
    const { id_orden, nombre, email } = req.query;

    res.render("reservaciones", {
        user: req.session.user,
        errorMessage,
        successMessage,
        id_orden: id_orden || "", // Pass empty string if not provided
        nombre: nombre || "", // Pass empty string if not provided
        email: email || "" // Pass empty string if not provided
    });
});


module.exports = router;