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

// Define o breakpoint 'md' do Tailwind (geralmente 768px)
const MD_BREAKPOINT = 768;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    // Inicializa colapsado se a preferência do usuário indicar (apenas em desktop)
    if (typeof window !== 'undefined' && window.innerWidth >= MD_BREAKPOINT) {
       return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [isMobileView, setIsMobileView] = useState(false); // Novo estado para controlar a view
  const { user } = useAuth();

  // Efeito para determinar se é mobile na montagem e em redimensionamentos
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < MD_BREAKPOINT);
    };

    // Verifica inicialmente
    checkMobile();

    // Adiciona listener para redimensionamento com debounce
    const debouncedCheckMobile = debounce(checkMobile, 100);
    window.addEventListener('resize', debouncedCheckMobile);

    // Limpa o listener
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
    };
  }, []); // Array de dependências vazio para rodar apenas na montagem e desmontagem

  // Fecha a sidebar mobile se redimensionar para desktop
  useEffect(() => {
    if (!isMobileView && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobileView, isMobileSidebarOpen]);


  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const toggleDesktopSidebarCollapse = useCallback(() => {
    setIsDesktopSidebarCollapsed(prev => !prev);
    // Salva a preferência do usuário (apenas em desktop)
    if (typeof window !== 'undefined' && window.innerWidth >= MD_BREAKPOINT) {
      localStorage.setItem('sidebarCollapsed', String(!isDesktopSidebarCollapsed));
    }
  }, [isDesktopSidebarCollapsed]); // Adicionado isDesktopSidebarCollapsed como dependência

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Renderiza a Sidebar Mobile APENAS se for mobile view */}
      {isMobileView && (
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={toggleMobileSidebar}
          isMobile={true}
        />
      )}

      {/* Renderiza a Sidebar Desktop APENAS se NÃO for mobile view */}
      {!isMobileView && (
        <Sidebar
          isMobile={false}
          initialCollapsed={isDesktopSidebarCollapsed}
          onToggle={toggleDesktopSidebarCollapse}
        />
      )}


      {/* Conteúdo principal */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          !isMobileView && isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Header
          isSidebarOpen={isMobileSidebarOpen}
          toggleMobileSidebar={toggleMobileSidebar}
        />

        {/* O padding superior pt-16/pt-20 aqui compensa a altura do Header */}
        <main className="flex-1 overflow-y-auto pt-24 md:pt-20 px-0">
          {children}
        </main>
      </div>
    </div>
  );
  }
