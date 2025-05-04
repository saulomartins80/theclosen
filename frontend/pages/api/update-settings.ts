// pages/api/update-setttings.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const backendUrl = `${process.env.BACKEND_URL}/users/settings`;
    const response = await fetch(backendUrl, {
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
    console.error('Error updating settings:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}