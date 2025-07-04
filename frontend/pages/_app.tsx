// frontend/pages/_app.tsx
import { useRouter } from 'next/router'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { FinanceProvider } from '../context/FinanceContext'
import { DashboardProvider } from '../context/DashboardContext'
import { NotificationProvider } from '../context/NotificationContext'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import '../tailwind-output.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '../styles/globals.css'
import LoadingSpinner from '../components/LoadingSpinner'
import { GoogleAnalytics } from '../components/GoogleAnalytics'
import AuthInitializer from '../components/AuthInitializer'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-layout min-h-screen flex flex-col">
      <main className="flex-grow">{children}</main>
    </div>
  )
}

function AppContent({ Component, pageProps }: { Component: AppProps['Component']; pageProps: AppProps['pageProps'] }) {
  const router = useRouter()
  const isPublicRoute = ['/', '/recursos', '/solucoes', '/precos', '/clientes', '/contato', '/sobre', '/termos']
    .includes(router.pathname)
  const isAuthRoute = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/complete-registration']
    .includes(router.pathname)

  if (isPublicRoute) {
    return (
      <PublicLayout>
        <Component {...pageProps} />
      </PublicLayout>
    )
  }

  return (
    <AuthInitializer>
      {!isAuthRoute ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthInitializer>
  )
}

function ProtectedAppContent({ Component, pageProps }: AppProps) {
  return (
    <DashboardProvider>
      <FinanceProvider>
        <NotificationProvider>
          <Elements stripe={stripePromise}>
            <GoogleAnalytics />
            <ToastContainerWithTheme />
            <AppContent Component={Component} pageProps={pageProps} />
          </Elements>
        </NotificationProvider>
      </FinanceProvider>
    </DashboardProvider>
  )
}

function ToastContainerWithTheme() {
  const { theme } = useTheme();
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      limit={5}
      style={{ zIndex: 9999 }}
      toastStyle={{ zIndex: 9999 }}
      theme={theme === 'dark' ? 'dark' : 'light'}
      closeButton={true}
      onClick={() => {}}
    />
  );
}

function MyApp(props: AppProps) {
  const router = useRouter()
  const isPublicRoute = ['/', '/recursos', '/solucoes', '/precos', '/clientes', '/contato', '/sobre', '/termos']
    .includes(router.pathname)
  const isAuthRoute = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/complete-registration']
    .includes(router.pathname)

  return (
    <ThemeProvider>
      <AuthProvider>
        {isPublicRoute || isAuthRoute ? (
          <>
            <GoogleAnalytics />
            <ToastContainerWithTheme />
            <AppContent {...props} />
          </>
        ) : (
          <ProtectedAppContent {...props} />
        )}
      </AuthProvider>
    </ThemeProvider>
  )
}

export default MyApp