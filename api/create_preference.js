import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
    accessToken: process.env.VITE_MP_ACCESS_TOKEN
});

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Determine the base URL for redirection (back_urls)
        // In Vercel, req.headers.origin or req.headers.referer usually works.
        // Or we can fallback to the hardcoded production URL if available, or localhost for dev.
        // For security, ideally validation of origin, but for this simple app:
        const origin = req.headers.origin || req.headers.referer || 'https://mensaje-escondido.vercel.app';
        // Ensure origin doesn't have trailing slash for consistency
        const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

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
                success: `${cleanOrigin}`,
                failure: `${cleanOrigin}`,
                pending: `${cleanOrigin}`,
            },
            auto_return: "approved",
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.status(200).json({ id: result.id });
    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al crear la preferencia de pago" });
    }
}
