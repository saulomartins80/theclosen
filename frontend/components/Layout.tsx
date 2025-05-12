import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const MOBILE_BREAKPOINT = 768; // Tailwind's md breakpoint

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false); // Estado para controlar a visualização mobile
  const { user } = useAuth();

  const handleResize = useCallback(() => {
    const currentIsMobileView = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobileView(currentIsMobileView);
    if (!currentIsMobileView) {
      setIsMobileSidebarOpen(false); // Fecha o sidebar mobile se a tela for para desktop
    }
  }, []);

  useEffect(() => {
    handleResize(); // Define o estado inicial na montagem
    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [handleResize]);

  const toggleMobileSidebar = useCallback(() => {
    if (isMobileView) { // Só alterna o sidebar mobile se estiver em visualização mobile
      setIsMobileSidebarOpen(prev => !prev);
    }
  }, [isMobileView]);

  const toggleDesktopSidebarCollapse = useCallback(() => {
    if (!isMobileView) { // Só alterna o sidebar desktop se NÃO estiver em visualização mobile
      setIsDesktopSidebarCollapsed(prev => !prev);
    }
  }, [isMobileView]);

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        isOpen={isMobileSidebarOpen} // Controla se o menu mobile está aberto
        onClose={toggleMobileSidebar} // Função para fechar o menu mobile (pelo X ou clique fora)
        isMobile={isMobileView} // Indica se o Sidebar deve se comportar como mobile ou desktop
        initialCollapsed={isDesktopSidebarCollapsed} // Estado inicial de recolhimento para desktop
        onToggle={toggleDesktopSidebarCollapse} // Função para expandir/recolher o menu desktop
      />

      {/* Conteúdo principal */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${ 
          isMobileView ? '' : (isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64')
        }`}
      >
        <Header 
          toggleMobileSidebar={toggleMobileSidebar} // Passa a função para o Header controlar o sidebar mobile
          // Se o Header precisar de isMobileView ou isDesktopSidebarCollapsed, adicione aqui:
          // isMobileView={isMobileView}
          // isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          // toggleDesktopSidebar={toggleDesktopSidebarCollapse} 
        />
        
        <main className="flex-1 overflow-y-auto pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
