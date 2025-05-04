// pages/api/manage-subscription.ts 
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const backendUrl = `${process.env.BACKEND_URL}/subscriptions/manage`;
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error managing subscription:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}