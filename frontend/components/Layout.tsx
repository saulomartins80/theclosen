import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
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

  return (
    <ProtectedRoute>
      <Elements stripe={stripePromise}>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          {isMobileView && (
            <Sidebar
              isOpen={isMobileSidebarOpen}
              onClose={toggleMobileSidebar}
              isMobile={true}
            />
          )}
          {!isMobileView && (
            <Sidebar
              isMobile={false}
              initialCollapsed={isDesktopSidebarCollapsed}
              onToggle={toggleDesktopSidebarCollapse}
              isOpen={true}
              onClose={() => {}}
            />
          )}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
              !isMobileView && isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
            }`}
          >
            <Header
              isSidebarOpen={isMobileSidebarOpen}
              toggleMobileSidebar={toggleMobileSidebar}
            />
            <main className="flex-1 overflow-y-auto pt-24 md:pt-20 px-0">
              {children}
            </main>
          </div>
          <Chatbot />
        </div>
      </Elements>
    </ProtectedRoute>
  );
}