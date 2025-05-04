//pages/api/users/[uid].ts
import { getToken } from 'next-auth/jwt';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req });
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const backendResponse = await fetch(
      `${process.env.BACKEND_URL}/api/users/${req.query.uid}`, 
      {
        method: req.method,
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      }
    );

    const data = await backendResponse.json();
    return res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error('Error forwarding to backend:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}