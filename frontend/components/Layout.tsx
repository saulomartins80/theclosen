import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

// Helper para debounce (movido para fora do componente)
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [handleResize]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Mobile */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        isMobile={true}
      />

      {/* Sidebar Desktop */}
      <div className={`hidden md:block fixed inset-y-0 left-0 z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar 
          isOpen={true}
          onClose={() => {}}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
          isMobile={false}
        />
      </div>

      {/* Conteúdo principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header 
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        
        <main className="flex-1 overflow-y-auto pt-16 px-6">
          {children}
        </main>
      </div>
    </div>
  );
}