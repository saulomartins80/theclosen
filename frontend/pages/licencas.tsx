import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

export default function Licencas() {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Licenças | FinNEXTHO</title>
        <meta name="description" content="Informações sobre licenças de software e conteúdo da FinNEXTHO." />
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
              <FiFileText className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Licenças</h1>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>A FinNEXTHO utiliza e contribui com diversos projetos open source. Todo o conteúdo, software e design estão protegidos por licenças específicas. Para mais informações, entre em contato pelo e-mail <a href="mailto:licencas@finnextho.com">licencas@finnextho.com</a>.</p>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Licença MIT para software próprio</li>
                <li>• Licenças de terceiros conforme documentação</li>
                <li>• Direitos autorais reservados</li>
                <li>• Uso permitido apenas mediante autorização</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 