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
        try {
            const backendResponse = await axios.post(`${BACKEND_API_URL}/market-data`, req.body, {
                headers: headers, // Usar os cabeçalhos configurados
                timeout: 10000 // 10 segundos
            });
            res.status(backendResponse.status).json(backendResponse.data);
        } catch (error: any) {
            console.error('Error proxying POST to backend /market-data:', error.message);
            if (axios.isAxiosError(error) && error.response) {
                // Encaminhar o status e corpo da resposta de erro do backend
                console.error('Backend error response data:', error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                 // Tratar erros que não são respostas do backend (como ECONNREFUSED)
                 const errorMessage = error.message || 'Failed to proxy request to backend';
                 console.error('Details:', errorMessage);
                 res.status(500).json({ error: 'Failed to proxy request to backend', details: errorMessage });
            }
        }
    } else if (req.method === 'GET') {
         // A lógica para GET aqui parece inconsistente com o POST na rota marketDataRoutes (que é apenas POST)
         // Se você precisa de GET, ajuste a rota do backend e o código aqui.
         // POR ENQUANTO, vamos focar no POST, pois os logs mostraram POST 307.
         res.setHeader('Allow', ['POST']); // Permitir apenas POST conforme a rota backend
         res.status(405).end(`Method ${req.method} Not Allowed`);

    } else {
        res.setHeader('Allow', ['POST']); // Permitir apenas POST
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}