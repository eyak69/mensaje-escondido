import { MercadoPagoConfig } from 'mercadopago';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// Script para crear Usuarios de Prueba REALES
// Requiere tu ACCESS_TOKEN de Producción o de tu cuenta principal para generar los sub-usuarios de prueba.

const accessToken = process.env.VITE_MP_ACCESS_TOKEN;

async function createTestUser(description) {
    try {
        const response = await fetch('https://api.mercadopago.com/users/test_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                site_id: 'MLA', // Argentina
                description: description
            })
        });

        const data = await response.json();
        console.log(`--- Usuario ${description} ---`);
        if (data.id) {
            console.log('ID:', data.id);
            console.log('Nickname:', data.nickname);
            console.log('Password:', data.password);
        } else {
            console.error('Error:', data);
        }
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function main() {
    console.log("Creando usuarios para SANDBOX...");

    // 1. Crear Vendedor
    console.log("Generando VENDEDOR...");
    await createTestUser("Vendedor_MensajeEscondido");

    // 2. Crear Comprador
    console.log("Generando COMPRADOR...");
    await createTestUser("Comprador_MensajeEscondido");

    console.log("\nINSTRUCCIONES:");
    console.log("1. Usa las credenciales del VENDEDOR en tu .env (ACCESS_TOKEN y PUBLIC_KEY del vendedor nuevo, no las tuyas).");
    console.log("2. Inicia sesión en una ventana de incógnito con el usuario COMPRADOR en Mercado Pago Sandbox para pagar.");
    console.log("   O usa las tarjetas de prueba directamente.");
}

main();
