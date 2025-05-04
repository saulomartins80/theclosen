//src/hooks/utilities.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Hook de debounce
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Verifica se o componente está montado
export const useIsMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};

// Verifica se é uma rota de pré-carregamento
export const useIsPreload = () => {
  const router = useRouter();
  return router.asPath.includes('_next/data') || router.isPreview;
};