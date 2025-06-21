import React from 'react';
import Head from 'next/head';
import { Footer } from '../components/layout/Footer';
import { FiTrendingUp, FiPieChart, FiTarget, FiShield, FiUsers, FiBarChart2 } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Componentes cliente que dependem do tema
const ClientHeader = dynamic(() => import('../components/layout/ClientHeader').then(mod => mod.ClientHeader), {
  ssr: false
});

const ResourcesContent = dynamic(() => import('../components/resources/ResourcesContent'), {
  ssr: false
});

export default function Recursos() {
  const features = [
    {
      title: 'Análise de Investimentos',
      description: 'Ferramentas avançadas para análise e acompanhamento de seus investimentos.',
      icon: FiTrendingUp,
    },
    {
      title: 'Dashboard Personalizado',
      description: 'Visualize todas as suas informações financeiras em um só lugar.',
      icon: FiPieChart,
    },
    {
      title: 'Metas Financeiras',
      description: 'Defina e acompanhe suas metas com planos personalizados.',
      icon: FiTarget,
    },
    {
      title: 'Segurança Avançada',
      description: 'Proteção de dados com criptografia de ponta a ponta.',
      icon: FiShield,
    },
    {
      title: 'Comunidade Ativa',
      description: 'Conecte-se com outros investidores e compartilhe experiências.',
      icon: FiUsers,
    },
    {
      title: 'Relatórios Detalhados',
      description: 'Relatórios completos e insights sobre seus investimentos.',
      icon: FiBarChart2,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Recursos - TheClosen</title>
        <meta name="description" content="Conheça os recursos da plataforma TheClosen" />
      </Head>

      <ClientHeader />
      <ResourcesContent />
      <Footer />
    </div>
  );
} 