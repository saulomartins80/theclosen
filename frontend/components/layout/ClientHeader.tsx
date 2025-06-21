'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiTrendingUp } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';

export function ClientHeader() {
  const router = useRouter();
  const { t } = useTranslation('common');
  
  const menuItems = [
    { name: 'Recursos', path: '/recursos' },
    { name: 'Soluções', path: '/solucoes' },
    { name: 'Preços', path: '/precos' },
    { name: 'Clientes', path: '/clientes' },
    { name: 'Contato', path: '/contato' }
  ];

  // Filtrar menu items para não mostrar a página atual
  const currentPath = router.pathname;
  const filteredMenuItems = menuItems.filter(item => item.path !== currentPath);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Fin<span className="text-blue-300">NEXTHO</span>
            </span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            {filteredMenuItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm uppercase tracking-wider"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/login"  
              className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              {t('navigation.login')}
            </Link>
            <Link 
              href="/auth/register" 
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-medium text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              {t('navigation.startNow')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 