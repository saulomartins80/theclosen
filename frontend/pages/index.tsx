// pages/index.tsx
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import Head from 'next/head';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import CountUp from 'react-countup';
import { Tooltip } from 'react-tooltip';

// Componentes/Contextos
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

// Ícones
import { 
  FiArrowRight, FiCheck, FiPlay, FiStar, FiTrendingUp, 
  FiTwitter, FiLinkedin, FiFacebook, FiInstagram, FiYoutube,  
} from 'react-icons/fi';
import { FaBitcoin, FaPiggyBank, FaChartLine, FaShieldAlt } from 'react-icons/fa';

// Estilos
import 'react-tabs/style/react-tabs.css';
import '@splidejs/splide/css/core';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Função para scroll suave
  const handleSmoothScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  // Função para tracking de cliques
  const handleClick = (buttonName: string) => {
    if (window.gtag) {
      window.gtag('event', 'click', {
        'event_category': 'engagement',
        'event_label': buttonName
      });
    }
  };

  // Efeito para navegação por hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Redirecionamento se estiver logado
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Efeitos de scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      controls.start({
        opacity: window.scrollY > 200 ? 1 : 0,
        y: window.scrollY > 200 ? 0 : 20
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [controls]);

  // Animações quando o elemento estiver visível
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  // Tela de carregamento
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Configurações do Splide
  const splideOptions = {
    type: 'loop',
    perPage: 3,
    perMove: 1,
    gap: '2rem',
    pagination: false,
    breakpoints: {
      1024: { perPage: 2 },
      640: { perPage: 1 }
    }
  };

  // Dados
  const metrics = [
    { value: 15, suffix: 'K+', label: 'Usuários ativos' },
    { value: 89, suffix: '%', label: 'Satisfação' },
    { value: 4.9, suffix: '/5', label: 'Avaliação' },
    { value: 24, suffix: '/7', label: 'Suporte' }
  ];

  const features = [
    {
      icon: <FaChartLine className="w-8 h-8" />,
      title: "Analytics Avançado",
      description: "Relatórios em tempo real com machine learning para prever tendências"
    },
    {
      icon: <FaBitcoin className="w-8 h-8" />,
      title: "Cripto Integrado",
      description: "Gerencie suas criptomoedas junto com investimentos tradicionais"
    },
    {
      icon: <FaPiggyBank className="w-8 h-8" />,
      title: "Economia Inteligente",
      description: "Sistema automático que identifica oportunidades de economia"
    },
    {
      icon: <FaShieldAlt className="w-8 h-8" />,
      title: "Segurança Militar",
      description: "Criptografia AES-256 e autenticação biométrica"
    }
  ];

  return (
    <>
      <Head>
        <title>Finanext PRO | Revolução Financeira</title>
        <meta name="description" content="Plataforma financeira completa com IA integrada" />
        <meta property="og:image" content="https://finanext.com/social-preview.jpg" />
        <link rel="preload" href="/fonts/Inter.var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>

      {/* Navbar */}
      <header className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-gray-900/95 backdrop-blur-md py-3 shadow-xl' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Finanext<span className="text-blue-300">PRO</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-8">
              {['Recursos', 'Soluções', 'Preços', 'Clientes', 'Contato'].map((item) => {
                const id = item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return (
                  <Link 
                    key={item} 
                    href={`#${id}`}
                    scroll={false}
                    className="text-gray-300 hover:text-white transition-colors font-medium text-sm uppercase tracking-wider"
                    data-tooltip-id="nav-tooltip" 
                    data-tooltip-content={`Ir para ${item}`}
                    onClick={(e) => handleSmoothScroll(e, id)}
                  >
                    {item}
                  </Link>
                );
              })}
            </nav>
            <Tooltip id="nav-tooltip" place="bottom" effect="solid" className="z-50" />
            
            <div className="flex space-x-4">
              <Link 
                href="/auth/login"  
                className="px-5 py-2.5 text-sm font-medium text-white hover:text-blue-100 transition"
                onClick={() => handleClick('login_button')}
              >
                Entrar
              </Link>
              <Link 
                href="/auth/register?plan=free_trial" 
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-medium text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                onClick={() => handleClick('register_button')}
              >
                Comece Agora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          >
            <source src="/media/hero/background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-gray-900/90"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 h-screen flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700 mb-6">
              <span className="text-xs font-semibold tracking-wider text-blue-300 uppercase">
                Versão PRO Lançada
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Seu futuro
              </span> financeiro começa aqui 
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-10">
              A primeira plataforma que combina gestão financeira pessoal com inteligência artificial preditiva.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                href="/auth/register?plan=free_trial" 
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                onClick={() => handleClick('hero_cta')}
              >
                Comece Grátis por 30 Dias
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button 
                className="flex items-center justify-center px-8 py-4 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition border border-white/20 group"
                onClick={() => {
                  handleClick('demo_button');
                  router.push('/demo');
                }}
              >
                <FiPlay className="mr-2" />
                Ver Demonstração
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          animate={controls}
          initial={{ opacity: 0, y: 20 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="animate-bounce w-8 h-14 rounded-full border-2 border-gray-400 flex justify-center p-1">
            <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Seção de Métricas */}
      <section id="recursos" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center hover:bg-gray-800 transition"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  <CountUp 
                    end={metric.value} 
                    suffix={metric.suffix}
                    duration={2.5}
                    decimals={metric.value % 1 ? 1 : 0}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                  />
                </div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">
                  {metric.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Recursos */}
      <section id="solucoes" className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Tecnologia <span className="text-blue-400">Exclusiva</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Recursos avançados que você não encontra em nenhum outro lugar
            </p>
          </motion.div>

          <Tabs selectedIndex={activeTab} onSelect={(index) => setActiveTab(index)}>
            <TabList className="flex flex-wrap justify-center gap-2 mb-16">
              {['Dashboard', 'Investimentos', 'Economia', 'Segurança'].map((tab, index) => (
                <Tab
                  key={index}
                  className={`px-6 py-3 rounded-full cursor-pointer font-medium transition-colors ${
                    activeTab === index
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => handleClick(`tab_${tab.toLowerCase()}`)}
                >
                  {tab}
                </Tab>
              ))}
            </TabList>

            <div className="relative">
              {[0, 1, 2, 3].map((index) => (
                <TabPanel key={index}>
                  <motion.div
                    initial={{ opacity: 0, x: index % 2 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                  >
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-6">
                        {['Painel Inteligente', 'Carteira Global', 'Automatização', 'Proteção'][index]}
                      </h3>
                      <p className="text-gray-400 mb-8 text-lg">
                        {[
                          'Visualização unificada de todos seus ativos com recomendações em tempo real.',
                          'Gerencie ações, criptomoedas e fundos em uma única interface integrada.',
                          'Sistema automático que identifica e executa oportunidades de economia.',
                          'Tecnologia bancária militar com verificação em múltiplos fatores.'
                        ][index]}
                      </p>
                      <ul className="space-y-4">
                        {[
                          ['Análise preditiva', 'Relatórios personalizados', 'Alertas inteligentes'],
                          ['+10.000 ativos', 'Taxas competitivas', 'Estratégias automáticas'],
                          ['Identificação de gastos', 'Otimização tributária', 'Cashback inteligente'],
                          ['Criptografia AES-256', 'Biometria', 'Seguro até R$1MM']
                        ][index].map((item, i) => (
                          <li key={i} className="flex items-start">
                            <FiCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                            <span className="text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative">
                      <div className="relative rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl">
                        <img
                          src={`/media/features/${['dashboard', 'investments', 'savings', 'security'][index]}.jpg`}
                          alt={['Painel Financeiro', 'Investimentos', 'Economia', 'Segurança'][index]}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      </div>
                    </div>
                  </motion.div>
                </TabPanel>
              ))}
            </div>
          </Tabs>
        </div>
      </section>

      {/* Seção de Comparação */}
      <section id="precos" className="py-20 bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Compare com a <span className="text-blue-400">Concorrência</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Veja por que somos a escolha preferida de especialistas
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-5 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Recurso</th>
                  <th className="px-6 py-5 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Finanext PRO</th>
                  <th className="px-6 py-5 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Concorrente A</th>
                  <th className="px-6 py-5 text-center text-sm font-medium text-gray-400 uppercase tracking-wider">Concorrente B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  ['IA Financeira', true, false, false],
                  ['Criptomoedas', true, true, false],
                  ['Relatórios Avançados', true, false, true],
                  ['Suporte 24/7', true, true, false],
                  ['Integração Bancária', true, true, true],
                  ['Taxa Zero', true, false, false]
                ].map(([feature, finanext, compA, compB], index) => (
                  <tr key={index} className="hover:bg-gray-900/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">{feature as string}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {finanext ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-100">
                          <FiCheck className="mr-1" /> Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-100">
                          Não Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {compA ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-100">
                          <FiCheck className="mr-1" /> Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-100">
                          Não Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {compB ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-100">
                          <FiCheck className="mr-1" /> Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-100">
                          Não Disponível
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Seção de Depoimentos */}
      <section id="clientes" className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              O que dizem nossos <span className="text-purple-400">clientes</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Veja como estamos transformando vidas financeiras
            </p>
          </div>

          <div ref={ref}>
            <Splide options={splideOptions} aria-label="Depoimentos">
              {[
                {
                  name: "Carlos Silva",
                  role: "CEO, TechStart",
                  content: "A IA preditiva do Finanext PRO identificou oportunidades que aumentaram meus investimentos em 32% no último trimestre.",
                  rating: 5
                },
                {
                  name: "Ana Beatriz",
                  role: "Diretora Financeira",
                  content: "Finalmente uma plataforma que unifica meus investimentos globais com análises realmente úteis e acionáveis.",
                  rating: 5
                },
                {
                  name: "Roberto Costa",
                  role: "Investidor",
                  content: "O sistema de economia automática já me salvou mais de R$15.000 em gastos desnecessários este ano.",
                  rating: 4
                },
                {
                  name: "Juliana Martins",
                  role: "Empreendedora",
                  content: "Migrei de outra plataforma e a diferença é absurda. O suporte 24/7 resolveu um problema crítico para mim em minutos.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <SplideSlide key={index}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 50 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    initial="hidden"
                    animate={controls}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gray-800 rounded-2xl p-8 h-full border border-gray-700/50 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <FiStar 
                          key={i} 
                          className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-8 italic text-lg">"{testimonial.content}"</p>
                    <div className="flex items-center">
                      <img
                        src={`/media/testimonials/client${index + 1}.jpg`}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4"
                        loading="lazy"
                      />
                      <div>
                        <h4 className="font-bold text-white">{testimonial.name}</h4>
                        <p className="text-gray-400 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </motion.div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        </div>
      </section>

      {/* Seção CTA Final */}
      <section id="contato" className="relative py-32 overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black"></div>
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Pronto para a <span className="text-blue-300">revolução</span> financeira?
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-12">
              Junte-se a mais de 15.000 usuários que já transformaram sua relação com o dinheiro.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href="/auth/register?plan=free_trial"
                className="px-10 py-5 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/20 flex items-center justify-center"
                onClick={() => handleClick('final_cta')}
              >
                Comece Agora - 30 Dias Grátis
              </Link>
              
              <Link
                href="/demo"
                className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                onClick={() => handleClick('demo_cta')}
              >
                <FiPlay className="mr-2" />
                Agendar Demonstração
              </Link>
            </div>
            
            <p className="mt-8 text-blue-300/80 text-sm">
              Sem compromisso • Cancelamento a qualquer momento • Criptografia bancária
            </p>
          </motion.div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Finanext<span className="text-blue-300">PRO</span>
                </span>
              </Link>
              <p className="mb-6">
                A plataforma financeira mais avançada do mercado, com tecnologia de ponta para transformar sua relação com o dinheiro.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: <FiTwitter className="w-5 h-5" />, name: 'Twitter', url: 'https://twitter.com' },
                  { icon: <FiLinkedin className="w-5 h-5" />, name: 'LinkedIn', url: 'https://linkedin.com' },
                  { icon: <FiFacebook className="w-5 h-5" />, name: 'Facebook', url: 'https://facebook.com' },
                  { icon: <FiInstagram className="w-5 h-5" />, name: 'Instagram', url: 'https://instagram.com' },
                  { icon: <FiYoutube className="w-5 h-5" />, name: 'YouTube', url: 'https://youtube.com' },                  
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition hover:text-white"
                    aria-label={social.name}
                    onClick={() => handleClick(`social_${social.name.toLowerCase()}`)}
                  >
                    {social.icon}
                    <span className="sr-only">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Produto</h3>
              <ul className="space-y-3">
                {['Recursos', 'Preços', 'API', 'Integrações', 'Atualizações'].map((item) => {
                  const id = item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return (
                    <li key={item}>
                      <Link 
                        href={`#${id}`} 
                        scroll={false}
                        className="hover:text-white transition"
                        onClick={(e) => handleSmoothScroll(e, id)}
                      >
                        {item}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Empresa</h3>
              <ul className="space-y-3">
                {['Sobre', 'Carreiras', 'Blog', 'Parceiros', 'Imprensa'].map((item) => (
                  <li key={item}>
                    <Link 
                      href="#" 
                      className="hover:text-white transition"
                      onClick={() => handleClick(`footer_${item.toLowerCase()}`)}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Jurídico</h3>
              <ul className="space-y-3">
                {['Privacidade', 'Termos', 'Segurança', 'Cookies', 'Licenças'].map((item) => (
                  <li key={item}>
                    <Link 
                      href="#" 
                      className="hover:text-white transition"
                      onClick={() => handleClick(`footer_${item.toLowerCase()}`)}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} Finanext PRO. Todos os direitos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                href="#" 
                className="hover:text-white transition"
                onClick={() => handleClick('footer_terms')}
              >
                Termos de Serviço
              </Link>
              <Link 
                href="#" 
                className="hover:text-white transition"
                onClick={() => handleClick('footer_privacy')}
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
