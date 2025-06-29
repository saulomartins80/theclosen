import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart2, 
  Target, 
  DollarSign,
  MessageCircle,
  Menu,
  User,
  Plus,
  X,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileNavigationProps {
  onChatToggle: () => void;
  isChatOpen: boolean;
  onSidebarToggle: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  onChatToggle, 
  isChatOpen, 
  onSidebarToggle 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [showActionMenu, setShowActionMenu] = useState(false);

  const isActive = (path: string) => router.pathname === path;

  // Determina qual ação mostrar baseado na página atual
  const getCurrentAction = () => {
    if (isActive('/metas')) {
      return {
        icon: Target,
        label: 'Nova Meta',
        action: () => router.push('/metas?action=new'),
        color: 'from-green-500 to-green-600',
        pulse: true
      };
    }
    if (isActive('/investimentos')) {
      return {
        icon: DollarSign,
        label: 'Novo Investimento',
        action: () => {
          // Abre o formulário diretamente na página de investimentos
          router.push('/investimentos?action=new');
        },
        color: 'from-purple-500 to-purple-600',
        pulse: true
      };
    }
    if (isActive('/transacoes')) {
      return {
        icon: BarChart2,
        label: 'Nova Transação',
        action: () => router.push('/transacoes?action=new'),
        color: 'from-blue-500 to-blue-600',
        pulse: true
      };
    }
    // Página padrão (dashboard ou outras)
    return {
      icon: Plus,
      label: 'Adicionar',
      action: () => setShowActionMenu(!showActionMenu),
      color: 'from-blue-500 via-purple-500 to-purple-600',
      pulse: false
    };
  };

  const currentAction = getCurrentAction();
  const ActionIcon = currentAction.icon;

  const actionItems = [
    { 
      label: 'Nova Transação', 
      action: () => router.push('/transacoes?action=new'),
      icon: BarChart2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      x: -90,
      y: -40
    },
    { 
      label: 'Nova Meta', 
      action: () => router.push('/metas?action=new'),
      icon: Target,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      x: -20,
      y: -60
    },
    { 
      label: 'Novo Investimento', 
      action: () => router.push('/investimentos?action=new'),
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      x: 50,
      y: -40
    },
  ];

  const handleCenterButtonClick = () => {
    if (currentAction.pulse) {
      // Se está em uma página específica, executa a ação direta
      currentAction.action();
    } else {
      // Se está no dashboard, abre o menu de ações
      setShowActionMenu(!showActionMenu);
    }
  };

  return (
    <>
      {/* Navegação inferior fixa */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu esquerdo - Menu (sidebar) e Ebook */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSidebarToggle}
              className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                isActive('/dashboard') 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Menu size={20} />
              <span className="text-xs font-medium">Menu</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/ebook')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                isActive('/ebook') 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <BookOpen size={20} />
              <span className="text-xs font-medium">E-book</span>
            </motion.button>
          </div>

          {/* Botão central dinâmico */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCenterButtonClick}
              className={`w-16 h-16 bg-gradient-to-r ${currentAction.color} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ring-4 ring-white dark:ring-gray-900 ${
                currentAction.pulse ? 'animate-pulse' : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {showActionMenu ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 45 }}
                    exit={{ rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={28} className="text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="action"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ActionIcon size={28} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Menu de ações em arco-íris horizontal */}
            <AnimatePresence>
              {showActionMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
                >
                  {/* Container do arco-íris horizontal */}
                  <div className="relative w-0 h-16">
                    {/* Botões em arco-íris horizontal */}
                    {actionItems.map((item, index) => (
                      <motion.button
                        key={item.label}
                        initial={{ 
                          opacity: 0, 
                          scale: 0,
                          x: item.x,
                          y: item.y
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          x: item.x,
                          y: item.y
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0,
                          x: item.x,
                          y: 0
                        }}
                        transition={{ 
                          delay: index * 0.1, 
                          duration: 0.3,
                          type: "spring",
                          stiffness: 200
                        }}
                        onClick={() => {
                          item.action();
                          setShowActionMenu(false);
                        }}
                        className={`absolute w-12 h-12 ${item.bgColor} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) translateX(${item.x}px) translateY(${item.y}px)`
                        }}
                      >
                        <item.icon size={20} className="text-white" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Menu direito - Metas e Chat */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/metas')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                isActive('/metas') 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Target size={20} />
              <span className="text-xs font-medium">Metas</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onChatToggle}
              className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                isChatOpen 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <MessageCircle size={20} />
              <span className="text-xs font-medium">Chat</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Overlay para fechar menu de ações */}
      <AnimatePresence>
        {showActionMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowActionMenu(false)}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Espaçamento para o conteúdo não ficar atrás da navegação */}
      <div className="h-24 md:hidden" />

      {/* Botão de perfil flutuante */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/profile')}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 md:hidden"
      >
        <User size={20} className="text-white" />
      </motion.button>
    </>
  );
};

export default MobileNavigation;