// pages/api/subscription.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface SubscriptionResponse {
  id: string;
  plan: string;
  status: string;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  active: boolean;
}

interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscriptionResponse | ApiErrorResponse>
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
    console.error('Subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}