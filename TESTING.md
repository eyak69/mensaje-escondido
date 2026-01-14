# Datos de Prueba - Mercado Pago Sandbox (Argentina)

Usa estos datos para simular pagos aprobados en el entorno de pruebas.

## Tarjeta de Crédito (Visa)
- **Número:** `4000 0001 2345 6789`
- **Nombre del Titular:** `APRO` (Para aprobación inmediata)
  - _Otros estados:_ `CONT` (Pendiente), `OTHE` (Rechazado)
- **Fecha de Vencimiento:** `11/2026` (Cualquier fecha futura)
- **Código de Seguridad (CVV):** `123`
- **DNI del Titular:** `12345678`

## Usuarios de Prueba
Si necesitas loguearte en Mercado Pago Sandbox:
- **Comprador:** (Generado por script `sandbox_setup.js` si es necesario)
- **Vendedor:** (Tus credenciales de prueba configuradas en `.env`)

> **Nota:** Asegúrate de que las credenciales en `.env` (`VITE_MP_PUBLIC_KEY`) sean las de un usuario de prueba o aplicación de prueba para que estas tarjetas funcionen.
