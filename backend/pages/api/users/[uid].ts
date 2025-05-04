// src/user/[uid].ts
import { adminDb } from '@/lib/firebase/admin';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificação de token JWT
  const token = await getToken({ req });
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { uid } = req.query;

  try {
    // Verificação do UID
    if (typeof uid !== 'string') {
      return res.status(400).json({ error: 'UID inválido' });
    }

    // Autorização: só o próprio usuário pode ver seus dados
    if (uid !== token.sub) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    // Obter dados do Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userDoc.data();

    // Formatar resposta
    const responseData = {
      name: userData?.name || '',
      email: userData?.email || '',
      role: userData?.role || 'user',
      createdAt: userData?.createdAt?.toDate().toISOString()
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : undefined
    });
  }
}