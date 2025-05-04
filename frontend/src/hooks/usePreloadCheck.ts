//src/hooks/usePreLoadCheck.ts
import { useRouter } from 'next/router';

export function usePreloadCheck() {
  const router = useRouter();
  return router.asPath.includes('_next/data') || 
         router.asPath.includes('.json') ||
         router.isPreview;
}