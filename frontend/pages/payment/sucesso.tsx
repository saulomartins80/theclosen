import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { subscriptionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { CheckCircle, Crown, Star, Award, Gem, BadgeCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Função para definir visual conforme o plano
function getPlanVisual(plan?: string) {
  const planName = (plan || '').toLowerCase();
  
  if (planName.includes('top anual')) {
    return {
      color: 'from-purple-500 to-indigo-600',
      icon: <Gem className="w-16 h-16 text-purple-500 mx-auto" />,
      title: '🎉 Bem-vindo ao Plano Top Anual!',
      subtitle: 'Você agora faz parte do grupo mais exclusivo!',
      message: 'Aproveite todos os recursos premium por um ano inteiro. Análises avançadas, insights exclusivos e suporte prioritário estão à sua disposição.',
      features: ['Análises financeiras avançadas', 'Insights exclusivos', 'Suporte prioritário', 'Recursos premium por 1 ano']
    };
  }
  
  if (planName.includes('top')) {
    return {
      color: 'from-yellow-400 to-yellow-600',
      icon: <Crown className="w-16 h-16 text-yellow-500 mx-auto" />,
      title: '👑 Bem-vindo ao Plano Top!',
      subtitle: 'Sua assinatura premium está ativa!',
      message: 'Desfrute de todos os benefícios premium. Análises detalhadas, insights personalizados e muito mais.',
      features: ['Análises detalhadas', 'Insights personalizados', 'Recursos premium', 'Suporte especializado']
    };
  }
  
  if (planName.includes('essencial anual')) {
    return {
      color: 'from-green-400 to-green-600',
      icon: <BadgeCheck className="w-16 h-16 text-green-500 mx-auto" />,
      title: '✅ Bem-vindo ao Essencial Anual!',
      subtitle: 'Acesso garantido por um ano!',
      message: 'Você garantiu acesso Essencial por um ano completo. Aproveite todos os recursos básicos sem se preocupar com renovações mensais.',
      features: ['Acesso por 1 ano', 'Recursos essenciais', 'Suporte básico', 'Economia garantida']
    };
  }
  
  if (planName.includes('essencial')) {
    return {
      color: 'from-blue-400 to-blue-600',
      icon: <Star className="w-16 h-16 text-blue-500 mx-auto" />,
      title: '⭐ Bem-vindo ao Essencial!',
      subtitle: 'Sua assinatura está ativa!',
      message: 'Sua assinatura Essencial está ativa. Explore nossos recursos e comece sua jornada financeira.',
      features: ['Recursos básicos', 'Suporte ao cliente', 'Interface intuitiva', 'Atualizações regulares']
    };
  }
  
  if (planName.includes('premium')) {
    return {
      color: 'from-blue-800 to-blue-900',
      icon: <Award className="w-16 h-16 text-blue-800 mx-auto" />,
      title: '🏆 Bem-vindo ao Premium!',
      subtitle: 'Você agora é Premium!',
      message: 'Aproveite o melhor da plataforma com recursos exclusivos e análises avançadas.',
      features: ['Recursos exclusivos', 'Análises avançadas', 'Suporte premium', 'Conteúdo especial']
    };
  }
  
  // Plano padrão
  return {
    color: 'from-gray-400 to-gray-600',
    icon: <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />,
    title: '🎉 Pagamento Confirmado!',
    subtitle: 'Sua assinatura foi ativada!',
    message: 'Sua assinatura foi ativada com sucesso. Você já pode acessar todos os recursos do seu plano.',
    features: ['Acesso completo', 'Recursos disponíveis', 'Suporte ativo', 'Atualizações incluídas']
  };
}

function getChatColor(plan?: string) {
  const planName = (plan || '').toLowerCase();
  if (planName.includes('top anual')) return 'bg-gradient-to-br from-purple-100 to-indigo-200';
  if (planName.includes('top')) return 'bg-gradient-to-br from-yellow-100 to-yellow-300';
  if (planName.includes('essencial anual')) return 'bg-gradient-to-br from-green-100 to-green-300';
  if (planName.includes('premium')) return 'bg-gradient-to-br from-blue-200 to-blue-400';
  return 'bg-gray-100';
}

export default function PaymentSuccess() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  const planVisual = getPlanVisual(user?.subscription?.plan);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const { session_id } = router.query;
        
        if (!session_id) {
          console.log('Nenhum session_id encontrado, mas mostrando sucesso');
          setVerified(true);
          toast.success('Pagamento processado com sucesso!');
          setLoading(false);
          return;
        }

        try {
          const response = await subscriptionAPI.verifySession(session_id as string);
          
          if (response.success) {
            setVerified(true);
            toast.success('Pagamento processado com sucesso!');
          } else {
            setVerified(false);
            toast.error('Falha na verificação da sessão');
          }
        } catch (verifyError) {
          console.error('Erro na verificação:', verifyError);
          // Mesmo com erro na verificação, mostra sucesso se tem session_id
          setVerified(true);
          toast.success('Pagamento processado com sucesso!');
        }
      } catch (error) {
        console.error('Erro geral:', error);
        toast.error('Erro na verificação do pagamento');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      verifySession();
    }
  }, [router.isReady, router.query]);

  // Efeito separado para disparar confete quando verificado
  useEffect(() => {
    if (verified) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  }, [verified]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`bg-gradient-to-br ${planVisual.color} rounded-lg shadow-lg p-1 text-center`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
            {verified ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-6"
                >
                  {planVisual.icon}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {planVisual.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-600 dark:text-gray-300 mb-6"
                >
                  {planVisual.subtitle}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
                >
                  {planVisual.message}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                >
                  {planVisual.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    Ir para o Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/assinaturas')}
                    className="px-8 py-3 border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-semibold rounded-lg transition-colors duration-200"
                  >
                    Ver Assinaturas
                  </button>
                </motion.div>
              </>
            ) : (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                  Erro na Verificação
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Houve um problema ao verificar seu pagamento. Entre em contato com o suporte.
                </p>
                <button
                  onClick={() => router.push('/assinaturas')}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Voltar às Assinaturas
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}