const express = require("express");
const router = express.Router();
const isAuthenticated = require("../auth/authController");
const db = require("../../config/dbsettings"); 
const authorizeRoles = require("../auth/roleController");
const { Meseros } = require("../../config/mongoSchemas"); 
const { google } = require("googleapis");

router.get("/ordenes-recepcionista", isAuthenticated, authorizeRoles([3]), async (req, res) => {
    try {
        // Query to get all orders with user details
        const query = `
            SELECT o.id_orden, o.id_producto, p.nombre AS nombre_producto, o.estado, o.fecha_orden,
                   u.nombre AS nombre_usuario, u.correo AS correo_usuario
            FROM ordenes o
            INNER JOIN productos p ON o.id_producto = p.id_producto
            INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
            ORDER BY o.fecha_orden DESC
        `;
        const [ordenes] = await db.query(query);

        // Render the template and pass the orders data
        res.render("ordenesRecepcionista", { user: req.session.user, ordenes });
    } catch (err) {
        console.error("Error al obtener las órdenes:", err);
        req.session.errorMessage = "Error al cargar las órdenes.";
        res.redirect("/index");
    }
});

router.post("/ordenes-admin/completeOrder/:id_reservacion", isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { id_reservacion } = req.params;
    // Query the reservaciones table for the mesero_nombre field
    const getMeseroQuery = `
        SELECT mesero_nombre
        FROM reservaciones
        WHERE id_reservacion = ?
    `;
    const [result] = await db.query(getMeseroQuery, [id_reservacion]);

    if (result.length === 0) {
        req.session.errorMessage = "Reservación no encontrada.";
        return res.redirect("/ordenes-admin");
    }

    const mesero_nombre = result[0].mesero_nombre;

    try {
        const mesero = await Meseros.findOneAndUpdate(
            { nombre: mesero_nombre },
            { estado: "Disponible" },
            { new: true } // Return the updated document
        );

        if (!mesero) {
            req.session.errorMessage = "Mesero no encontrado.";
            return res.redirect("/ordenes-admin");
        }

        // Update the order's estado to "Completado"
        const updateOrderQuery = `
            UPDATE ordenes
            SET estado = 'Completado'
            WHERE id_orden = (SELECT id_orden FROM reservaciones WHERE id_reservacion = ?)
        `;
        await db.query(updateOrderQuery, [id_reservacion]);

        req.session.successMessage = "Orden completada exitosamente.";
        res.redirect("/ordenes-admin");
    } catch (err) {
        console.error("Error al completar la orden:", err);
        req.session.errorMessage = "Error al completar la orden.";
        res.redirect("/ordenes-admin");
    }
});

router.post("/ordenes-admin/assignMesero/:id_reservacion", isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { id_reservacion } = req.params;
    const { mesero_nombre } = req.body;

    try {
        // actualizar a "No disponible"
        const mesero = await Meseros.findOneAndUpdate(
            { nombre: mesero_nombre },
            { estado: "No disponible" },
            { new: true } 
        );

        if (!mesero) {
            req.session.errorMessage = "Mesero no encontrado.";
            return res.redirect("/ordenes-admin");
        }

        // Update the order's estado to "Agendado"
        const updateOrderQuery = `
            UPDATE ordenes
            SET estado = 'agendado'
            WHERE id_orden = (SELECT id_orden FROM reservaciones WHERE id_reservacion = ?)
        `;
        const updateOrderQuery2 = `
            UPDATE reservaciones
            SET mesero_nombre = '${mesero_nombre}'
            WHERE id_reservacion =  ?
        `;
        await db.query(updateOrderQuery, [id_reservacion]);
        await db.query(updateOrderQuery2, [id_reservacion]);

        req.session.successMessage = "Mesero asignado y orden agendada exitosamente.";
        res.redirect("/ordenes-admin");
    } catch (err) {
        console.error("Error al asignar mesero:", err);
        req.session.errorMessage = "Error al asignar mesero.";
        res.redirect("/ordenes-admin");
    }
});

module.exports = router;