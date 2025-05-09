// pages/_app.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { DashboardProvider } from '../context/DashboardContext';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import '../tailwind-output.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import LoadingSpinner from '../components/LoadingSpinner';

const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
const publicOnlyRoutes = ['/']; // Routes accessible to everyone

function GlobalErrorHandler() {
  useEffect(() => {
    // Tratamento para erros de conexão
    const handleConnectionError = (event: any) => {
      if (event?.reason?.code === 'ECONNRESET' || event?.code === 'ECONNRESET') {
        console.warn('Connection reset detected, will retry...');
        // Aqui você pode adicionar lógica para reconexão
        return;
      }
      
      // Tratamento para erros não capturados
      console.error('Unhandled error:', event.error || event.reason || event);
    };

    // Captura erros globais
    window.addEventListener('error', handleConnectionError);
    window.addEventListener('unhandledrejection', handleConnectionError);

    return () => {
      window.removeEventListener('error', handleConnectionError);
      window.removeEventListener('unhandledrejection', handleConnectionError);
    };
  }, []);

  return null;
}

function AppWrapper({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { user, loading: authLoading, authChecked } = useAuth();
  const [routeChanging, setRouteChanging] = useState(false);

  // Controle de loading durante troca de rotas
  useEffect(() => {
    const handleStart = () => setRouteChanging(true);
    const handleComplete = () => setRouteChanging(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Redirecionamento baseado no estado de autenticação
  useEffect(() => {
    if (!authChecked) return;

    const { pathname } = router;

    const isAuthPage = authRoutes.includes(pathname);
    const isPublicOnlyPage = publicOnlyRoutes.includes(pathname);
    const isProtectedRoute = !isAuthPage && !isPublicOnlyPage;

    if (user) {
      // User is authenticated
      if (isAuthPage) {
        // Authenticated user on an auth page -> Redirect to dashboard
        router.replace('/dashboard');
      }
      // If on '/' or a protected route, do nothing here. 
      // ProtectedRoute component will handle subscription check.
    } else {
      // User is NOT authenticated
      if (isProtectedRoute) {
        // Unauthenticated user on a protected page -> Redirect to login
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent(router.asPath)}`;
        // Only redirect if not already on the login page
        if (pathname !== '/auth/login') {
           router.replace(redirectUrl);
        }
      }
      // If on '/' or an auth route, do nothing (allow access)
    }
  }, [authChecked, user, router]);

  // Determine if layout should be shown
  // Show layout only for protected routes when auth check is complete and user is present
  const showLayout = authChecked && user && !authRoutes.includes(router.pathname) && !publicOnlyRoutes.includes(router.pathname);

  // Determine if loading spinner should be shown
  // Show loading if auth check is not complete OR if route is changing
  const showLoading = !authChecked || routeChanging;

  return (
    <>
      <GlobalErrorHandler />
      {showLoading && <LoadingSpinner fullScreen />}
      {!showLoading && (
        showLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )
      )}
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        pauseOnFocusLoss={false}
      />
    </>
  );
}

export default function MyApp(props: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <DashboardProvider>
            
            <AppWrapper {...props} />
          </DashboardProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}