'use client';

import { FiTrendingUp, FiPieChart, FiTarget, FiShield, FiUsers, FiBarChart2 } from 'react-icons/fi';

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

export default function ResourcesContent() {
  return (
    <main>
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Recursos Poderosos
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Tudo que você precisa para gerenciar suas finanças de forma inteligente
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
} 