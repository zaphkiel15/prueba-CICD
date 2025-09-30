const express = require("express");
const router = express.Router();
const isAuthenticated = require("../auth/authController");
const authorizeRoles = require("../auth/roleController");
const { Meseros } = require("../../config/mongoSchemas");


router.post("/ordenes-admin/addMesero", isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        req.session.errorMessage = "El nombre del mesero es obligatorio.";
        return res.redirect("/ordenes-admin");
    }

    try {
        // Add the new mesero to the MongoDB collection
        const newMesero = new Meseros({
            nombre,
            estado: "Disponible", // Default value
        });
        await newMesero.save();

        req.session.successMessage = "Mesero agregado exitosamente.";
        res.redirect("/ordenes-admin");
    } catch (err) {
        console.error("Error al agregar el mesero:", err);
        req.session.errorMessage = "Error al agregar el mesero.";
        res.redirect("/ordenes-admin");
    }
});

router.post("/ordenes-admin/editMesero/:id", isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    console.log("ID del mesero:", id);
    console.log("Nuevo nombre del mesero:", nombre);

    try {
        await Meseros.findByIdAndUpdate(id, { nombre });
        res.status(200).send("Mesero actualizado.");
    } catch (err) {
        console.error("Error al editar el mesero:", err);
        res.status(500).send("Error al editar el mesero.");
    }
});

router.post("/ordenes-admin/deleteMesero/:id", isAuthenticated, authorizeRoles([1]), async (req, res) => {
    const { id } = req.params;

    try {
        await Meseros.findByIdAndDelete(id);
        req.session.successMessage = "Mesero eliminado exitosamente.";
        res.redirect("/ordenes-admin");
    } catch (err) {
        console.error("Error al eliminar el mesero:", err);
        req.session.errorMessage = "Error al eliminar el mesero.";
        res.redirect("/ordenes-admin");
    }
});

module.exports = router;