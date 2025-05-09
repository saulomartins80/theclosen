// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Configura cookies de sessão
    res.setHeader('Set-Cookie', [
      `token=${data.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `user=${encodeURIComponent(JSON.stringify(data.user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`, // Adicionado HttpOnly
    ]);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : null,
    });
  }
}