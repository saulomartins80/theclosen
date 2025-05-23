// pages/api/market-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios'; // Certifique-se de que axios está instalado no frontend ou use fetch

// URL base do seu backend Express. Defina em .env.local
const BACKEND_API_URL = process.env.BACKEND_API_BASE_URL || 'http://localhost:5000/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const backendResponse = await axios.post(`${BACKEND_API_URL}/market-data`, req.body, {
                headers: {
                    'Content-Type': 'application/json',
                    // Se precisar encaminhar headers (ex: Authorization de req.headers.authorization)
                    // adicione-os aqui de forma segura.
                },
                timeout: 10000 // 10 segundos
            });
            res.status(backendResponse.status).json(backendResponse.data);
        } catch (error: any) {
            console.error('Error proxying POST to backend /market-data:', error.message);
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: 'Failed to proxy request to backend', details: error.message });
            }
        }
    } else if (req.method === 'GET') {
        const { symbols, cryptos, manualAssets } = req.query;
        try {
            const queryParams = new URLSearchParams();
            if (symbols) queryParams.append('symbols', symbols as string);
            if (cryptos) queryParams.append('cryptos', cryptos as string);
            if (manualAssets) queryParams.append('manualAssets', manualAssets as string);
            
            const backendResponse = await axios.get(`${BACKEND_API_URL}/market-data?${queryParams.toString()}`, {
                timeout: 10000
            });
            res.status(backendResponse.status).json(backendResponse.data);
        } catch (error: any) {
            console.error('Error proxying GET to backend /market-data:', error.message);
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: 'Failed to fetch market data from backend', details: error.message });
            }
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}