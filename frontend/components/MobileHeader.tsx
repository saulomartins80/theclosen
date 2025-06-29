import React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Menu, Bell, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface MobileHeaderProps {
  title: string;
  onMenuToggle?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  onMenuToggle, 
  showBackButton = false,
  onBack 
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Lado esquerdo */}
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>
          ) : (
            onMenuToggle && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMenuToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu size={20} />
              </motion.button>
            )
          )}
          
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>

        {/* Lado direito - Notificações e Perfil */}
        <div className="flex items-center space-x-2">
          {/* Notificações */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Bell size={20} />
            {/* Badge de notificação */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </motion.button>
          
          {/* Configurações */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/configuracoes')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings size={20} />
          </motion.button>
          
          {/* Perfil do usuário */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/profile')}
            className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <User size={14} />
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {user?.name?.split(' ')[0] || 'Perfil'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileHeader; 