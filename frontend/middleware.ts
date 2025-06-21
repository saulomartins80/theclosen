import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Adicione aqui as rotas que você quer que sejam públicas
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/recursos',
  '/solucoes',
  '/precos',
  '/clientes',
  '/contato',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout'
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Verificar se é uma rota pública
  const isPublic = publicRoutes.some(publicRoute =>
    path === publicRoute || (publicRoute.endsWith('/') && path.startsWith(publicRoute))
  );
  
  // Verificar se há token de autenticação
  const token = request.cookies.get('token');
  
  // Se é uma rota pública e não há token, redirecionar para login
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/investimentos/:path*',
    '/metas/:path*',
    '/transacoes/:path*',
    '/configuracoes/:path*',
    '/profile/:path*',
    '/assinaturas/:path*',
    // Rotas da API que precisam de proteção
    '/api/users/:path*',
    '/api/subscription/:path*'
  ],
}; 