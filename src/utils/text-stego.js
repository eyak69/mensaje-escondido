// Zero-width characters
const ZERO_WIDTH_SPACE = '\u200B'; // Represents 0
const ZERO_WIDTH_NON_JOINER = '\u200C'; // Represents 1
const ZERO_WIDTH_JOINER = '\u200D'; // Delimiter (start/end)

// Utilities for encryption
export const getPasswordFromText = (text) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    return words[words.length - 1];
};

export const extractPasswordFromStegoText = (textWithHidden) => {
    if (!textWithHidden) return '';
    // Strip ZWCs to get original visible text
    const cleanText = textWithHidden.replace(new RegExp(`[${ZERO_WIDTH_SPACE}${ZERO_WIDTH_NON_JOINER}${ZERO_WIDTH_JOINER}]`, 'g'), '');
    return getPasswordFromText(cleanText);
};

const getKeyMaterial = (password) => {
    const enc = new TextEncoder();
    // Normalize password to NFC to ensure consistent key derivation across platforms (e.g. iOS vs Android/Windows)
    // This fixes the bug where iOS (using NFD) couldn't decrypt messages created on Windows/Android (using NFC)
    const normalizedPassword = password.normalize('NFC');
    return window.crypto.subtle.importKey(
        "raw",
        enc.encode(normalizedPassword),
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

export const encodeText = async (visibleText, secretMessage, magicWord = '') => {
    if (!secretMessage) return visibleText;

    const password = magicWord || getPasswordFromText(visibleText);
    if (!password) {
        throw new Error("El texto visible debe tener al menos una palabra para usarla como clave, o debes ingresar una palabra mágica.");
    }

    const encryptedSecret = await encryptMessage(secretMessage, password);
    const binary = textToBinary(encryptedSecret);

    // Construct the hidden sequence
    let hiddenSequence = ZERO_WIDTH_JOINER; // Start marker
    for (let bit of binary) {
        hiddenSequence += (bit === '0' ? ZERO_WIDTH_SPACE : ZERO_WIDTH_NON_JOINER);
    }
    hiddenSequence += ZERO_WIDTH_JOINER; // End marker

    // Interleave Logic
    const visibleChars = Array.from(visibleText); // Use Array.from to handle emojis correctly
    if (visibleChars.length === 0) return hiddenSequence; // Fallback if no visible text

    let result = "";

    // We want to distribute `hiddenSequence` characters into the gaps between `visibleChars`.
    // There are `visibleChars.length` opportunities (after each char).
    // Note: We avoid putting it *before* the first char to prevent issues with some renderers showing a box, 
    // although ZWC should be invisible. Let's aim for distribution after chars.

    const hiddenChars = Array.from(hiddenSequence);
    const totalVisible = visibleChars.length;
    const totalHidden = hiddenChars.length;

    // Calculate how many hidden chars to put after each visible char
    const basePerChar = Math.floor(totalHidden / totalVisible);
    const remainder = totalHidden % totalVisible;

    let hiddenIndex = 0;

    for (let i = 0; i < totalVisible; i++) {
        result += visibleChars[i];

        // Determine how many hidden chars to append here
        // Distribute the remainder over the first 'remainder' visible chars
        let count = basePerChar + (i < remainder ? 1 : 0);

        if (hiddenIndex < totalHidden) {
            result += hiddenChars.slice(hiddenIndex, hiddenIndex + count).join('');
            hiddenIndex += count;
        }
    }

    // Append any remaining hidden chars (shouldn't be any if logic is correct, but for safety)
    if (hiddenIndex < totalHidden) {
        result += hiddenChars.slice(hiddenIndex).join('');
    }

    return result;
};

export const decodeText = async (textWithHidden, magicWord = '') => {
    let binary = '';
    let foundStart = false;

    // Since characters are interleaved, we just iterate through the string and pick out the ZWCs
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

    // Clean text for password extraction
    // Ensure we strip all ZWCs to get the original visible text used for password generation
    const cleanText = textWithHidden.replace(new RegExp(`[${ZERO_WIDTH_SPACE}${ZERO_WIDTH_NON_JOINER}${ZERO_WIDTH_JOINER}]`, 'g'), '');
    const password = magicWord || getPasswordFromText(cleanText);

    return await decryptMessage(encryptedSecret, password);
};
