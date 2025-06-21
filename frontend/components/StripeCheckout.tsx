import React, { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import { ChevronLeft } from 'lucide-react';

// Inicializa o Stripe com a chave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);

interface StripeCheckoutProps {
  priceId: string;
  planName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StripeCheckout({ priceId, planName, onSuccess, onCancel }: StripeCheckoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const token = await currentUser.getIdToken();

      const { sessionId } = await subscriptionAPI.createCheckoutSession(priceId, planName);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe não inicializado');

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      onCancel?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <button
        onClick={() => router.push('/assinaturas')}
        className="mb-6 flex items-center text-purple-600 hover:text-purple-700"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Voltar para planos
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Assinatura {planName}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Você será redirecionado para a página de pagamento do Stripe.
        </p>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Continuar para Pagamento'}
        </button>
      </div>
    </div>
  );
} 