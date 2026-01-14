import React, { useState, useRef } from 'react';
import { encodeImage, decodeImage } from '../utils/image-stego';

const ImageHider = () => {
    const [mode, setMode] = useState('encode');

    // Encode
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [secretMessage, setSecretMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState('');

    // Decode
    const [decodeFile, setDecodeFile] = useState(null);
    const [decodeResult, setDecodeResult] = useState(null);

    const fileInputRef = useRef(null);
    const decodeInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setResultImage(null);
            setError('');
        }
    };

    const handleEncode = async () => {
        if (!selectedFile || !secretMessage) return;
        setProcessing(true);
        setError('');
        try {
            const blob = await encodeImage(selectedFile, secretMessage);
            const url = URL.createObjectURL(blob);
            setResultImage(url);
        } catch (err) {
            setError(err.message || 'Error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const downloadImage = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `MENSAJE_OCULTO_${Date.now()}.png`; // Forced filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDecodeFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setDecodeFile(file);
        setProcessing(true);
        setDecodeResult(null);
        try {
            const result = await decodeImage(file);
            setDecodeResult(result || 'NO_HIDDEN_MESSAGE_DETECTED');
        } catch (err) {
            setDecodeResult('ERROR: FAULTY_IMAGE_OR_FORMAT');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-matrix-dark pb-4">
                <button
                    onClick={() => setMode('encode')}
                    className={`text-sm hover:text-matrix-green ${mode === 'encode' ? 'text-matrix-green underline' : 'text-gray-500'}`}
                >
                    &gt; HIDE_IN_IMAGE
                </button>
                <button
                    onClick={() => setMode('decode')}
                    className={`text-sm hover:text-matrix-green ${mode === 'decode' ? 'text-matrix-green underline' : 'text-gray-500'}`}
                >
                    &gt; READ_FROM_IMAGE
                </button>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-800/50 p-3 text-yellow-500 text-xs mb-4 text-center">
                ⚠️ ATENCIÓN: Al enviar por WhatsApp, debes seleccionar <strong>"Documento"</strong>.
                Si envías como "Foto", la compresión borrará el mensaje.
            </div>

            {mode === 'encode' ? (
                <div className="space-y-4">
                    {/* File Input */}
                    <div
                        className="border-2 border-dashed border-matrix-dark hover:border-matrix-green p-8 text-center cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto object-contain" />
                        ) : (
                            <div className="text-gray-500">
                                <p>CLICK_TO_UPLOAD_IMAGE</p>
                                <p className="text-[10px] mt-2">JPG / PNG accepted</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <textarea
                            className="w-full bg-black border border-matrix-dark p-3 text-matrix-green focus:border-matrix-green focus:outline-none transition-all"
                            rows={2}
                            placeholder="Secret message to hide..."
                            value={secretMessage}
                            onChange={(e) => setSecretMessage(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleEncode}
                        disabled={!selectedFile || !secretMessage || processing}
                        className="w-full bg-matrix-dark hover:bg-matrix-green text-matrix-green hover:text-black py-3 border border-matrix-green transition-colors uppercase font-bold disabled:opacity-50"
                    >
                        {processing ? 'ENCODING...' : 'INJECT_DATA_INTO_IMAGE'}
                    </button>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    {resultImage && (
                        <div className="mt-6 p-4 border border-matrix-green bg-matrix-green/5 text-center space-y-4">
                            <label className="text-xs uppercase text-matrix-green">STEGANOGRAPHY_COMPLETE</label>
                            <img src={resultImage} alt="Result" className="max-h-60 mx-auto border border-matrix-dark" />
                            <button
                                onClick={downloadImage}
                                className="inline-block bg-matrix-green text-black px-6 py-2 font-bold hover:bg-white transition-colors uppercase"
                            >
                                DOWNLOAD_IMAGE_CLARIN_MIE
                            </button>
                            <p className="text-xs text-gray-400">Format: PNG (Lossless)</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div
                        className="border-2 border-dashed border-matrix-dark hover:border-matrix-green p-8 text-center cursor-pointer transition-colors"
                        onClick={() => decodeInputRef.current.click()}
                    >
                        <input type="file" ref={decodeInputRef} onChange={handleDecodeFileSelect} className="hidden" accept="image/*" />
                        <div className="text-gray-500">
                            <p>UPLOAD_IMAGE_TO_DECODE</p>
                        </div>
                    </div>

                    {processing && <p className="text-center text-matrix-green animate-pulse">ANALYZING_PIXELS...</p>}

                    {decodeResult && (
                        <div className="mt-6 p-4 border border-matrix-green bg-matrix-green/10">
                            <h3 className="text-xs uppercase text-gray-400 mb-2">Extracted_Data:</h3>
                            {decodeResult.startsWith('data:image') ? (
                                <div className="bg-white p-2 rounded">
                                    <img src={decodeResult} alt="Decoded Secret" className="max-w-full" />
                                </div>
                            ) : (
                                <p className="text-lg text-matrix-green font-bold break-all">{decodeResult}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageHider;
