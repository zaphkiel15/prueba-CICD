const express = require("express");
const router = express.Router();
const isAuthenticated = require("../auth/authController");
const db = require("../../config/dbsettings"); 
const authorizeRoles = require("../auth/roleController");
const { format } = require("date-fns");

router.post("/productos/agregar", authorizeRoles([1]), isAuthenticated, async (req, res) => {
    const { nombre, descripcion, precio, stock, imagen_producto } = req.body;
    const fecha_creacion = format(new Date(), "yyyy-MM-dd HH:mm:ss");

    try {
        const query = "INSERT INTO productos (nombre, descripcion, precio, stock, imagen_producto, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)";
        await db.query(query, [nombre, descripcion, precio, stock, imagen_producto, fecha_creacion]);

        res.redirect("/productos");
    } catch (err) {
        console.error("Error al agregar producto:", err);
        res.redirect("/productos");
    }
});

router.get("/productos/eliminar/:id", authorizeRoles([1]), isAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        const query = "DELETE FROM productos WHERE id_producto = ?";
        await db.query(query, [id]);

        res.redirect("/productos");
    } catch (err) {
        console.error("Error al eliminar producto:", err);
        res.redirect("/productos");
    }
});
router.get("/productos/ordenar/:id", authorizeRoles([2]), isAuthenticated, async (req, res) => {
    const { id } = req.params; // Product ID
    const id_usuario = req.session.user.id; // User ID from session
    const nombre_usuario = req.session.user.nombre; // User name from session
    const correo_usuario = req.session.user.correo; // User email from session
    const estado = 'pendiente'; // Initial state of the order

    try {
        // Step 1: Update the product stock
        const updateStockQuery = "UPDATE productos SET stock = stock - 1 WHERE id_producto = ? AND stock > 0";
        const [updateResult] = await db.query(updateStockQuery, [id]);

        if (updateResult.affectedRows === 0) {
            req.session.errorMessage = "El producto no tiene stock disponible.";
            return res.redirect("/productos");
        }

        // Step 2: Insert the order into the `ordenes` table
        const insertOrderQuery = `
            INSERT INTO ordenes (id_producto, id_usuario, nombre_usuario, correo_usuario, estado)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(insertOrderQuery, [id, id_usuario, nombre_usuario, correo_usuario, estado]);

        req.session.successMessage = "Producto ordenado exitosamente.";
        res.redirect("/productos");
    } catch (err) {
        console.error("Error al ordenar producto:", err);
        req.session.errorMessage = "Error al ordenar el producto.";
        res.redirect("/productos");
    }
});

module.exports = router;