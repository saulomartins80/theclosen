// components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authChecked, subscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth check to complete
    if (!authChecked) return;

    // If user is not logged in, redirect to login
    if (!user) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(router.asPath)}`;
      if (router.pathname !== '/auth/login') {
        router.replace(redirectUrl);
      }
      return; // Stop further checks if not authenticated
    }

    // If user is logged in, check for active premium subscription
    const hasActivePremium = user && user.subscription && 
                           user.subscription.status === 'active' && 
                           user.subscription.plan === 'premium';

    // Define routes that require premium subscription
    // Assuming all routes using ProtectedRoute require premium for full access
    const requiresPremium = true; // Adjust this logic if some protected routes are for free tier

    if (requiresPremium && !hasActivePremium) {
      // User is authenticated but does not have active premium -> Redirect to dashboard (or an upgrade page)
      // For now, redirecting to dashboard. You might want a dedicated /upgrade page.
       if (router.pathname !== '/dashboard') {
         console.log('Authenticated user without active premium, redirecting to dashboard.');
         router.replace('/dashboard');
       }
      // Optionally, show a message to the user on the dashboard explaining they need premium
    }

  }, [authChecked, user, subscription, router]); // Add subscription to dependency array

  // Show loading spinner while auth is being checked
  if (loading || !authChecked) {
    return <LoadingSpinner fullScreen/>; // Use fullScreen spinner
  }

  // If auth checked and user is not null AND has active premium, render children
  const hasActivePremium = user && user.subscription && 
                         user.subscription.status === 'active' && 
                         user.subscription.plan === 'premium';

  // Render children only if authenticated AND has active premium, and not redirecting
  // This prevents rendering the protected content momentarily before redirection
  if (user && hasActivePremium && authChecked && !loading) {
     return <>{children}</>;
  }

  // If not authenticated or no active premium, return null. Redirection is handled in useEffect.
  return null;
}
