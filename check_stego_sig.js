
import * as stego from '@masknet/stego-js';
console.log('Encode args:', stego.encode.length);
// Try to call with empty args to see error message which often hints args
try {
    stego.encode();
} catch (e) {
    console.log('Error hint:', e.message);
}
