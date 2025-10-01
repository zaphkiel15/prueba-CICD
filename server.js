const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const registrarController = require("./core/controllers/registroController");
const rutasController = require("./core/controllers/rutasController");
const loginController = require("./core/controllers/loginController");
const sessionMiddleware = require("./core/auth/sessionController");
const perfilController = require("./core/controllers/perfilController");
const productController = require("./core/controllers/productController");
const commentController = require("./core/controllers/commentController");
const connectToMongoDB = require("./core/databases/mongoConection");
const configController = require("./core/auth/configController");
const passwordController = require("./core/auth/passwordController");
const reservController = require("./core/controllers/reservController");
const orderController = require("./core/controllers/orderController");
const meseroController = require("./core/controllers/meseroController");
const { google } = require("googleapis");
//variables de entorno
dotenv.config();
const port = process.env.PORT;

connectToMongoDB();
app.use(express.json());

app.set("view engine", "ejs");
app.use(express.static("public"));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(registrarController);
app.use(rutasController);
app.use(loginController);
app.use(perfilController);
app.use(productController);
app.use(commentController);
app.use(configController);
app.use(passwordController);
app.use(reservController);
app.use(orderController);
app.use(meseroController);



//manejo de errores de la pagina
app.use((req, res) => {
    res.status(404).render("404");
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto:http://localhost:${port}`);
});
