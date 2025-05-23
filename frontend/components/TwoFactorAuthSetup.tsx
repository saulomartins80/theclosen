// components/TwoFactorAuthSetup.tsx
import { useState, useEffect } from 'react';
import { FiCheck, FiCopy, FiKey } from 'react-icons/fi';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';

interface TwoFactorAuthSetupProps {
  onComplete: (success: boolean) => void;
  currentStatus: boolean;
}

export default function TwoFactorAuthSetup({ onComplete, currentStatus }: TwoFactorAuthSetupProps) {
  const [step, setStep] = useState<'intro' | 'scan' | 'verify' | 'complete'>(
    currentStatus ? 'complete' : 'intro'
  );
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Simular geração de segredo e códigos de backup
  useEffect(() => {
    if (step === 'scan' && !secret) {
      // Em uma aplicação real, isso viria do backend
      const generateRandomSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let result = '';
        for (let i = 0; i < 32; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const generateBackupCodes = () => {
        const codes = [];
        for (let i = 0; i < 5; i++) {
          codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }
        return codes;
      };

      setSecret(generateRandomSecret());
      setBackupCodes(generateBackupCodes());
    }
  }, [step, secret]);

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Códigos copiados para a área de transferência!');
  };

  const handleVerifyCode = () => {
    setIsLoading(true);
    setError('');

    // Simular verificação do código (em uma aplicação real, isso seria verificado no backend)
    setTimeout(() => {
      setIsLoading(false);
      
      // Simular código válido (qualquer código de 6 dígitos)
      if (/^\d{6}$/.test(verificationCode)) {
        setStep('complete');
        onComplete(true);
      } else {
        setError('Código inválido. Por favor, tente novamente.');
      }
    }, 1000);
  };

  const handleDisable2FA = () => {
    setIsLoading(true);
    
    // Simular desativação
    setTimeout(() => {
      setIsLoading(false);
      setStep('intro');
      onComplete(false);
      toast.success('Autenticação de dois fatores desativada com sucesso!');
    }, 1000);
  };

  if (step === 'complete') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheck className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-300">
                Autenticação de dois fatores ativada com sucesso!
              </p>
            </div>
          </div>
        </div>

        <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Códigos de Backup
          </h3>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
            Guarde estes códigos em um local seguro. Eles podem ser usados para acessar sua conta caso você perca acesso ao seu dispositivo de autenticação.
          </p>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md font-mono text-sm mb-3">
            {backupCodes.map((code, i) => (
              <div key={i} className="py-1">{code}</div>
            ))}
          </div>
          
          <button
            onClick={handleCopyBackupCodes}
            className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
          >
            <FiCopy className="inline mr-1" /> Copiar Códigos
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDisable2FA}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Desativando...' : 'Desativar Autenticação de Dois Fatores'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div>
          <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Código de Verificação
          </label>
          <input
            id="verification-code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="123456"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            maxLength={6}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Digite o código de 6 dígitos do seu aplicativo autenticador
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiKey className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setStep('scan')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={isLoading || verificationCode.length !== 6}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : 'Verificar e Ativar'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'scan') {
    const otpAuthUrl = `otpauth://totp/FinanextPRO:${encodeURIComponent('user@example.com')}?secret=${secret}&issuer=FinanextPRO`;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Configurar Aplicativo Autenticador
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Escaneie o QR code abaixo com seu aplicativo de autenticação (Google Authenticator, Authy, etc.)
          </p>
          
          <div className="flex justify-center p-4 bg-white rounded-md mb-4">
            <QRCode value={otpAuthUrl} size={180} />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Ou digite manualmente este código:
            </p>
            <div className="font-mono text-lg font-bold text-gray-900 dark:text-white">
              {secret.match(/.{1,4}/g)?.join(' ')}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setStep('verify')}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Próximo - Verificar Código
          </button>
        </div>
      </div>
    );
  }

  // Step 'intro'
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiKey className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo um código único além da sua senha.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Como funciona?</h3>
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <FiCheck className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" />
            <span>Baixe um aplicativo autenticador como Google Authenticator ou Authy</span>
          </li>
          <li className="flex items-start">
            <FiCheck className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" />
            <span>Escaneie o QR code ou digite a chave manualmente</span>
          </li>
          <li className="flex items-start">
            <FiCheck className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" />
            <span>Digite o código gerado para verificar</span>
          </li>
          <li className="flex items-start">
            <FiCheck className="h-5 w-5 text-green-500 flex-shrink-0 mr-2 mt-0.5" />
            <span>Guarde seus códigos de backup em um local seguro</span>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setStep('scan')}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Configurar Autenticação de Dois Fatores
        </button>
      </div>
    </div>
  );
}