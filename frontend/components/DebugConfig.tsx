import { useState } from 'react';

export default function DebugConfig() {
  const [showDebug, setShowDebug] = useState(false);

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  const stripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUB_KEY,
    apiUrl: process.env.NEXT_PUBLIC_API_URL
  };

  const missingFirebaseVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  const missingStripeVars = Object.entries(stripeConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        Debug Config
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md">
          <h3 className="font-bold mb-2">Configuração Debug</h3>
          
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Firebase:</h4>
            {missingFirebaseVars.length > 0 ? (
              <div className="text-red-600 text-xs">
                <p>❌ Faltando: {missingFirebaseVars.join(', ')}</p>
              </div>
            ) : (
              <div className="text-green-600 text-xs">
                <p>✅ Todas configuradas</p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-sm">Stripe:</h4>
            {missingStripeVars.length > 0 ? (
              <div className="text-red-600 text-xs">
                <p>❌ Faltando: {missingStripeVars.join(', ')}</p>
              </div>
            ) : (
              <div className="text-green-600 text-xs">
                <p>✅ Todas configuradas</p>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600">
            <p>API URL: {stripeConfig.apiUrl || 'Não configurado'}</p>
            <p>Firebase Project: {firebaseConfig.projectId || 'Não configurado'}</p>
          </div>

          <button
            onClick={() => setShowDebug(false)}
            className="mt-2 text-xs text-blue-600 underline"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
} 