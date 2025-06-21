import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiBriefcase } from 'react-icons/fi';

export default function Empresa() {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Empresa | FinNEXTHO</title>
        <meta name="description" content="Sobre a empresa FinNEXTHO, missão, visão e valores." />
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
              <FiBriefcase className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Empresa</h1>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>A FinNEXTHO nasceu para revolucionar a gestão financeira no Brasil. Nossa missão é democratizar o acesso à inteligência financeira de ponta, promovendo autonomia, segurança e crescimento para pessoas e empresas.</p>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• <strong>Missão:</strong> Empoderar pessoas e empresas com tecnologia financeira inovadora.</li>
                <li>• <strong>Visão:</strong> Ser referência em soluções financeiras inteligentes na América Latina.</li>
                <li>• <strong>Valores:</strong> Ética, inovação, transparência, segurança e foco no cliente.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 