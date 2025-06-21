import { useTheme } from '../context/ThemeContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiFileText, FiCheckCircle, FiAlertTriangle, FiShield } from 'react-icons/fi';

export default function Termos() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>Termos de Serviço | FinNEXTHO</title>
        <meta name="description" content="Termos de serviço e condições de uso da plataforma FinNEXTHO" />
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
              <FiFileText className={`w-8 h-8 mr-3 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-3xl font-bold">Termos de Serviço</h1>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className={`text-lg mb-6 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Ao acessar e usar a plataforma FinNEXTHO, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Descrição dos Serviços</h2>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6 mb-4`}>
                  <div className="flex items-start mb-4">
                    <FiCheckCircle className={`w-5 h-5 mr-3 mt-1 ${resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <h3 className="font-semibold mb-2">Nossos Serviços Incluem:</h3>
                      <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li>• Gestão financeira pessoal e empresarial</li>
                        <li>• Análise de investimentos e carteiras</li>
                        <li>• Relatórios e insights financeiros</li>
                        <li>• Integração com bancos e corretoras</li>
                        <li>• Suporte técnico e consultoria</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Elegibilidade e Registro</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Para usar nossos serviços, você deve:
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Ter pelo menos 18 anos de idade</li>
                  <li>• Ter capacidade legal para celebrar contratos</li>
                  <li>• Fornecer informações verdadeiras e precisas</li>
                  <li>• Manter a confidencialidade de suas credenciais</li>
                  <li>• Notificar imediatamente sobre uso não autorizado</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <div className="flex items-start mb-4">
                    <FiShield className={`w-5 h-5 mr-3 mt-1 ${resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <h3 className="font-semibold mb-2">Você concorda em:</h3>
                      <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li>• Usar os serviços apenas para fins legais</li>
                        <li>• Não tentar acessar sistemas não autorizados</li>
                        <li>• Não interferir na operação da plataforma</li>
                        <li>• Respeitar direitos de propriedade intelectual</li>
                        <li>• Não usar para atividades fraudulentas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Planos e Pagamentos</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Planos Disponíveis:</strong>
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• <strong>Gratuito:</strong> Funcionalidades básicas limitadas</li>
                  <li>• <strong>Premium:</strong> R$ 29,90/mês - Recursos avançados</li>
                  <li>• <strong>Pro:</strong> R$ 99,90/mês - Funcionalidades completas</li>
                  <li>• <strong>Enterprise:</strong> Preço sob consulta</li>
                </ul>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Condições de Pagamento:</strong>
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Pagamentos são processados mensalmente</li>
                  <li>• Cancelamento pode ser feito a qualquer momento</li>
                  <li>• Reembolsos seguem nossa política de 30 dias</li>
                  <li>• Preços podem ser alterados com aviso prévio</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Limitações de Responsabilidade</h2>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <div className="flex items-start">
                    <FiAlertTriangle className={`w-5 h-5 mr-3 mt-1 ${resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <div>
                      <h3 className="font-semibold mb-2">Isenções Importantes:</h3>
                      <ul className={`space-y-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <li>• Não garantimos lucros em investimentos</li>
                        <li>• Não somos responsáveis por perdas financeiras</li>
                        <li>• Serviços são fornecidos &quot;como estão&quot;</li>
                        <li>• Limitação de responsabilidade conforme lei aplicável</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Propriedade Intelectual</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Todo o conteúdo, software, design e funcionalidades da plataforma FinNEXTHO são protegidos por direitos autorais, 
                  marcas registradas e outras leis de propriedade intelectual. Você não pode copiar, modificar, distribuir ou 
                  criar trabalhos derivados sem nossa autorização expressa.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Rescisão</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Podemos suspender ou encerrar sua conta a qualquer momento, com ou sem aviso prévio, se você:
                </p>
                <ul className={`space-y-2 mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Violar estes termos de serviço</li>
                  <li>• Usar os serviços de forma inadequada</li>
                  <li>• Não pagar taxas devidas</li>
                  <li>• Engajar em atividades fraudulentas</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Lei Aplicável</h2>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais da 
                  comarca de São Paulo, SP, Brasil.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Alterações nos Termos</h2>
                <p className={`${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas 
                  serão comunicadas através do email cadastrado ou por aviso em nossa plataforma. O uso continuado 
                  dos serviços após as modificações constitui aceitação dos novos termos.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
                <p className={`mb-4 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Para dúvidas sobre estes termos, entre em contato:
                </p>
                <div className={`${resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
                  <p className={`mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Email:</strong> juridico@finnextho.com
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