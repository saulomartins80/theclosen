import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  HelpCircle, 
  FileText, 
  Video, 
  Users, 
  Zap,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const SuportePage = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');

  const supportChannels = [
    {
      id: 'chat',
      title: 'Chat ao Vivo',
      description: 'Converse com nossa equipe em tempo real',
      icon: <MessageCircle className="w-6 h-6" />,
      action: () => window.open('https://tawk.to/chat/seu-codigo-tawkto', '_blank'),
      color: 'bg-blue-500'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Atendimento via WhatsApp 24/7',
      icon: <Zap className="w-6 h-6" />,
      action: () => window.open('https://wa.me/5511999999999', '_blank'),
      color: 'bg-green-500'
    },
    {
      id: 'email',
      title: 'E-mail',
      description: 'suporte@seudominio.com.br',
      icon: <Mail className="w-6 h-6" />,
      action: () => window.location.href = 'mailto:suporte@seudominio.com.br',
      color: 'bg-red-500'
    },
    {
      id: 'phone',
      title: 'Telefone',
      description: '0800 123 4567',
      icon: <Phone className="w-6 h-6" />,
      action: () => window.location.href = 'tel:08001234567',
      color: 'bg-purple-500'
    }
  ];

  const faqItems = [
    {
      question: 'Como posso gerenciar minha assinatura?',
      answer: 'Você pode gerenciar sua assinatura através do seu perfil. Acesse "Configurações" > "Assinatura" para ver detalhes, alterar plano ou cancelar.'
    },
    {
      question: 'Quais são os métodos de pagamento aceitos?',
      answer: 'Aceitamos cartões de crédito (Visa, Mastercard, American Express), boleto bancário e PIX.'
    },
    {
      question: 'Como funciona o reembolso?',
      answer: 'Oferecemos reembolso em até 7 dias após a compra. O valor será creditado no mesmo método de pagamento utilizado.'
    },
    {
      question: 'Como posso acessar os recursos premium?',
      answer: 'Após a confirmação do pagamento, todos os recursos premium são automaticamente liberados em sua conta.'
    }
  ];

  const resources = [
    {
      title: 'Base de Conhecimento',
      description: 'Artigos e tutoriais detalhados',
      icon: <FileText className="w-6 h-6" />,
      link: '/base-conhecimento'
    },
    {
      title: 'Vídeos Tutoriais',
      description: 'Aprenda com nossos vídeos explicativos',
      icon: <Video className="w-6 h-6" />,
      link: '/tutoriais'
    },
    {
      title: 'Comunidade',
      description: 'Conecte-se com outros usuários',
      icon: <Users className="w-6 h-6" />,
      link: '/comunidade'
    }
  ];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Head>
        <title>Suporte | Seu App Financeiro</title>
        <meta name="description" content="Central de suporte e ajuda do seu app financeiro" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4"
          >
            <HelpCircle className="mr-2" size={18} />
            <span className="font-medium">Central de Suporte</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Como podemos ajudar?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={`text-lg max-w-2xl mx-auto ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Nossa equipe está pronta para ajudar você a aproveitar ao máximo nossa plataforma.
          </motion.p>
        </div>

        {/* Canais de Suporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {supportChannels.map((channel) => (
            <motion.div
              key={channel.id}
              whileHover={{ y: -5 }}
              className={`p-6 rounded-xl cursor-pointer transition-all ${resolvedTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'}`}
              onClick={channel.action}
            >
              <div className={`w-12 h-12 rounded-lg ${channel.color} flex items-center justify-center mb-4 text-white`}>
                {channel.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{channel.title}</h3>
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {channel.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Horário de Atendimento */}
        <div className={`p-6 rounded-xl mb-16 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-yellow-500 mr-3" />
            <h2 className="text-xl font-semibold">Horário de Atendimento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Suporte Técnico</h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Segunda a Sexta: 8h às 20h<br />
                Sábado: 9h às 15h
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Consultoria Financeira</h3>
              <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Segunda a Sexta: 9h às 18h<br />
                Agendamento prévio necessário
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
              >
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {item.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recursos Adicionais */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Recursos Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5 }}
                className={`p-6 rounded-xl cursor-pointer transition-all ${resolvedTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'}`}
                onClick={() => router.push(resource.link)}
              >
                <div className={`w-12 h-12 rounded-lg ${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                  {resource.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {resource.description}
                </p>
                <div className="mt-4 flex items-center text-blue-500">
                  <span className="text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contato de Emergência */}
        <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
          <div className="flex items-center mb-4">
            <Phone className="w-6 h-6 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold">Contato de Emergência</h2>
          </div>
          <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Para situações urgentes, entre em contato com nossa equipe de suporte prioritário.
          </p>
          <button
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white"
          >
            <Zap className="mr-2" />
            Contato Urgente via WhatsApp
            <ExternalLink className="ml-2 w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default SuportePage; 