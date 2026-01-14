import React from 'react';
import TextHider from './components/TextHider';
import MatrixRain from './components/MatrixRain';

function App() {
  return (
    <div className="min-h-screen text-matrix-green p-4 font-mono selection:bg-matrix-green selection:text-black relative overflow-hidden">
      <MatrixRain />
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-8 text-center border-b border-matrix-dark pb-4">
          <h1 className="text-4xl font-bold tracking-tighter animate-pulse mb-2">
            MENSAJE_ESCONDIDO_V1.0
          </h1>
          <p className="text-sm text-gray-400">
            SECURE_COMMUNICATION_PROTOCOL // STEGANOGRAPHY_SUITE
          </p>
        </header>

        <main className="bg-black/50 border border-matrix-dark p-6 rounded-sm shadow-[0_0_15px_rgba(0,255,65,0.1)] backdrop-blur-sm">
          <TextHider />
        </main>

        <footer className="mt-12 text-center text-xs text-matrix-dark">
          SYSTEM_STATUS: ONLINE | ENCRYPTION: AES-GCM (Key: Last Word)
        </footer>
      </div>
    </div>
  );
}

export default App;
