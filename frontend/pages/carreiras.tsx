import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiUsers } from 'react-icons/fi';

export default function Carreiras() {
  const { resolvedTheme } = useTheme();
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Carreiras | FinNEXTHO</title>
        <meta name="description" content="Trabalhe na FinNEXTHO. Veja nossas vagas e cultura." />
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
              <FiUsers className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Carreiras</h1>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Faça parte do time FinNEXTHO! Buscamos pessoas inovadoras, apaixonadas por tecnologia e que queiram transformar o mercado financeiro. Confira nossas vagas abertas e envie seu currículo para <a href="mailto:carreiras@finnextho.com">carreiras@finnextho.com</a>.</p>
              <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Desenvolvedor(a) Full Stack</li>
                <li>• Analista de Dados</li>
                <li>• Especialista em UX/UI</li>
                <li>• Consultor(a) Financeiro</li>
                <li>• Estágio em Marketing</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 