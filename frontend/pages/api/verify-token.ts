// pages/api/verify-token.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface TokenResponse {
  success: boolean;
  valid?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
      throw new Error('BACKEND_URL não configurada');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : null
    });
  }
}