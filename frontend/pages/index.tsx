// pages/index.tsx
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import Head from 'next/head';
import Image from 'next/image'; 
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import CountUp from 'react-countup';
import { 
  FiArrowRight, FiCheck, FiPlay, FiStar, FiTrendingUp, 
  FiTwitter, FiLinkedin, FiFacebook, FiInstagram, FiYoutube,
  FiMenu, FiX, FiSun, FiMoon, FiGlobe
} from 'react-icons/fi';
import { FaBitcoin, FaPiggyBank, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { translations } from '../contexts/translations';

// Estilos
import 'react-tabs/style/react-tabs.css';
import '@splidejs/splide/css/core';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Redirecionar usuários logados para o dashboard
  useEffect(() => {
    console.log('[HomePage] useEffect - loading:', loading, 'user:', !!user);
    if (!loading && user) {
      console.log('[HomePage] User is logged in, redirecting to dashboard');
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleClick = (buttonName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'engagement',
        event_label: buttonName
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    controls.start({
      opacity: window.scrollY > 200 ? 1 : 0,
      y: window.scrollY > 200 ? 0 : 20
    });
  }, [isScrolled, controls]);

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  // Mostrar loading apenas quando está carregando
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

  const metrics = [
    { value: 1, suffix: 'K+', label: 'Usuários ativos' },
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

  const menuItems = [
    { name: 'Recursos', path: '/recursos' },
    { name: 'Soluções', path: '/solucoes' },
    { name: 'Preços', path: '/precos' },
    { name: 'Clientes', path: '/clientes' },
    { name: 'Contato', path: '/contato' }
  ];

  // Detecta a página atual
  const currentPath = router.pathname;

  // Filtra o menu removendo a página atual
  const filteredMenuItems = menuItems.filter(item => item.path !== currentPath);

  const testimonials = [
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
  ];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <Head>
        <title>FinNEXTHO | Revolução Financeira</title>
        <meta name="description" content="Plataforma financeira completa com IA integrada" />
        <meta property="og:image" content="https://FinNEXTHO.com/social-preview.jpg" />
      </Head>

      {/* Navbar */}
      <header className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? resolvedTheme === 'dark' 
            ? 'bg-gray-900/95 backdrop-blur-md py-3 shadow-xl' 
            : 'bg-white/95 backdrop-blur-md py-3 shadow-xl'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-white w-6 h-6" />
            </div>
            <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Fin<span className="text-blue-300">NEXTHO</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-8">
              {filteredMenuItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={`${
                    resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } transition-colors font-medium text-sm uppercase tracking-wider`}
                  onClick={() => handleClick(`nav_${item.name.toLowerCase()}`)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  resolvedTheme === 'dark' 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label={resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              >
                {resolvedTheme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>

              <Link 
                href="/auth/login"  
                className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                  resolvedTheme === 'dark' 
                    ? 'text-white hover:text-blue-100' 
                    : 'text-gray-900 hover:text-gray-700'
                }`}
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

          <button 
            className={`md:hidden focus:outline-none transition-colors ${
              resolvedTheme === 'dark' 
                ? 'text-gray-300 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`md:hidden absolute top-full left-0 right-0 ${
              resolvedTheme === 'dark' 
                ? 'bg-gray-900/95 backdrop-blur-md border-t border-gray-800' 
                : 'bg-white/95 backdrop-blur-md border-t border-gray-200'
            } shadow-xl`}
          >
            <div className="container mx-auto px-6 py-4">
              <nav className="flex flex-col space-y-4">
                {filteredMenuItems.map((item) => (
                  <Link 
                    key={item.path}
                    href={item.path}
                    className={`${
                      resolvedTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    } transition-colors font-medium text-sm uppercase tracking-wider py-2`}
                    onClick={() => {
                      handleClick(`mobile_nav_${item.name.toLowerCase()}`);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors ${
                      resolvedTheme === 'dark' 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label={resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                  >
                    {resolvedTheme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                  </button>
                </div>

                <Link 
                  href="/auth/login"  
                  className={`px-5 py-3 text-center font-medium rounded-lg transition ${
                    resolvedTheme === 'dark' 
                      ? 'text-white hover:bg-gray-800' 
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    handleClick('mobile_login_button');
                    setMobileMenuOpen(false);
                  }}
                >
                  Entrar
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 font-medium text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-center"
                  onClick={() => {
                    handleClick('mobile_register_button');
                    setMobileMenuOpen(false);
                  }}
                >
                  Comece Agora
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800 flex justify-center space-x-4">
                {[
                  { icon: <FiTwitter className="w-5 h-5" />, name: 'Twitter', url: 'https://twitter.com' },
                  { icon: <FiLinkedin className="w-5 h-5" />, name: 'LinkedIn', url: 'https://linkedin.com' },
                  { icon: <FiInstagram className="w-5 h-5" />, name: 'Instagram', url: 'https://instagram.com' },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${
                      resolvedTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    } transition`}
                    aria-label={social.name}
                    onClick={() => handleClick(`mobile_social_${social.name.toLowerCase()}`)}
                  >
                    {social.icon}
                    <span className="sr-only">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className={`relative min-h-screen overflow-hidden ${
        resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          >
            <source src="/hero/background.mp4" type="video/mp4" />
          </video>
          <div className={`absolute inset-0 ${
            resolvedTheme === 'dark' 
              ? 'bg-gradient-to-b from-gray-900/60 to-gray-900/90' 
              : 'bg-gradient-to-b from-white/60 to-white/90'
          }`}></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 h-screen flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className={`inline-flex items-center px-3 py-1 rounded-full ${
              resolvedTheme === 'dark' 
                ? 'bg-gray-800/50 border border-gray-700' 
                : 'bg-blue-50 border border-blue-200'
            } mb-6`}>
              <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
                Versão PRO Lançada
              </span>
            </div>

            <h1 className={`text-5xl md:text-7xl font-bold leading-tight mb-6 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Seu futuro
              </span> financeiro começa aqui 
            </h1>

            <p className={`text-xl md:text-2xl max-w-2xl mb-10 ${
              resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              A primeira plataforma que combina gestão financeira pessoal com inteligência artificial preditiva.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/auth/register"
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                onClick={() => handleClick('hero_cta')}
              >
                Comece Grátis 
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button 
                className={`flex items-center justify-center px-8 py-4 rounded-lg font-bold transition border group ${
                  resolvedTheme === 'dark' 
                    ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' 
                    : 'bg-gray-900/10 text-gray-900 hover:bg-gray-900/20 border-gray-900/20'
                }`}
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

        <motion.div
          animate={controls}
          initial={{ opacity: 0, y: 20 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className={`animate-bounce w-8 h-14 rounded-full border-2 flex justify-center p-1 ${
            resolvedTheme === 'dark' ? 'border-gray-400' : 'border-gray-600'
          }`}>
            <div className={`w-1 h-2 rounded-full ${
              resolvedTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
            }`}></div>
          </div>
        </motion.div>
      </section>

      {/* Seção de Métricas */}
      <section id="recursos" className={`py-20 ${
        resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${
                  resolvedTheme === 'dark' 
                    ? 'bg-gray-800/50 border border-gray-700' 
                    : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
                } rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300`}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <CountUp 
                    end={metric.value} 
                    suffix={metric.suffix}
                    duration={2.5}
                    decimals={metric.value % 1 ? 1 : 0}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                  />
                </div>
                <p className={`text-sm uppercase tracking-wider ${
                  resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {metric.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Recursos */}
      <section id="solucoes" className={`py-20 ${
        resolvedTheme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tecnologia <span className="text-blue-400">Exclusiva</span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
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
                      : resolvedTheme === 'dark'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                      <h3 className={`text-3xl font-bold mb-6 ${
                        resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {['Painel Inteligente', 'Carteira Global', 'Automatização', 'Proteção'][index]}
                      </h3>
                      <p className={`mb-8 text-lg ${
                        resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
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
                            <span className={resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative">
                      <div className={`relative rounded-2xl overflow-hidden border shadow-2xl ${
                        resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <Image
                          src={`/features/${['dashboard', 'investiments', 'savings', 'security'][index]}.jpg`}
                          alt={['Painel Financeiro', 'Investimentos', 'Economia', 'Segurança'][index]}
                          width={800}
                          height={600}
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

      {/* Seção de Depoimentos */}
      <section id="clientes" className={`py-20 ${
        resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              O que dizem nossos <span className="text-purple-400">clientes</span>
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Veja como estamos transformando vidas financeiras
            </p>
          </div>

          <div ref={ref}>
            <Splide options={splideOptions} aria-label="Depoimentos">
              {testimonials.map((testimonial, index) => (
                <SplideSlide key={index}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 50 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    initial="hidden"
                    animate={controls}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`${
                      resolvedTheme === 'dark' 
                        ? 'bg-gray-800 border-gray-700/50 hover:border-purple-500/30' 
                        : 'bg-white border-gray-200/50 hover:border-purple-500/30 shadow-lg'
                    } rounded-2xl p-8 h-full border transition-all`}
                  >
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <FiStar 
                          key={i} 
                          className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <p className={`mb-8 italic text-lg ${
                      resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>&quot;{testimonial.content}&quot;</p>
                    <div className="flex items-center">
                      <Image
                        src={`/testimonials/client${index + 1}.jpg`}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full mr-4"
                        loading="lazy"
                      />
                      <div>
                        <h4 className={`font-bold ${
                          resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{testimonial.name}</h4>
                        <p className={`text-sm ${
                          resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{testimonial.role}</p>
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
      <section id="contato" className={`relative py-32 overflow-hidden ${
        resolvedTheme === 'dark' 
          ? 'bg-gradient-to-br from-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50'
      }`}>
        <div className={`absolute inset-0 opacity-20 ${
          resolvedTheme === 'dark' 
            ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black'
            : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-gray-900'
        }`}></div>

        <div className="relative container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-4xl md:text-6xl font-bold mb-8 ${
              resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Pronto para a <span className={resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'}>revolução</span> financeira?
            </h2>
            <p className={`text-xl max-w-3xl mx-auto mb-12 ${
              resolvedTheme === 'dark' ? 'text-blue-200' : 'text-blue-900'
            }`}>
              Junte-se a mais de 15.000 usuários que já transformaram sua relação com o dinheiro.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href="/auth/register"
                className={`px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center ${
                  resolvedTheme === 'dark'
                    ? 'bg-white text-blue-900 hover:bg-gray-100 hover:shadow-blue-500/20'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/20'
                }`}
                onClick={() => handleClick('final_cta')}
              >
                Comece Agora 
              </Link>

              <Link
                href="/demo"
                className={`px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center border-2 ${
                  resolvedTheme === 'dark'
                    ? 'bg-transparent border-white text-white hover:bg-white/10'
                    : 'bg-transparent border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
                onClick={() => handleClick('demo_cta')}
              >
                <FiPlay className="mr-2" />
                Agendar Demonstração
              </Link>
            </div>

            <p className={`mt-8 text-sm ${
              resolvedTheme === 'dark' ? 'text-blue-300/80' : 'text-blue-800/80'
            }`}>
              Sem compromisso • Cancelamento a qualquer momento • Criptografia bancária
            </p>
          </motion.div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className={`py-16 ${
        resolvedTheme === 'dark'
          ? 'bg-gray-950 text-gray-400'
          : 'bg-gray-100 text-gray-700'
      }`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-white w-6 h-6" />
                </div>
                <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 ${
                  resolvedTheme === 'dark' ? '' : 'text-gray-900'
                }`}>
                  Fin<span className={resolvedTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'}>NEXTHO</span>
                </span>
              </Link>
              <p className={`mb-6 ${
                resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                A plataforma financeira mais avançada do mercado, com tecnologia de ponta para transformar sua relação com o dinheiro.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: <FiTwitter className="w-5 h-5" />, name: 'X', url: 'https://x.com' },
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      resolvedTheme === 'dark' 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900'
                    }`}
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
              <h3 className={`font-bold text-lg mb-6 ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Produto</h3>
              <ul className="space-y-3">
                {filteredMenuItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path}
                      className={`hover:transition-colors ${
                        resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'
                      }`}
                      onClick={() => handleClick(`footer_${item.name.toLowerCase()}`)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`font-bold text-lg mb-6 ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Empresa</h3>
              <ul className="space-y-3">
                {[
                  { name: 'Sobre', path: '/sobre' },
                  { name: 'Carreiras', path: '/carreiras' },
                  { name: 'Blog', path: '/blog' },
                  { name: 'Parceiros', path: '/parceiros' },
                  { name: 'Imprensa', path: '/imprensa' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.path}
                      className={`hover:transition-colors ${
                        resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'
                      }`}
                      onClick={() => handleClick(`footer_${item.name.toLowerCase()}`)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`font-bold text-lg mb-6 ${
                resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Jurídico</h3>
              <ul className="space-y-3">
                {[
                  { name: 'Privacidade', path: '/privacidade' },
                  { name: 'Termos', path: '/termos' },
                  { name: 'Segurança', path: '/seguranca' },
                  { name: 'Cookies', path: '/cookies' },
                  { name: 'Licenças', path: '/licencas' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.path}
                      className={`hover:transition-colors ${
                        resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'
                      }`}
                      onClick={() => handleClick(`footer_${item.name.toLowerCase()}`)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`border-t mt-16 pt-8 flex flex-col md:flex-row justify-between items-center ${
            resolvedTheme === 'dark' ? 'border-gray-800' : 'border-gray-300'
          }`}>
            <p className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              © {new Date().getFullYear()} FinNEXTHO. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                href="/termos" 
                className={`hover:transition-colors ${
                  resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'
                }`}
                onClick={() => handleClick('footer_terms')}
              >
                Termos de Serviço
              </Link>
              <Link 
                href="/privacidade" 
                className={`hover:transition-colors ${
                  resolvedTheme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'
                }`}
                onClick={() => handleClick('footer_privacy')}
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
