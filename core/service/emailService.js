const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"Restaurante" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Correo enviado correctamente");
    } catch (err) {
        console.error("Error al enviar correo", err);
    }
};

module.exports = sendEmail;