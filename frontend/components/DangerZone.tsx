// components/DangerZone.tsx
import { useState } from 'react';
import { FiTrash2, FiDownload, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { deleteUser } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import { doc, deleteDoc, getFirestore } from 'firebase/firestore';

interface DangerZoneProps {
  userId: string;
  onAccountDeleted: () => void;
}

export default function DangerZone({ userId, onAccountDeleted }: DangerZoneProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'in-progress' | 'completed' | 'failed'>('idle');

  const handleExportData = async () => {
    setExportStatus('in-progress');
    try {
      // Simulando exportação de dados
      await new Promise(resolve => setTimeout(resolve, 2000));
      setExportStatus('completed');
      toast.success('Dados exportados com sucesso! Um link foi enviado para seu email.');
    } catch (error) {
      setExportStatus('failed');
      toast.error('Falha ao exportar dados.');
    } finally {
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Primeiro deletar dados do Firestore
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      // 2. Depois deletar a conta de autenticação
      await deleteUser(user);

      toast.success('Conta excluída com sucesso. Esperamos vê-lo novamente no futuro!');
      onAccountDeleted();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(`Erro ao excluir conta: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
        <h3 className="flex items-center text-lg font-medium text-red-800 dark:text-red-200 mb-4">
          <FiDownload className="mr-2" /> Exportar meus dados
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">
          Exporte todos os seus dados financeiros em formato JSON para backup ou migração.
        </p>
        <button
          onClick={handleExportData}
          disabled={exportStatus === 'in-progress'}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          {exportStatus === 'in-progress' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exportando...
            </>
          ) : 'Exportar Todos os Dados'}
        </button>
      </div>

      <div className="border border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-900/20">
        <h3 className="flex items-center text-lg font-medium text-red-800 dark:text-red-200 mb-4">
          <FiAlertTriangle className="mr-2" /> Excluir minha conta
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">
          Esta ação excluirá permanentemente sua conta e todos os dados associados. Esta operação não pode ser desfeita.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Excluindo...
            </>
          ) : 'Excluir Conta Permanentemente'}
        </button>
      </div>
    </div>
  );
}