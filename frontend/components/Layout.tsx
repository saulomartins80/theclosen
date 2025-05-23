import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';
import { debounce } from 'lodash'; 

const MOBILE_BREAKPOINT = 768; 

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Debounce otimizado com useCallback
  const handleResize = useCallback(() => {
    const currentIsMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobileView(currentIsMobileView);
    if (!currentIsMobileView) {
      setIsMobileSidebarOpen(false);
    }
  }, []);

  // Efeito para lidar com resize e limpeza
  useEffect(() => {
    // Verificação do window para SSR
    if (typeof window !== 'undefined') {
      handleResize();
      const debouncedResize = debounce(handleResize, 100);
      window.addEventListener('resize', debouncedResize);
      return () => window.removeEventListener('resize', debouncedResize);
    }
  }, [handleResize]);

  // Toggle functions otimizadas
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const toggleDesktopSidebarCollapse = useCallback(() => {
    setIsDesktopSidebarCollapsed(prev => !prev);
  }, []);

  // Renderização condicional melhorada
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isMobile={isMobileView}
        initialCollapsed={isDesktopSidebarCollapsed}
        onToggle={toggleDesktopSidebarCollapse}
      />
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileView ? '' : (isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64')
        }`}
      >
        <Header 
          isSidebarOpen={isMobileSidebarOpen}
          toggleMobileSidebar={toggleMobileSidebar}
        />
        
        <main className="flex-1 overflow-y-auto pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}