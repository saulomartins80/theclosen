//pages/api/auth/Lagout.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Limpa os cookies de autenticação
    res.setHeader('Set-Cookie', [
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'sessionToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    
    return res.status(200).json({ 
      success: true,
      message: 'Logout realizado com sucesso' 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro durante o logout'
    });
  }
}