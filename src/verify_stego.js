
import { encodeImage, decodeImage } from './utils/image-stego';

async function testImage(name, blobPromise) {
    console.log(`\n🔵 TESTING: ${name} 🔵`);
    try {
        const originalBlob = await blobPromise;
        const SECRET = "pelotita";

        console.log(`   Encoding "${SECRET}"...`);
        const stegoBlob = await encodeImage(originalBlob, SECRET);

        console.log(`   Decoding...`);
        const decodedMessage = await decodeImage(stegoBlob);

        console.log(`   RESULT: "${decodedMessage}"`);

        if (decodedMessage === SECRET) {
            console.log(`✅ ${name}: SUCCESS`);
            return true;
        } else {
            console.error(`❌ ${name}: FAILED (Expected "pelotita", got "${decodedMessage}")`);
            return false;
        }
    } catch (e) {
        console.error(`❌ ${name}: CRASH - ${e.message}`);
        return false;
    }
}

export async function runStegoTest() {
    console.log("🧪 STARTING DUAL STEGO DIAGNOSTIC 🧪");

    // 1. Synthetic Image
    const syntheticPromise = new Promise(resolve => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = 'blue';
        ctx.font = '30px Arial';
        ctx.fillText("TEST", 50, 50);
        canvas.toBlob(resolve, 'image/png');
    });

    const syntheticResult = await testImage("SYNTHETIC_PNG", syntheticPromise);

    // 2. Dog Image
    const dogPromise = fetch('/debug_dog.jpg').then(r => r.blob());
    const dogResult = await testImage("PERRITA_JPG", dogPromise);

    if (syntheticResult && dogResult) {
        window.STEGO_TEST_RESULT = "SUCCESS";
    } else {
        window.STEGO_TEST_RESULT = "FAILED";
        window.STEGO_TEST_DETAILS = { synthetic: syntheticResult, dog: dogResult };
    }
}
