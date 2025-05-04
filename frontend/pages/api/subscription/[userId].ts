// pages/api/subscription/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Chama seu backend
    const backendResponse = await fetch(
      `${process.env.BACKEND_URL}/api/subscription/${userId}`,
      {
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : undefined,
    });
  }
}