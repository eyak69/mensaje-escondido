import { encode, decode } from '@masknet/stego-js';

// Helper to sanitize image to PNG via Canvas
const sanitizeToPng = async (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas toBlob failed"));
            }, 'image/png');
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image for sanitization"));
        };

        img.src = url;
    });
};

export const encodeImage = async (file, secretMessage) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Stego: Sanitizing input to PNG...');
            const pngBlob = await sanitizeToPng(file);
            const pngBuffer = await pngBlob.arrayBuffer();
            const pngUint8 = new Uint8Array(pngBuffer);

            console.log('Stego: Starting Encode V2 (Sanitized)...');

            // V2 (FFT1D) - Frequency Domain
            const stegoUint8 = await encode(pngUint8, pngUint8, {
                text: secretMessage,
                version: 'V2',
                transformAlgorithm: 'FFT1D',
                grayscaleAlgorithm: 'NONE',
                size: 8,
                copies: 3,
                tolerance: 150, // Standard Tolerance for FFT
                exhaustPixels: false,
                cropEdgePixels: true,
                fakeMaskPixels: false,
            });

            console.log('Stego: Encode success. Output size:', stegoUint8 ? stegoUint8.length : 'null');

            const stegoBlob = new Blob([stegoUint8], { type: 'image/png' });
            resolve(stegoBlob);

        } catch (err) {
            console.error("Stego Encode Error:", err);
            reject(new Error("Error encoding: " + err.message));
        }
    });
};

export const decodeImage = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const stegoBuffer = await file.arrayBuffer();
            const stegoUint8 = new Uint8Array(stegoBuffer);

            // V2 Decode - Do NOT pass copies
            const decryptedText = await decode(stegoUint8, stegoUint8, {
                version: 'V2',
                transformAlgorithm: 'FFT1D',
                size: 8,
                tolerance: 150, // Match Encode
            });
            console.log('Stego: Decode success. Message:', decryptedText);

            resolve(decryptedText || "NO_HIDDEN_MESSAGE_FOUND");

        } catch (err) {
            console.error("Stego Decode Error:", err);
            resolve(null);
        }
    });
};
