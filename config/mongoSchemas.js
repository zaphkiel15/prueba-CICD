const mongoose = require("mongoose");

const MeseroSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    estado: { type: String, default: "Disponible" },
});
const NotificacionesSchema = new mongoose.Schema({
    id_usuario: {
        type: Number, 
        required: true,
    },
    notis_correo: {
        type: Boolean,
        required: true,
        default: false, 
    },
    notis_SMS: {
        type: Boolean,
        required: true,
        default: false, 
    },
});

const PedidosSchema = new mongoose.Schema({
    id_usuario: {
        type: Number, 
        required: true,
    },
    direccion: {
        type: String,
        required: true,
    },
    metodo_pago: {
        type: String,
        required: true,
        enum: ["efectivo", "tarjeta", "paypal"], 
    },
    vegetariano: {
        type: Boolean,
        required: true,
        default: false,
    },
    vegano: {
        type: Boolean,
        required: true,
        default: false,
    },
    sin_gluten: {
        type: Boolean,
        required: true,
        default: false,
    },
});

// modelos
const Notificaciones = mongoose.model("Preferencias de notificaciones", NotificacionesSchema);
const Pedidos = mongoose.model("Preferencias de pedidos", PedidosSchema);
const Meseros = mongoose.model("Meseros", MeseroSchema);

module.exports = { Notificaciones, Pedidos, Meseros };