const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const router = express.Router();
const isAuthenticated = require("../auth/authController");
const db = require("../../config/dbsettings"); 
const authorizeRoles = require("../auth/roleController");
const open = require("open");
dotenv = require("dotenv");
dotenv.config();




// const TOKEN_PATH = process.env.TOKEN_PATH || "token.json";
// const SCOPES = [process.env.SCOPES];

// const oAuth2Client = new google.auth.OAuth2(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     process.env.REDIRECT_URI
// );


//  if (fs.existsSync(TOKEN_PATH)) {
//      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
//      oAuth2Client.setCredentials(token);
//  } else {
//     const authUrl = oAuth2Client.generateAuthUrl({
//         access_type: "offline",
//         scope: SCOPES,
//     });
//     console.log(" Autoriza esta app en:", authUrl);
//     open(authUrl);
//  }

router.get("/oauth2callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("No se proporcionó código.");
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        res.send(" Autenticación completa. Ya puedes crear eventos.");
    } catch (err) {
        console.error("Error al obtener el token:", err);
        res.send(" Error al autenticar.");
    }
});




router.post("/reservar", isAuthenticated, authorizeRoles([3]), async (req, res) => {
    const { id_orden, start, email, end, nombre, summary, description } = req.body;
    const id_usuario = req.session.user.id; 
    
    if (!id_orden || !start || !email || !end || !nombre || !summary || !description) {
        // Aquí podrías agregar un mensaje de error si falta algún campo
        req.session.errorMessage = "Por favor completa todos los campos.";
        return res.redirect("/reservaciones");
   }

    const startDateTime = new Date(start);
    const endDateTime = new Date(end);

    try {
        // Inserta la reserva en la base de datos o procesa los datos como sea necesario
        const query = "INSERT INTO reservaciones (id_orden, id_usuario, start, email, end, nombre, summary, description) VALUES (?, ?, ?, ?,?, ?, ?, ?)";
        await db.query(query, [id_orden, id_usuario, startDateTime, email, endDateTime, nombre, summary, description]);

        // actualizar el estado de la orden a 'reservado'
        const updateOrderQuery = `
            UPDATE ordenes
            SET estado = 'reservado'
            WHERE id_orden = ?
        `;
        await db.query(updateOrderQuery, [id_orden]);

        // Redirige o responde con el éxito de la reserva
        req.session.successMessage = "Reservación guardada exitosamente.";
        res.redirect("/reservaciones");
    } catch (err) {
        console.error("Error al guardar la reserva:", err);
        req.session.errorMessage = "Error al guardar la reservacion";
        return res.redirect("/reservaciones");
    }
});

module.exports = router;