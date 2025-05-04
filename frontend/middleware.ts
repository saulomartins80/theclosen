// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/auth/login', 
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth/session',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health'
];

// Tempo máximo de espera por uma resposta do backend (em ms)
const BACKEND_TIMEOUT = 5000;

async function verifyToken(token: string, request: NextRequest): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    const verifyUrl = new URL('/api/auth/session', process.env.NEXT_PUBLIC_BACKEND_URL);
    
    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Token verification failed with status:', response.status);
      return false;
    }

    const data = await response.json();
    return !!data.user;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Verificação de tipo segura para TypeScript
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Token verification timeout');
    } else if (error instanceof Error) {
      console.error('Token verification error:', error.message);
    } else {
      console.error('Unknown token verification error:', error);
    }
    
    return false;
  }
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  
  const response = NextResponse.redirect(loginUrl);
  // Limpa cookies inválidos
  response.cookies.delete('token');
  response.cookies.delete('user');
  response.cookies.delete('session');
  
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora rotas públicas, APIs e arquivos estáticos
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // Verificação rápida em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const userCookie = request.cookies.get('user')?.value;
      if (!userCookie) {
        return redirectToLogin(request, pathname);
      }

      try {
        const user = JSON.parse(decodeURIComponent(userCookie));
        if (user?.uid) {
          return NextResponse.next();
        }
      } catch (error) {
        console.error('Failed to parse user cookie:', 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Verificação do token
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return redirectToLogin(request, pathname);
    }

    // Verificação no backend
    const isValidToken = await verifyToken(token, request);
    if (!isValidToken) {
      return redirectToLogin(request, pathname);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', 
      error instanceof Error ? error.message : 'Unknown error');
    return redirectToLogin(request, pathname);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public paths
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};