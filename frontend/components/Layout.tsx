import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Chatbot from './ChatbotCorrected';
import MobileNavigation from './MobileNavigation';
import { ProtectedRoute } from './ProtectedRoute';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Inicializa o Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const MD_BREAKPOINT = 768;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= MD_BREAKPOINT) {
       return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [isMobileView, setIsMobileView] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < MD_BREAKPOINT);
    };
    checkMobile();
    const debouncedCheckMobile = debounce(checkMobile, 100);
    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
    };
  }, []);

  // Scroll listener para mostrar/ocultar header no mobile
  useEffect(() => {
    const handleScroll = () => {
      if (isMobileView) {
        setShowMobileHeader(window.scrollY > 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileView]);

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
    if (typeof window !== 'undefined' && window.innerWidth >= MD_BREAKPOINT) {
      localStorage.setItem('sidebarCollapsed', String(!isDesktopSidebarCollapsed));
    }
  }, [isDesktopSidebarCollapsed]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <ProtectedRoute>
      <Elements stripe={stripePromise}>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          {/* Sidebar para desktop */}
          {!isMobileView && (
            <Sidebar
              isMobile={false}
              initialCollapsed={isDesktopSidebarCollapsed}
              onToggle={toggleDesktopSidebarCollapse}
              isOpen={true}
              onClose={() => {}}
            />
          )}
          
          {/* Sidebar para mobile */}
          {isMobileView && (
            <Sidebar
              isOpen={isMobileSidebarOpen}
              onClose={toggleMobileSidebar}
              isMobile={true}
            />
          )}
          
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
              !isMobileView && isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
            }`}
          >
            {/* Header para desktop */}
            {!isMobileView && (
              <Header
                isSidebarOpen={isMobileSidebarOpen}
                toggleMobileSidebar={toggleMobileSidebar}
              />
            )}
            
            {/* Header para mobile (aparece quando rola) */}
            {isMobileView && showMobileHeader && (
              <Header
                isSidebarOpen={isMobileSidebarOpen}
                toggleMobileSidebar={toggleMobileSidebar}
              />
            )}
            
            {/* Conteúdo principal */}
            <main className={`flex-1 overflow-y-auto ${
              isMobileView ? 'pt-4 pb-20' : 'pt-24 md:pt-20'
            } px-4 md:px-6`}>
              {children}
            </main>
          </div>
          
          {/* Chatbot */}
          <Chatbot 
            isOpen={isChatOpen}
            onToggle={toggleChat}
          />
          
          {/* Navegação móvel */}
          <MobileNavigation 
            onChatToggle={toggleChat}
            isChatOpen={isChatOpen}
            onSidebarToggle={toggleMobileSidebar}
          />
        </div>
      </Elements>
    </ProtectedRoute>
  );
}