// pages/api/auth/login.ts
import { adminAuth } from '@config/firebaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).json({ 
      error: 'Method not allowed' 
    });
  }

  try {
    const { email, password, token: clientToken } = req.body;

    // Se receber um token do cliente, verifique diretamente
    if (clientToken) {
      const decodedToken = await adminAuth.verifyIdToken(clientToken);
      const user = await adminAuth.getUser(decodedToken.uid);

      const sessionCookie = await adminAuth.createSessionCookie(clientToken, {
        expiresIn: 60 * 60 * 24 * 5 * 1000 // 5 dias
      });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 5 // 5 dias em segundos
      };

      res.setHeader('Set-Cookie', [
        `session=${sessionCookie}; ${Object.entries(cookieOptions)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ')}`,
        `user=${encodeURIComponent(JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL
        }))}; ${Object.entries({
          ...cookieOptions,
          httpOnly: false
        }).map(([k, v]) => `${k}=${v}`).join('; ')}`
      ]);

      return res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoUrl: user.photoURL
        }
      });
    }

    // Fluxo tradicional com email/senha (para uso administrativo)
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Autenticação com email/senha usando Firebase Admin
    const { uid } = await adminAuth.getUserByEmail(email);
    
    // Em produção, isso deve ser feito no cliente
    const token = await adminAuth.createCustomToken(uid);

    return res.status(200).json({
      success: true,
      token,
      user: {
        uid,
        email,
        name: '', // Preenchido pelo cliente
        photoUrl: '' // Preenchido pelo cliente
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    const errorMessage = error.code === 'auth/user-not-found' || 
                        error.code === 'auth/wrong-password'
      ? 'Credenciais inválidas'
      : 'Erro durante o login';

    return res.status(401).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}