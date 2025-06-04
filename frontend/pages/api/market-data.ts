// pages/api/market-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// URL base do seu backend. Defina em .env.local e no Vercel dashboard.
const BACKEND_API_URL = process.env.BACKEND_API_BASE_URL || 'http://localhost:5000/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Obter o token da requisição original do frontend (assumindo que está em um cookie 'token')
    const token = req.cookies.token;

    // Configurar cabeçalhos para a requisição ao backend, incluindo Authorization se o token existir
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (req.method === 'POST') {
        // Log the URL being used for the backend request
        const backendUrl = `${BACKEND_API_URL}/market-data`;
        console.log(`[market-data API Route] Proxying POST request to backend: ${backendUrl}`);
        console.log(`[market-data API Route] Request body being sent to backend:`, req.body); // Also log the body here

        try {
            const backendResponse = await axios.post(backendUrl, req.body, {
                headers: headers, // Usar os cabeçalhos configurados
                timeout: 10000 // 10 segundos
            });
            res.status(backendResponse.status).json(backendResponse.data);
        } catch (error: any) {
            console.error('[market-data API Route] Error proxying POST to backend /market-data:', error.message);
            if (axios.isAxiosError(error) && error.response) {
                // Encaminhar o status e corpo da resposta de erro do backend
                console.error('[market-data API Route] Backend error response data:', error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                 // Tratar erros que não são respostas do backend (como ECONNREFUSED)
                 const errorMessage = error.message || 'Failed to proxy request to backend';
                 console.error('[market-data API Route] Details:', errorMessage);
                 res.status(500).json({ error: 'Failed to proxy request to backend', details: errorMessage });
            }
        }
    } else if (req.method === 'GET') {
         res.setHeader('Allow', ['POST']);
         res.status(405).end(`Method ${req.method} Not Allowed`);

    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
