# Aprendizajes del Proyecto

## 2026-02-13: Bug de Desencriptación en iOS (Unicode Normalization)
- **Problema**: En iOS, al copiar/pegar texto o usar el teclado, los caracteres acentuados a veces se representan usando la forma de normalización NFD (Normalization Form D), mientras que en Windows/Android suelen ser NFC. Esto causaba que la "palabra mágica" o la contraseña derivada del texto visible (usando la última palabra) tuviera una representación en bytes diferente en iOS.
- **Consecuencia**: La función de derivación de claves (PBKDF2) usa los bytes exactos de la cadena. Si la cadena de contraseña ("camión") tiene bytes diferentes en NFD vs NFC, la clave derivada es diferente y la desencriptación falla con un error de autenticación (AES-GCM tag mismatch o similar).
- **Solución**: Se implementó `password.normalize('NFC')` en la función `getKeyMaterial` en `src/utils/text-stego.js`. Esto asegura que independientemente de la plataforma de origen o destino, la clave criptográfica se derive siempre de la forma canónica NFC.
