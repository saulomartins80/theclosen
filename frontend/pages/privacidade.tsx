import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiShield, FiEye, FiLock, FiDatabase } from 'react-icons/fi';

export default function Privacidade() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Política de Privacidade | FinNEXTHO</title>
        <meta name="description" content="Nossa política de privacidade e proteção de dados" />
      </Head>

      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Header */}
        <header className={`py-6 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="max-w-4xl mx-auto px-6">
            <Link 
              href="/"
              className={`inline-flex items-center text-sm font-medium ${
                resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
            <div className="flex items-center mb-8">
              <FiShield className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Política de Privacidade</h1>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className={`text-lg mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6 mb-4`}>
                  <div className="flex items-start mb-4">
                    <FiEye className={`w-5 h-5 mr-3 mt-1 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <h3 className="font-semibold mb-2">Informações Pessoais</h3>
                      <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li>• Nome completo e informações de contato</li>
                        <li>• Dados de identificação (CPF, RG)</li>
                        <li>• Informações bancárias e financeiras</li>
                        <li>• Histórico de transações e investimentos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Como Usamos Suas Informações</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Utilizamos suas informações para:
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Fornecer e melhorar nossos serviços financeiros</li>
                  <li>• Processar transações e pagamentos</li>
                  <li>• Enviar comunicações importantes sobre sua conta</li>
                  <li>• Personalizar recomendações e análises</li>
                  <li>• Cumprir obrigações legais e regulamentares</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Proteção de Dados</h2>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <div className="flex items-start mb-4">
                    <FiLock className={`w-5 h-5 mr-3 mt-1 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <h3 className="font-semibold mb-2">Medidas de Segurança</h3>
                      <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li>• Criptografia AES-256 para todos os dados</li>
                        <li>• Autenticação de dois fatores</li>
                        <li>• Monitoramento 24/7 de segurança</li>
                        <li>• Conformidade com LGPD e regulamentações</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Dados</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Com seu consentimento explícito</li>
                  <li>• Para cumprir obrigações legais</li>
                  <li>• Com prestadores de serviços essenciais (bancos, processadores de pagamento)</li>
                  <li>• Para proteger nossos direitos e segurança</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Você tem o direito de:
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Acessar seus dados pessoais</li>
                  <li>• Corrigir informações incorretas</li>
                  <li>• Solicitar a exclusão de dados</li>
                  <li>• Revogar consentimento a qualquer momento</li>
                  <li>• Portabilidade de dados</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <div className="flex items-start">
                    <FiDatabase className={`w-5 h-5 mr-3 mt-1 ${resolvedTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div>
                      <h3 className="font-semibold mb-2">Uso de Cookies</h3>
                      <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Utilizamos cookies para melhorar sua experiência, analisar o uso do site e personalizar conteúdo. 
                        Você pode gerenciar suas preferências de cookies nas configurações do navegador.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Alterações na Política</h2>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
                  através do email cadastrado ou por aviso em nossa plataforma.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Para dúvidas sobre esta política ou exercer seus direitos, entre em contato:
                </p>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <p className={`mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Email:</strong> privacidade@finnextho.com
                  </p>
                  <p className={`mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Telefone:</strong> (11) 9999-9999
                  </p>
                  <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Endereço:</strong> Av. Paulista, 1000 - São Paulo, SP
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 