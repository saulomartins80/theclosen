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

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) { // md breakpoint
      setIsMobileSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [handleResize]);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const toggleDesktopSidebarCollapse = useCallback(() => {
    setIsDesktopSidebarCollapsed(prev => !prev);
  }, []);

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar 
        isOpen={isMobileSidebarOpen}
        onClose={toggleMobileSidebar}
        isMobile={true}
      />

      <Sidebar 
        isMobile={false}
        initialCollapsed={isDesktopSidebarCollapsed}
        onToggle={toggleDesktopSidebarCollapse}
      />

      {/* Conteúdo principal */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}
      >
        <Header 
          isSidebarOpen={isMobileSidebarOpen}
          toggleMobileSidebar={toggleMobileSidebar}
        />
        
        <main className="flex-1 overflow-y-auto pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
