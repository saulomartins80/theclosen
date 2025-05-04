// pages/api/auth/session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import { Subscription } from '@/types/Subscription';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permitir tanto GET quanto POST
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.setHeader('Allow', ['GET', 'POST']).status(405).json({
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // Obter token de múltiplas fontes
    const token = req.cookies.token || 
                 req.headers.authorization?.split(' ')[1] || 
                 req.body?.token;

    if (!token) {
      return res.status(200).json({ user: null });
    }

    // Verificar token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUser = await adminAuth.getUser(decodedToken.uid);

    // Buscar assinatura
    const subscriptionDoc = await adminFirestore
      .collection('subscriptions')
      .where('userId', '==', firebaseUser.uid)
      .limit(1)
      .get();

    let subscription: Subscription | undefined;
    
    if (!subscriptionDoc.empty) {
      const subData = subscriptionDoc.docs[0].data();
      subscription = {
        id: subscriptionDoc.docs[0].id,
        plan: subData.plan,
        status: subData.status,
        createdAt: subData.createdAt.toDate().toISOString(),
        expiresAt: subData.expiresAt.toDate().toISOString(),
        updatedAt: subData.updatedAt?.toDate().toISOString(),
        userId: firebaseUser.uid
      };
    }

    // Se for POST, apenas atualizar os cookies com o token existente
    if (req.method === 'POST') {
      // Configurar cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 5 // 5 dias
      };

      res.setHeader('Set-Cookie', [
        `token=${token}; ${Object.entries(cookieOptions)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ')}`,
        `user=${encodeURIComponent(JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoUrl: firebaseUser.photoURL
        }))}; ${Object.entries({
          ...cookieOptions,
          httpOnly: false
        }).map(([k, v]) => `${k}=${v}`).join('; ')}`
      ]);
    }

    return res.status(200).json({
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
        ...(subscription && { subscription })
      }
    });

  } catch (error) {
    console.error('Session error:', error);
    // Limpar cookies inválidos
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    return res.status(200).json({ 
      user: null,
      error: error instanceof Error ? error.message : 'Session error'
    });
  }
}