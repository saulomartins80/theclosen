// frontend/pages/_app.tsx
import { useRouter } from 'next/router'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { FinanceProvider } from '../context/FinanceContext'
import { DashboardProvider } from '../context/DashboardContext'
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

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isPublicRoute = ['/', '/recursos', '/solucoes', '/precos', '/clientes', '/contato', '/sobre', '/termos']
    .includes(router.pathname)
  const isAuthRoute = ['/auth/login', '/auth/register', '/auth/forgot-password']
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

function MyApp(props: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardProvider>
          <FinanceProvider>
            <Elements stripe={stripePromise}>
              <GoogleAnalytics />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                style={{ zIndex: 9999 }}
                toastStyle={{ zIndex: 9999 }}
              />
              <AppContent {...props} />
            </Elements>
          </FinanceProvider>
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default MyApp