import { useState } from 'react';
import { useRouter } from 'next/router';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getAuth } from 'firebase/auth';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);

interface CheckoutProps {
  planId: string;
  planName: string;
  price: number;
}

export default function Checkout({ planId, planName, price }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/assinaturas');
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId: planId,
          planName,
          price,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sessão de checkout');
      }

      const { sessionId } = await response.json();
      
      // Redirecionar para a página de checkout do Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe não inicializado');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Assinatura {planName}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        R$ {price.toFixed(2)}/mês
      </p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </div>
        ) : (
          'Assinar Agora'
        )}
      </button>
    </div>
  );
} 