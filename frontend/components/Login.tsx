'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Verifique se o path atual é /perfil
  const isProfilePage = typeof window !== 'undefined' && window.location.pathname === '/perfil';

  return (
    <div className="flex h-screen flex-col">
      {/* Header - Mostrar apenas se não for página de perfil */}
      {!isProfilePage && user && (
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
          <Header 
            isSidebarOpen={isMobileSidebarOpen}
            toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
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
              onClose={() => setIsMobileSidebarOpen(false)} 
              isMobile={true}
            />

            {/* Sidebar Desktop */}
            <div className="hidden md:block">
              <Sidebar isOpen={true} onClose={() => {}} isMobile={false} />
            </div>
          </>
        )}
        
        {/* Conteúdo principal */}
        <main className={`flex-1 overflow-y-auto pt-16 ${!isProfilePage && user ? 'md:ml-64' : ''}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}