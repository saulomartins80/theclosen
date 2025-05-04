// pages/_app.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { DashboardProvider } from '../context/DashboardContext';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import LoadingSpinner from '../components/LoadingSpinner';

const publicRoutes = [
  '/auth/login', 
  '/auth/register', 
  '/', 
  '/auth/forgot-password'
];

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
    if (!authChecked ) return;
  
    const isPublicRoute = publicRoutes.some(route => 
      router.pathname.startsWith(route)
    );
  
    // Verificação adicional para evitar loops
    if (!user && !isPublicRoute && !router.pathname.startsWith('/auth')) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(router.asPath)}`;
      if (router.asPath !== redirectUrl) {
        router.replace(redirectUrl);
      }
    } else if (user && isPublicRoute && router.pathname !== '/') {
      if (router.pathname !== '/dashboard') {
        router.replace('/dashboard');
      }
    }
  }, [authChecked, user, router]);

  const showLoading = (!authChecked && !publicRoutes.includes(router.pathname)) || routeChanging;
  const showLayout = !publicRoutes.includes(router.pathname) && authChecked;

  return (
    <>
      <GlobalErrorHandler />
      {showLoading && <LoadingSpinner fullScreen />}
      {showLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}

export default function MyApp(props: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <DashboardProvider>
            <ToastContainer 
              position="top-right" 
              autoClose={5000}
              pauseOnFocusLoss={false}
            />
            <AppWrapper {...props} />
          </DashboardProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}