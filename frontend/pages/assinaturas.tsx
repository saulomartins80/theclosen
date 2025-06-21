import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { subscriptionAPI } from '../services/api';
import getStripe from '../lib/stripe';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle, Star, Gem, Rocket, Shield, TrendingUp, Crown, Lightbulb, Handshake, ChevronLeft, User, Calendar, CreditCard } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import Checkout from '../components/Checkout';
import StripeCheckout from '../components/StripeCheckout';

const SubscriptionPage = () => {
  const { user, subscription, loadingSubscription } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<{
    priceId: string;
    planName: string;
  } | null>(null);

  const plans = {
    monthly: [
      {
        id: 'essencial',
        name: 'Plano Essencial',
        price: 'R$ 29,90',
        monthlyEquivalent: 'R$ 29,90/mês',
        priceId: 'price_1RZ1JOQgQT6xG1Ui6BArqfvI',
        features: [
          'Acesso completo ao Ebook',
          'Dashboard financeiro premium',
          'Metas e transações ilimitadas',
          'Suporte via email prioritário',
          'Relatórios mensais detalhados'
        ],
        icon: <TrendingUp className="text-blue-500" />,
        recommended: false
      },
      {
        id: 'top',
        name: 'Plano Top',
        price: 'R$ 69,90',
        monthlyEquivalent: 'R$ 69,90/mês',
        priceId: 'price_1RZ1N8QgQT6xG1UiHOQBphEl',
        features: [
          'Todos os benefícios do Essencial',
          'Consultoria com IA Financeira',
          'Análises de mercado avançadas',
          'Suporte prioritário 24/7',
          'Acesso a webinars exclusivos',
          'Cashback de até 5%'
        ],
        icon: <Gem className="text-purple-500" />,
        recommended: true
      }
    ],
    annual: [
      {
        id: 'essencial-anual',
        name: 'Plano Essencial Anual',
        price: 'R$ 299,90',
        monthlyEquivalent: 'R$ 24,99/mês',
        priceId: 'price_1RZ1PJQgQT6xG1UiSDUY4O2w',
        features: [
          'Acesso completo ao Ebook',
          'Dashboard financeiro premium',
          'Metas e transações ilimitadas',
          'Suporte via email prioritário',
          'Relatórios mensais detalhados',
          '2 meses de desconto'
        ],
        icon: <Shield className="text-green-500" />,
        recommended: false
      },
      {
        id: 'top-anual',
        name: 'Plano Top Anual',
        price: 'R$ 699,00',
        monthlyEquivalent: 'R$ 58,25/mês',
        priceId: 'price_1RZ1QrQgQT6xG1UiiWivLEva',
        features: [
          'Todos os benefícios do Essencial',
          'Consultoria com IA Financeira',
          'Análises de mercado avançadas',
          'Suporte prioritário 24/7',
          'Acesso a webinars exclusivos',
          'Cashback de até 5%',
          '2 meses de desconto'
        ],
        icon: <Crown className="text-yellow-500" />,
        recommended: true
      }
    ]
  };

  const featuresComparison = [
    {
      name: 'Acesso completo ao Ebook',
      plans: [true, true, true, true]
    },
    {
      name: 'Dashboard financeiro premium',
      plans: [true, true, true, true]
    },
    {
      name: 'Metas e transações ilimitadas',
      plans: [true, true, true, true]
    },
    {
      name: 'Suporte via email prioritário',
      plans: [true, true, true, true]
    },
    {
      name: 'Relatórios mensais detalhados',
      plans: [true, true, true, true]
    },
    {
      name: 'Consultoria com IA Financeira',
      plans: [false, true, false, true]
    },
    {
      name: 'Análises de mercado avançadas',
      plans: [false, true, false, true]
    },
    {
      name: 'Suporte prioritário 24/7',
      plans: [false, true, false, true]
    },
    {
      name: 'Acesso a webinars exclusivos',
      plans: [false, true, false, true]
    },
    {
      name: 'Cashback de até 5%',
      plans: [false, true, false, true]
    },
    {
      name: 'Economia com plano anual',
      plans: [false, false, true, true]
    }
  ];

  const handleSubscription = async (priceId: string, planName: string) => {
    if (!user) {
      router.replace('/auth/login?redirect=/assinaturas');
      return;
    }

    try {
      setIsLoading(priceId);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const token = await currentUser.getIdToken();

      const { sessionId } = await subscriptionAPI.createCheckoutSession(priceId, planName);

      const stripe = await getStripe();
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
    } finally {
      setIsLoading(null);
    }
  };

  // Função para obter o nome do plano atual
  const getCurrentPlanName = () => {
    if (!subscription) return 'Nenhum plano ativo';
    
    const planMap: Record<string, string> = {
      'essencial': 'Plano Essencial',
      'top': 'Plano Top',
      'essencial-anual': 'Plano Essencial Anual',
      'top-anual': 'Plano Top Anual'
    };
    
    return planMap[subscription.plan || ''] || subscription.plan || 'Plano Ativo';
  };

  // Função para obter o status do plano
  const getPlanStatus = () => {
    if (!subscription) return 'Nenhum plano ativo';
    
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'canceled': 'Cancelado',
      'expired': 'Expirado',
      'pending': 'Pendente',
      'trialing': 'Teste Gratuito',
      'past_due': 'Pagamento Pendente'
    };
    
    return statusMap[subscription.status || ''] || subscription.status || 'Desconhecido';
  };

  // Função para verificar se o usuário tem um plano ativo
  const hasActivePlan = () => {
    return subscription && subscription.status === 'active';
  };

  if (selectedPlan) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedPlan(null)}
              className="mb-6 flex items-center text-purple-600 hover:text-purple-700"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Voltar para planos
            </button>
            <StripeCheckout
              priceId={selectedPlan.priceId}
              planName={selectedPlan.planName}
              onSuccess={() => {
                toast.success('Pagamento processado com sucesso!');
                router.push('/payment/sucesso');
              }}
              onCancel={() => {
                setSelectedPlan(null);
                toast.error('Pagamento cancelado');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Head>
        <title>Assinaturas Premium | Meus Investimentos</title>
        <meta name="description" content="Escolha o plano premium que melhor atende suas necessidades financeiras" />
      </Head>

      <ToastContainer />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Escolha seu Plano
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Desbloqueie todo o potencial da sua jornada financeira com nossos planos premium
          </motion.p>
        </div>

        {/* Current Plan Status */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-md mx-auto mb-8 p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-blue-200'} shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-medium">Seu Plano Atual</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {getPlanStatus()}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{getCurrentPlanName()}</h3>
            
            {subscription.expiresAt && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                Vence em: {new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}
              </div>
            )}
            
            {hasActivePlan() && (
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar Assinatura
                </button>
              </div>
            )}
            
            {!hasActivePlan() && (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Você não possui um plano ativo. Escolha um dos planos abaixo para começar:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                  >
                    Ver Planos Mensais
                  </button>
                  <button
                    onClick={() => setActiveTab('annual')}
                    className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
                  >
                    Ver Planos Anuais
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className={`inline-flex rounded-lg p-1 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'monthly' ? (resolvedTheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow') : (resolvedTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setActiveTab('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'annual' ? (resolvedTheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow') : (resolvedTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans[activeTab].map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`relative rounded-2xl p-8 ${
                resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg border-2 ${
                plan.recommended ? 'border-purple-500' : 'border-transparent'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Recomendado
                  </span>
                </div>
              )}

              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-4">
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.monthlyEquivalent}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscription(plan.priceId, plan.name)}
                disabled={isLoading === plan.priceId}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.recommended
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {isLoading === plan.priceId ? 'Processando...' : 'Assinar Agora'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Comparação Completa de Planos</h2>
          
          <div className={`rounded-xl overflow-hidden shadow-sm ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="grid grid-cols-5 gap-0">
              {/* Header */}
              <div className={`p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border-b border-gray-200 dark:border-gray-700`}>
                <h3 className="font-medium">Recursos</h3>
              </div>
              <div className={`p-4 text-center ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border-b border-gray-200 dark:border-gray-700`}>
                <h3 className="font-medium">Essencial</h3>
              </div>
              <div className={`p-4 text-center ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border-b border-gray-200 dark:border-gray-700`}>
                <h3 className="font-medium">Top</h3>
              </div>
              <div className={`p-4 text-center ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border-b border-gray-200 dark:border-gray-700`}>
                <h3 className="font-medium">Essencial Anual</h3>
              </div>
              <div className={`p-4 text-center ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border-b border-gray-200 dark:border-gray-700`}>
                <h3 className="font-medium">Top Anual</h3>
              </div>

              {/* Rows */}
              {featuresComparison.map((feature, index) => (
                <div key={index} className="contents">
                  <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex items-center ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    {feature.name}
                  </div>
                  {feature.plans.map((included, planIndex) => (
                    <div key={planIndex} className={`p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                      {included ? (
                        <CheckCircle className={`${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} size={18} />
                      ) : (
                        <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          
          <div className="space-y-4">
            <div className={`rounded-lg p-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <Lightbulb className="mr-2 text-yellow-500" size={18} />
                Posso mudar de plano depois?
              </h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Sim, você pode atualizar ou downgrade seu plano a qualquer momento. A diferença de valor será prorrateada e ajustada na próxima fatura.
              </p>
            </div>

            <div className={`rounded-lg p-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <Handshake className="mr-2 text-blue-500" size={18} />
                Existe período de cancelamento?
              </h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Oferecemos 7 dias de garantia incondicional. Se você não estiver satisfeito, devolvemos 100% do seu dinheiro sem questionamentos.
              </p>
            </div>

            <div className={`rounded-lg p-6 ${resolvedTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <Shield className="mr-2 text-green-500" size={18} />
                Meus dados estão seguros?
              </h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados financeiros nunca são compartilhados com terceiros.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;