import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

export default function Juridico() {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Jurídico | FinNEXTHO</title>
        <meta name="description" content="Informações jurídicas e legais da FinNEXTHO" />
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
              <FiShield className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Jurídico</h1>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Aqui você encontra informações sobre nossos termos legais, políticas de privacidade, compliance e obrigações regulatórias. Para dúvidas jurídicas, entre em contato pelo e-mail <a href="mailto:juridico@finnextho.com">juridico@finnextho.com</a>.</p>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• CNPJ: 00.000.000/0001-00</li>
                <li>• Endereço: Av. Paulista, 1000 - São Paulo, SP</li>
                <li>• Responsável Legal: Dr. João Advogado</li>
                <li>• Compliance com LGPD e regulamentações financeiras</li>
                <li>• Documentos legais disponíveis mediante solicitação</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 