// pages/api/auth/google.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '@config/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { idToken, email, name, photoUrl } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Cria/atualiza usuário no Firestore
    const userRef = adminFirestore.collection('users').doc(uid);
    await userRef.set({
      email,
      name,
      photoUrl: photoUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // Cria token de sessão
    const sessionToken = await adminAuth.createCustomToken(uid);

    return res.status(200).json({
      success: true,
      user: {
        uid,
        email,
        name,
        photoUrl
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('Erro na autenticação com Google:', error);
    return res.status(401).json({ 
      error: 'Falha na autenticação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}