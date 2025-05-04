// pages/api/subscription/quink-check/[userIld].ts
import { NextApiRequest, NextApiResponse } from 'next';

interface QuickCheckResponse {
  success: boolean;
  data?: {
    hasSubscription: boolean;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuickCheckResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid user ID' 
    });
  }

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/subscriptions/quick-check/${userId}`,
      {
        headers: {
          'Authorization': req.headers.authorization || ''
        }
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Quick-check error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}