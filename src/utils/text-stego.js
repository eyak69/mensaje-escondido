// Zero-width characters
const ZERO_WIDTH_SPACE = '\u200B'; // Represents 0
const ZERO_WIDTH_NON_JOINER = '\u200C'; // Represents 1
const ZERO_WIDTH_JOINER = '\u200D'; // Delimiter (start/end)

// Utilities for encryption
const getPasswordFromText = (text) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    return words[words.length - 1];
};

const getKeyMaterial = (password) => {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
};

const getKey = (keyMaterial, salt) => {
    return window.crypto.subtle.deriveKey(
        {
            "name": "PBKDF2",
            salt: salt,
            "iterations": 100000,
            "hash": "SHA-256"
        },
        keyMaterial,
        { "name": "AES-GCM", "length": 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

const encryptMessage = async (message, password) => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await getKeyMaterial(password);
    const key = await getKey(keyMaterial, salt);
    const enc = new TextEncoder();
    const encoded = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        enc.encode(message)
    );

    const encryptedContent = new Uint8Array(encoded);
    const params = new Uint8Array(salt.length + iv.length + encryptedContent.length);
    params.set(salt, 0);
    params.set(iv, salt.length);
    params.set(encryptedContent, salt.length + iv.length);

    // Convert to base64 to store as text
    return btoa(String.fromCharCode(...params));
};

const decryptMessage = async (encryptedBase64, password) => {
    try {
        const raw = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const salt = raw.slice(0, 16);
        const iv = raw.slice(16, 28);
        const ciphertext = raw.slice(28);

        const keyMaterial = await getKeyMaterial(password);
        const key = await getKey(keyMaterial, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return null; // Or throw error
    }
};

export const textToBinary = (text) => {
    return text.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(16, '0'); // UTF-16 support
    }).join('');
};

export const binaryToText = (binary) => {
    if (!binary) return '';
    const chars = [];
    for (let i = 0; i < binary.length; i += 16) {
        const byte = binary.substr(i, 16);
        chars.push(String.fromCharCode(parseInt(byte, 2)));
    }
    return chars.join('');
};

export const encodeText = async (visibleText, secretMessage) => {
    if (!secretMessage) return visibleText;

    const password = getPasswordFromText(visibleText);
    if (!password) {
        throw new Error("El texto visible debe tener al menos una palabra para usarla como clave.");
    }

    const encryptedSecret = await encryptMessage(secretMessage, password);
    const binary = textToBinary(encryptedSecret);

    let hiddenSequence = ZERO_WIDTH_JOINER; // Start marker

    for (let bit of binary) {
        hiddenSequence += (bit === '0' ? ZERO_WIDTH_SPACE : ZERO_WIDTH_NON_JOINER);
    }

    hiddenSequence += ZERO_WIDTH_JOINER; // End marker

    // Insert at the END of the text to avoid visual glitches in WhatsApp/bad word breaking
    // Original approach was index 1, but that breaks the first word visually on some renderers
    return visibleText + hiddenSequence;
};

export const decodeText = async (textWithHidden) => {
    let binary = '';
    let foundStart = false;

    for (let char of textWithHidden) {
        if (char === ZERO_WIDTH_JOINER) {
            if (foundStart) {
                // Found end marker, stop
                break;
            } else {
                foundStart = true; // Found start marker
            }
        } else if (foundStart) {
            if (char === ZERO_WIDTH_SPACE) {
                binary += '0';
            } else if (char === ZERO_WIDTH_NON_JOINER) {
                binary += '1';
            }
        }
    }

    if (!binary) return null;

    const encryptedSecret = binaryToText(binary);
    // The password is the last word of the FULL text (including hidden chars, but split ignores them usually or we need to be careful)
    // Actually, zero width chars are non-spacing, so splitting by whitespace should handle them fine or we might want to strip them first?
    // Let's strip zero-width chars to get the "visible" text for password extraction to match what the user sees.

    const cleanText = textWithHidden.replace(new RegExp(`[${ZERO_WIDTH_SPACE}${ZERO_WIDTH_NON_JOINER}${ZERO_WIDTH_JOINER}]`, 'g'), '');
    const password = getPasswordFromText(cleanText);

    return await decryptMessage(encryptedSecret, password);
};
