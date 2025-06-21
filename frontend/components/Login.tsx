'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  // Verifique se o path atual é /profile
  const isProfilePage = pathname === '/profile';

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header - Mostrar apenas se não for página de perfil */}
      {!isProfilePage && user && (
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <Header 
            isSidebarOpen={isMobileSidebarOpen}
            toggleMobileSidebar={toggleMobileSidebar}
          />
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Mostrar apenas se não for página de perfil */}
        {!isProfilePage && user && (
          <>
            {/* Sidebar Mobile */}
            <Sidebar
              isOpen={isMobileSidebarOpen} 
              onClose={closeMobileSidebar}
              isMobile={true}
            />

            {/* Sidebar Desktop */}
            <div className="hidden md:block">
              <Sidebar 
                isOpen={true} 
                onClose={closeMobileSidebar} 
                isMobile={false}
                initialCollapsed={false}
              />
            </div>
          </>
        )}
        
        {/* Conteúdo principal */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
          !isProfilePage && user ? 'pt-16 md:pl-64' : 'pt-0'
        }`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}