import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.VITE_MP_ACCESS_TOKEN
});

app.get("/", (req, res) => {
    res.send("Backend de Mensaje Escondido funcionando!");
});

app.post("/create_preference", async (req, res) => {
    try {
        const body = {
            items: [
                {
                    title: "Desbloqueo Mensaje Largo",
                    quantity: 1,
                    unit_price: 1000,
                    currency_id: "ARS",
                },
            ],
            back_urls: {
                success: "http://localhost:5173", // Redirige al frontend tras pago
                failure: "http://localhost:5173",
                pending: "http://localhost:5173",
            },
            // auto_return: "approved", // Desactivado: MP bloquea auto_return en local/127.0.0.1
            // binary_mode: true,
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({ id: result.id });
    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al crear la preferencia de pago" });
    }
});

app.listen(port, () => {
    console.log(`Server corriendo en http://localhost:${port}`);
});
