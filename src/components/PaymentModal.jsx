import React, { useEffect, useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

const PaymentModal = ({ onClose, onPaymentSuccess }) => {
    const [preferenceId, setPreferenceId] = useState(null);

    useEffect(() => {
        // Initialize Mercado Pago
        initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, {
            locale: 'es-AR'
        });

        // Fetch Preference ID from our Backend
        const createPreference = async () => {
            try {
                const response = await fetch("http://localhost:3000/create_preference", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await response.json();
                if (data.id) {
                    setPreferenceId(data.id);
                }
            } catch (error) {
                console.error("Error fetching preference:", error);
            }
        };

        createPreference();
    }, []);

    const handlePaymentComplete = () => {
        // En producción fiable esto vendría de un webhook, 
        // pero para UX inmediata podemos asumirlo tras el retorno exitoso o usar onPeymentStatusChange del Wallet si fuera necesario.
        // Dado el flujo de redirección, la página se recargará, así que la persistencia debería ser manejada (ej. localStorage o query param)
        // Por ahora mantenemos callback simple por si acaso el Wallet emite evento, aunque Wallet suele redirigir.
        onPaymentSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-matrix-green shadow-[0_0_30px_rgba(0,255,65,0.2)] max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-matrix-green transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-block p-4 border rounded-full border-matrix-green/30 bg-matrix-green/5 mb-4">
                        <CreditCard className="w-12 h-12 text-matrix-green" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">LIMIT_EXCEEDED</h2>
                    <p className="text-gray-400">
                        Free tier allows up to <span className="text-matrix-green font-bold">2 words</span>.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Your message is too long for the secure shadow protocol generic layer.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-matrix-dark/30 p-4 border border-matrix-dark rounded text-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">ITEM:</span>
                            <span className="text-white">UNLIMITED_MESSAGES</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span className="text-gray-400">TOTAL:</span>
                            <span className="text-matrix-green">$ 1.000 ARS</span>
                        </div>
                    </div>

                    {preferenceId ? (
                        <div className="payment-container">
                            <Wallet
                                initialization={{ preferenceId: preferenceId }}
                                customization={{ texts: { valueProp: 'security_details' } }}
                            />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 animate-pulse">
                            Loading secure payment gateway...
                        </div>
                    )}

                    <p className="text-[10px] text-center text-gray-600 mt-4">
                        INTEGRATION ACTIVE: {import.meta.env.VITE_MP_PUBLIC_KEY ? 'YES' : 'NO'} <br />
                        SECURE PAYMENTS BY MERCADO PAGO // ENCRYPTED TRANSACTION
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
