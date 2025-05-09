import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]'; // Assumindo que authOptions é exportado aqui
import { UserService } from '../../../src/modules/users/services/UserService'; // Ajuste o caminho se necessário

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const userId = (session.user as any).id; // Assumindo que o ID do usuário está na sessão
  const userService = new UserService(); // Instancie seu serviço

  try {
    switch (req.method) {
      case 'GET':
        // Obter dados do perfil
        const profile = await userService.getProfile(userId);
        return res.status(200).json(profile);

      case 'PUT':
        // Atualizar dados do perfil
        // Você pode querer adicionar validação aqui antes de passar para o serviço
        const updatedProfileData = req.body;
        const updatedProfile = await userService.updateProfile(userId, updatedProfileData);
        return res.status(200).json(updatedProfile);

      default:
        // Método não permitido
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Método ${req.method} não permitido`);
    }
  } catch (error: any) {
    console.error('Erro na rota /api/auth/profile:', error);

    // Tratar erros específicos, como usuário não encontrado ou erro de validação
    if (error.message === 'Usuário não encontrado' || error.message.includes('Validação')) {
       return res.status(400).json({ error: error.message });
    }

    // Erro genérico do servidor
    return res.status(500).json({ error: 'Erro interno do servidor ao processar perfil.' });
  }
}