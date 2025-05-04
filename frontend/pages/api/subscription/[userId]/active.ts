// pages/api/subscription/[userIld]/active.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { userId } = req.query;
    const backendUrl = `${process.env.BACKEND_URL}/subscriptions/${userId}/active`;

    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Active subscription check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}