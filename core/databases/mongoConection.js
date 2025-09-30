const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongoURI = process.env.MONGO_URI; // uri mongo

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Conexión exitosa a MongoDB");
    } catch (err) {
        console.error("Error al conectar a MongoDB:", err);
        process.exit(1); 
    }
};

module.exports = connectToMongoDB;