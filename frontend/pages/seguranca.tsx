import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiLock } from 'react-icons/fi';

export default function Seguranca() {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Segurança | FinNEXTHO</title>
        <meta name="description" content="Saiba como protegemos seus dados e garantimos a segurança da plataforma." />
      </Head>
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <header className={`py-6 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="max-w-4xl mx-auto px-6">
            <Link href="/" className={`inline-flex items-center text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
            <div className="flex items-center mb-8">
              <FiLock className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Segurança</h1>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>A segurança dos seus dados é prioridade máxima na FinNEXTHO. Utilizamos criptografia de ponta, autenticação de dois fatores e monitoramento contínuo para garantir a proteção das suas informações.</p>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Criptografia AES-256</li>
                <li>• Autenticação biométrica</li>
                <li>• Monitoramento 24/7</li>
                <li>• Conformidade com LGPD</li>
                <li>• Equipe dedicada de segurança</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 