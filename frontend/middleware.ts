// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Interface para tipagem segura dos dados de sessão
interface SessionData {
  user?: {
    id: string;
    email: string;
    // outros campos do usuário
  };
}

// Cache local para tokens (opcional)
const tokenCache = new Map<string, { valid: boolean; timestamp: number }>();

// Tempo máximo de espera por uma resposta do backend (em ms)
const BACKEND_TIMEOUT = 5000;
// Tempo de vida do cache (1 minuto)
const CACHE_TTL = 60000;

// Rotas públicas (incluindo /demo)
const publicPaths = [
  '/',
  '/demo',
  '/auth/login', 
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth/session',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health'
];

async function verifyToken(token: string, request: NextRequest): Promise<boolean> {
  // Verifica no cache primeiro (se estiver dentro do TTL)
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.valid;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    // Use NEXT_PUBLIC_BACKEND_URL que agora sabemos que deve estar configurado corretamente
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
      tokenCache.set(token, { valid: false, timestamp: Date.now() });
      return false;
    }

    const data: SessionData = await response.json();
    const isValid = !!data?.user?.id;
    
    // Atualiza cache
    tokenCache.set(token, {
      valid: isValid,
      timestamp: Date.now()
    });

    return isValid;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Token verification timeout');
    } else if (error instanceof Error) {
      console.error('Token verification error:', error.message);
    } else {
      console.error('Unknown token verification error:', error);
    }
    
    tokenCache.set(token, { valid: false, timestamp: Date.now() });
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

// Nova função para retornar resposta JSON de erro para APIs
function jsonUnauthorizedResponse(): NextResponse {
    return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/');

  // Ignora rotas públicas, APIs públicas e arquivos estáticos
  // APIs públicas já estão em publicPaths
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // APIs privadas exigem autenticação diferente (esta lógica já estava ok, mantida por clareza)
   if (pathname.startsWith('/api/private')) {
     const token = request.headers.get('authorization')?.split(' ')[1];

     if (!token) {
       return jsonUnauthorizedResponse(); // Retorna JSON para API
     }

     const isValidToken = await verifyToken(token, request);
     if (!isValidToken) {
       return jsonUnauthorizedResponse(); // Retorna JSON para API
     }

     return NextResponse.next();
   }


  try {
    // Verificação rápida em desenvolvimento - AINDA REDIRECIONA PARA LOGIN SE NÃO AUTENTICADO
    // Esta parte pode ser revisada se necessário, mas o foco é o fluxo geral
    if (process.env.NODE_ENV === 'development' && !isApiRoute) { // Aplicar apenas para páginas em dev
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
         // Falha no parse do cookie em dev para página, redireciona para login
         return redirectToLogin(request, pathname);
      }
    } else if (process.env.NODE_ENV === 'development' && isApiRoute) { // Para rotas API em dev, verificar token
         const token = request.cookies.get('token')?.value ||
                       request.headers.get('authorization')?.split(' ')[1];
          if (!token) {
              // Token ausente para API em dev, retorna JSON
              return jsonUnauthorizedResponse();
          }
          const isValidToken = await verifyToken(token, request);
          if (!isValidToken) {
               // Token inválido para API em dev, retorna JSON
               return jsonUnauthorizedResponse();
          }
          return NextResponse.next(); // Token válido para API em dev
    }


    // Lógica principal para produção (e dev se a verificação rápida não aplicar)
    // Verificação do token para rotas não-API e APIs NÃO PRIVADAS (que não começam com /api/private)
    // Certifique-se de que suas APIs que precisam de autenticação general NÃO estejam em publicPaths
    // e não estejam em /api/private se quiser usar esta lógica aqui.
    // Se /api/market-data é uma API protegida, ela cairá aqui.

    // Para APIs protegidas (que não são públicas e não são /api/private),
    // o token deve estar no cookie ou no cabeçalho Authorization
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.split(' ')[1];


    if (!token) {
      // Se não há token, verifica se é API. Retorna JSON para API, redireciona para página.
      if (isApiRoute) {
          return jsonUnauthorizedResponse();
      } else {
          return redirectToLogin(request, pathname);
      }
    }

    // Se há token, verifica se é válido chamando o backend
    const isValidToken = await verifyToken(token, request);

    if (!isValidToken) {
      // Se o token é inválido, verifica se é API. Retorna JSON para API, redireciona para página.
      if (isApiRoute) {
          return jsonUnauthorizedResponse();
      } else {
          return redirectToLogin(request, pathname);
      }
    }

    // Se o token é válido, permite a requisição continuar
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', 
      error instanceof Error ? error.message : 'Unknown error');

    // Em caso de erro no middleware, verifica se é API.
    // Retorna JSON 500 para API, redireciona para página.
    if (isApiRoute) {
         return new NextResponse(
            JSON.stringify({ error: 'Internal Middleware Error', details: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
         );
    } else {
        return redirectToLogin(request, pathname);
    }
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
    '/((?!_next/static|_next/image|favicon.ico).*)$'
  ]
};
