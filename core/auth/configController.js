const express = require("express");
const router = express.Router();
const isAuthenticated = require("./authController");
const authorizeRoles = require("./roleController");
const { Notificaciones, Pedidos} = require("../../config/mongoSchemas");
const db = require("../../config/dbsettings");
const bcrypt = require("bcrypt");

router.post("/configuracion/updatePassword", authorizeRoles([1, 2, 3]), isAuthenticated, async (req, res) => {


    const { contraseña_actual, nueva_contraseña, confirmar_contraseña } = req.body;
    const id_usuario = req.session.user.id;

    try {
        // Step 1: Check if the new password and confirm password match
        if (nueva_contraseña !== confirmar_contraseña) {
            req.session.errorMessage = "Las contraseñas no coinciden.";
            return res.redirect("/configuracion");
        }

        // Step 2: Query the database for the current password
        const query = "SELECT contraseña FROM usuarios WHERE id_usuario = ?";
        const [results] = await db.query(query, [id_usuario]);

        if (results.length === 0) {
            req.session.errorMessage = "Usuario no encontrado.";
            return res.redirect("/configuracion");
        }

        const currentPasswordInDB = results[0].contraseña;

        // Step 3: Compare the current password with the provided current password
        const isPasswordValid = await bcrypt.compare(contraseña_actual, currentPasswordInDB);
        if (!isPasswordValid) {
            req.session.errorMessage = "Credenciales incorrectas.";
            return res.redirect("/configuracion");
        }

        // Step 4: Update the password in the database
        const hashedNewPassword = await bcrypt.hash(nueva_contraseña, 10);
        const updateQuery = "UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?";
        await db.query(updateQuery, [hashedNewPassword, id_usuario]);

        req.session.successMessage = "Contraseña actualizada exitosamente.";
        res.redirect("/configuracion");
    } catch (err) {
        console.error("Error al actualizar la contraseña:", err);
        req.session.errorMessage = "Error en el servidor.";
        res.redirect("/configuracion");
    }
});

router.post("/configuracion/notificacion", authorizeRoles([2]), isAuthenticated, async (req, res) => {
    const notis_correo = req.body.notis_correo === "on";
    const notis_SMS = req.body.notis_SMS === "on"; 
    const id_usuario = req.session.user.id;

    try {
        // ver si hay configuración existente
        const configExistente = await Notificaciones.findOne({ id_usuario });

        if (configExistente) {
            // actualizar configuracion
            configExistente.notis_correo = notis_correo;
            configExistente.notis_SMS = notis_SMS;
            await configExistente.save();
            req.session.successMessage = "Configuración de notificaciones actualizada exitosamente.";
        } else {
            // Crear nueva configuracion
            const nuevaConfig = new Notificaciones({
                id_usuario,
                notis_correo,
                notis_SMS,
            });
            await nuevaConfig.save();
            req.session.successMessage = "Nueva configuración guardada exitosamente.";
        }

        res.redirect("/configuracion");
    } catch (err) {
        req.session.errorMessage = "Error en el servidor.";
        res.redirect("/configuracion");
    }
});

router.post("/configuracion/pedido", authorizeRoles([2]), isAuthenticated, async (req, res) => {
    const id_usuario = req.session.user.id;

    const direccion = req.body.direccion;
    const metodo_pago = req.body.metodo_pago;
    const vegetariano = req.body.vegetariano === "on"; 
    const vegano = req.body.vegano === "on";
    const sin_gluten = req.body.sin_gluten === "on";

    try {
        // ver si existe configuracion
        const pedidoConfigExistente = await Pedidos.findOne({ id_usuario });

        if (pedidoConfigExistente) {
            // actualizar
            pedidoConfigExistente.direccion = direccion;
            pedidoConfigExistente.metodo_pago = metodo_pago;
            pedidoConfigExistente.vegetariano = vegetariano;
            pedidoConfigExistente.vegano = vegano;
            pedidoConfigExistente.sin_gluten = sin_gluten;
            await pedidoConfigExistente.save();
            req.session.successMessage = "Configuración de pedidos actualizada exitosamente.";
        } else {
            // Crear nueva configuracion
            const nuevoPedidoConfig = new Pedidos({
                id_usuario,
                direccion,
                metodo_pago,
                vegetariano,
                vegano,
                sin_gluten,
            });
            await nuevoPedidoConfig.save();
            req.session.successMessage = "Nueva configuración de pedidos guardada exitosamente.";
        }

        res.redirect("/configuracion");
    } catch (err) {
        req.session.errorMessage = "Error en el servidor.";
        res.redirect("/configuracion");
    }
});

module.exports = router;