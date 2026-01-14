import React, { useState, useEffect } from 'react';
import { encodeText, decodeText } from '../utils/text-stego';
import { Copy, X } from 'lucide-react'; // Removing unused Plus, adding X just in case or we rely on PaymentModal's internal Lucide
import PaymentModal from './PaymentModal';
// I'll stick to text to avoid installing lucide-react if I didn't plan it, but I can add it easily or use SVGs.
// Let's use simple SVG icons inline to be safe and fast.

const TextHider = () => {
    const [mode, setMode] = useState('encode'); // 'encode' | 'decode'

    // Encode State
    const [publicText, setPublicText] = useState('');
    const [secretMessage, setSecretMessage] = useState('');
    const [encodedResult, setEncodedResult] = useState('');

    // Decode State
    const [textToDecode, setTextToDecode] = useState('');
    const [decodedResult, setDecodedResult] = useState('');

    // Monetization
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        // Check for Mercado Pago return query
        const query = new URLSearchParams(window.location.search);
        const status = query.get('status');

        if (status === 'approved' || status === 'pending' || status === 'in_process') {
            const savedPublic = localStorage.getItem('pending_public_text');
            const savedSecret = localStorage.getItem('pending_secret_message');

            if (savedPublic && savedSecret) {
                setPublicText(savedPublic);
                setSecretMessage(savedSecret);

                // Execute encoding immediately
                encodeText(savedPublic, savedSecret)
                    .then(result => {
                        setEncodedResult(result);
                        // Clean up
                        localStorage.removeItem('pending_public_text');
                        localStorage.removeItem('pending_secret_message');
                        window.history.replaceState({}, document.title, window.location.pathname);
                        showToast("PAYMENT_ACCEPTED // MESSAGE_GENERATED");
                    })
                    .catch(err => {
                        console.error(err);
                        showToast("ERROR // ENCODING_FAILED");
                    });
            }
        }
    }, []);

    const countWords = (str) => {
        return str.trim().split(/\s+/).filter(w => w.length > 0).length;
    };

    const handleEncode = async () => {
        if (!publicText || !secretMessage) return;

        const wordCount = countWords(secretMessage);

        // Check App Mode (free vs payment)
        const appMode = import.meta.env.VITE_APP_MODE || 'payment';

        if (wordCount > 2 && appMode !== 'free') {
            // Save draft before redirecting/paying
            localStorage.setItem('pending_public_text', publicText);
            localStorage.setItem('pending_secret_message', secretMessage);
            setShowPaymentModal(true);
            return;
        }

        try {
            const result = await encodeText(publicText, secretMessage);
            setEncodedResult(result);
        } catch (error) {
            console.error(error);
            alert(error.message);
            showToast(`ERROR: ${error.message}`);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        // Automatically retry encoding
        setTimeout(() => {
            encodeText(publicText, secretMessage).then(setEncodedResult);
        }, 100);
    };

    const handleDecode = async () => {
        if (!textToDecode) return;
        const result = await decodeText(textToDecode);
        setDecodedResult(result || 'NO_HIDDEN_MESSAGE_FOUND_OR_DECRYPTION_FAILED');
    };

    const [notification, setNotification] = useState({ show: false, message: '' });

    const showToast = (msg) => {
        setNotification({ show: true, message: msg });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast("DATA_COPIED_TO_CLIPBOARD");
    };

    const clearEncode = () => {
        setPublicText('');
        setSecretMessage('');
        setEncodedResult('');
    };

    const clearDecode = () => {
        setTextToDecode('');
        setDecodedResult('');
    };

    return (
        <div className="space-y-6 relative">
            {/* Custom Matrix Toast Notification */}
            {notification.show && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-black/90 border border-matrix-green px-6 py-3 rounded shadow-[0_0_15px_rgba(0,255,65,0.3)] flex items-center gap-3">
                        <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse" />
                        <span className="text-matrix-green font-bold tracking-wider">{notification.message}</span>
                    </div>
                </div>
            )}

            <div className="flex gap-4 border-b border-matrix-dark pb-4">
                <button
                    onClick={() => setMode('encode')}
                    className={`text-sm hover:text-matrix-green ${mode === 'encode' ? 'text-matrix-green underline' : 'text-gray-500'}`}
                >
                    &gt; ENCODE_MESSAGE
                </button>
                <button
                    onClick={() => setMode('decode')}
                    className={`text-sm hover:text-matrix-green ${mode === 'decode' ? 'text-matrix-green underline' : 'text-gray-500'}`}
                >
                    &gt; DECODE_MESSAGE
                </button>
            </div>

            {mode === 'encode' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Public Text (The Cover)</label>
                        <textarea
                            className="w-full bg-black border border-matrix-dark p-3 text-white focus:border-matrix-green focus:outline-none focus:ring-1 focus:ring-matrix-green transition-all"
                            rows={3}
                            placeholder="e.g. Lista del supermercado..."
                            value={publicText}
                            onChange={(e) => setPublicText(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Secret Message</label>
                        <textarea
                            className="w-full bg-black border border-matrix-dark p-3 text-matrix-green focus:border-matrix-green focus:outline-none focus:ring-1 focus:ring-matrix-green transition-all"
                            rows={2}
                            placeholder="e.g. Nos vemos a las 10"
                            value={secretMessage}
                            onChange={(e) => setSecretMessage(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleEncode}
                            disabled={!publicText || !secretMessage}
                            className="flex-1 bg-matrix-dark hover:bg-matrix-green text-matrix-green hover:text-black py-3 border border-matrix-green transition-colors uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            INITIALIZE_ENCODING
                        </button>
                        <button
                            onClick={clearEncode}
                            className="px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase font-bold text-xs"
                            title="CLEAR_ALL"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {encodedResult && (
                        <div className="mt-6 p-4 border border-matrix-green bg-matrix-green/5 relative group">
                            <label className="absolute -top-3 left-2 bg-black px-2 text-xs text-matrix-green">RESULT_GENERATED</label>
                            <p className="font-sans text-gray-300 mb-2 whitespace-pre-wrap">{encodedResult}</p>
                            <div className="text-right">
                                <button
                                    onClick={() => copyToClipboard(encodedResult)}
                                    className="text-xs border border-matrix-green px-3 py-1 hover:bg-matrix-green hover:text-black transition-colors"
                                >
                                    COPY_TO_CLIPBOARD
                                </button>
                            </div>
                            <p className="mt-2 text-[10px] text-gray-500 text-center">
                                * Looks identical, but contains hidden data. Paste in WhatsApp/Telegram.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Paste Suspicious Text</label>
                        <textarea
                            className="w-full bg-black border border-matrix-dark p-3 text-white focus:border-matrix-green focus:outline-none focus:ring-1 focus:ring-matrix-green transition-all"
                            rows={4}
                            placeholder="Paste the text here..."
                            value={textToDecode}
                            onChange={(e) => setTextToDecode(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDecode}
                            disabled={!textToDecode}
                            className="flex-1 bg-matrix-dark hover:bg-matrix-green text-matrix-green hover:text-black py-3 border border-matrix-green transition-colors uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            EXTRACT_HIDDEN_DATA
                        </button>
                        <button
                            onClick={clearDecode}
                            className="px-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase font-bold text-xs"
                            title="CLEAR_ALL"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {decodedResult && (
                        <div className="mt-6 p-4 border border-matrix-green bg-matrix-green/10">
                            <h3 className="text-xs uppercase text-gray-400 mb-2">Decrypted_Payload:</h3>
                            <p className="text-lg text-matrix-green font-bold">{decodedResult}</p>
                        </div>
                    )}
                </div>
            )}

            {showPaymentModal && (
                <PaymentModal
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default TextHider;
