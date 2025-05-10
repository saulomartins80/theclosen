// pages/configuracoes.tsx
import { useState, useEffect } from 'react';
import { 
  FiGlobe, 
  FiBell, 
  FiDatabase, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiCreditCard,
  FiCheck,
  FiMoon,
  FiSun, // Icon for light theme
  FiMonitor // Icon for system theme
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useTheme, Theme } from '../context/ThemeContext'; // Changed import
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme(); // Using your custom hook
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Configurações do usuário
  const [settings, setSettings] = useState({
    language: 'pt-BR',
    emailNotifications: true,
    pushNotifications: true,
    dataSharing: false,
    currency: 'BRL'
  });

  // Carregar configurações do usuário
  useEffect(() => {
    if (user?.uid) {
      const loadUserSettings = async () => {
        try {
          const db = getFirestore();
          const userRef = doc(db, 'users', user.uid);
          // Implementar busca das configurações salvas
          // const docSnap = await getDoc(userRef);
          // if (docSnap.exists()) setSettings(docSnap.data().settings);
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      };
      loadUserSettings();
    }
  }, [user]);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const db = getFirestore();
      if (!user?.uid) {
        if (!user) {
          toast.error('Usuário não autenticado.');
          return;
        }
      }
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        settings // Note: theme preference itself is usually stored in localStorage or similar by the ThemeProvider
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    toast.info(`Plano ${plan} selecionado!`);
    // Implementar lógica de atualização do plano
  };

  // Seções de configurações
  const accountSettings = [
    {
      name: "themeSelector", // New name for the theme setting
      label: "Tema",
      description: "Escolha o tema da interface",
      type: "radiogroup", // Changed type to handle multiple options
      options: [
        { value: "light", label: "Claro", icon: <FiSun className="h-5 w-5 mr-2" /> },
        { value: "dark", label: "Escuro", icon: <FiMoon className="h-5 w-5 mr-2" /> },
        { value: "system", label: "Sistema", icon: <FiMonitor className="h-5 w-5 mr-2" /> }
      ],
      currentValue: theme, // Current theme from context
      onChange: handleThemeChange, // Use the new handler
      icon: resolvedTheme === 'dark' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" /> // Display icon based on resolved theme
    },
    {
      name: "language",
      label: "Idioma",
      description: "Selecione seu idioma preferido",
      type: "select",
      options: [
        { value: "pt-BR", label: "Português (Brasil)" },
        { value: "en-US", label: "English (US)" },
        { value: "es-ES", label: "Español" }
      ],
      icon: <FiGlobe className="h-5 w-5" />
    },
    {
      name: "currency",
      label: "Moeda",
      description: "Selecione a moeda padrão para exibição",
      type: "select",
      options: [
        { value: "BRL", label: "Real Brasileiro (R$)" },
        { value: "USD", label: "Dólar Americano (US$)" },
        { value: "EUR", label: "Euro (€)" }
      ],
      icon: <FiCreditCard className="h-5 w-5" />
    }
  ];

  const notificationSettings = [
    {
      name: "emailNotifications",
      label: "Notificações por email",
      description: "Receba atualizações importantes por email",
      type: "toggle",
      icon: <FiMail className="h-5 w-5" />
    },
    {
      name: "pushNotifications",
      label: "Notificações push",
      description: "Receba notificações em tempo real no seu dispositivo",
      type: "toggle",
      icon: <FiBell className="h-5 w-5" />
    }
  ];

  const privacySettings = [
    {
      name: "dataSharing",
      label: "Compartilhamento de dados",
      description: "Permita que usemos seus dados para melhorar nossos serviços",
      type: "toggle",
      icon: <FiDatabase className="h-5 w-5" />
    }
  ];

    const plans = [
    {
      id: 'manual',
      name: 'Plano Manual',
      description: 'Para quem gosta de acompanhar cada detalhe e lançar manualmente seus lançamentos.',
      priceMonthly: 19.90,
      priceYearly: 199.90,
      discount: '15% OFF',
      popular: false,
      features: [
        'Lançamentos manuais ilimitados',
        'Relatórios básicos',
        'Suporte por email',
        '1 conta bancária'
      ]
    },
    {
      id: 'conectado',
      name: 'Plano Conectado',
      description: 'Ideal para quem quer agilidade ao organizar suas finanças e tem poucas contas e cartões.',
      priceMonthly: 39.90,
      priceYearly: 399.90,
      discount: '15% OFF',
      popular: true,
      features: [
        'Todas as features do Manual',
        'Conexão com 3 contas bancárias',
        'Relatórios avançados',
        'Suporte prioritário',
        'Exportação para Excel'
      ]
    },
    {
      id: 'conectado-plus',
      name: 'Plano Conectado Plus',
      description: 'Feito para quem precisa gerenciar mais de 3 contas e cartões de forma automática.',
      priceMonthly: 59.90,
      priceYearly: 599.90,
      discount: '15% OFF',
      popular: false,
      features: [
        'Todas as features do Conectado',
        'Conexão com contas ilimitadas',
        'Relatórios personalizados',
        'Suporte 24/7',
        'Integração com contabilidade'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cabeçalho */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Configurações
          </motion.h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Personalize sua experiência e gerencie sua conta
          </p>
        </div>

        {/* Layout principal */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Menu lateral */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <nav>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full text-left px-6 py-4 flex items-center ${activeTab === 'account' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <FiUser className="mr-3" />
                  Conta
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-6 py-4 flex items-center ${activeTab === 'notifications' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <FiBell className="mr-3" />
                  Notificações
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-left px-6 py-4 flex items-center ${activeTab === 'privacy' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <FiLock className="mr-3" />
                  Privacidade
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`w-full text-left px-6 py-4 flex items-center ${activeTab === 'plans' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <FiCreditCard className="mr-3" />
                  Planos
                </button>
              </nav>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1">
            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações da Conta</h2>
                  
                  <div className="space-y-6">
                    {accountSettings.map((setting) => (
                      <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center">
                           <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">
                            {/* Display specific icon for theme setting or the general one */}
                            {setting.name === 'themeSelector' && typeof setting.icon === 'function' 
                              ? setting.icon(resolvedTheme) // If icon is a function, call it with resolvedTheme
                              : setting.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {setting.label}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.description}
                            </p>
                          </div>
                        </div>

                        {setting.type === "toggle" ? (
                          <button
                            type="button"
                            onClick={setting.onChange || (() => handleSettingChange(setting.name as keyof typeof settings, !settings[setting.name as keyof typeof settings]))}
                            className={`${
                              (setting.value !== undefined ? setting.value : settings[setting.name as keyof typeof settings]) ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                            } relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            <span
                              className={`${
                                (setting.value !== undefined ? setting.value : settings[setting.name as keyof typeof settings]) ? 'translate-x-5' : 'translate-x-0'
                              } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                          </button>
                        ) : setting.type === "select" ? ( // Check for select type
                          <select
                            value={String(settings[setting.name as keyof typeof settings])}
                            onChange={(e) => handleSettingChange(setting.name as keyof typeof settings, e.target.value)}
                            className="mt-1 block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {setting.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : setting.type === "radiogroup" ? ( // Handle radiogroup for themes
                          <div className="flex items-center space-x-2">
                            {setting.options?.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => setting.onChange(option.value as Theme)}
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                                  ${setting.currentValue === option.value 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}
                                `}
                              >
                                {option.icon}
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : null }
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-right">
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : 'Salvar Alterações'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações de Notificação</h2>
                  
                  <div className="space-y-6">
                    {notificationSettings.map((setting) => (
                      <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {setting.label}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSettingChange(setting.name as keyof typeof settings, !settings[setting.name as keyof typeof settings])}
                          className={`${
                            settings[setting.name as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          } relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          <span
                            className={`${
                              settings[setting.name as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'
                            } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações de Privacidade</h2>
                  
                  <div className="space-y-6">
                    {privacySettings.map((setting) => (
                      <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {setting.label}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {setting.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSettingChange(setting.name as keyof typeof settings, !settings[setting.name as keyof typeof settings])}
                          className={`${
                            settings[setting.name as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          } relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          <span
                            className={`${
                              settings[setting.name as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'
                            } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                    ))}

                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                      <Link href="/politica-de-privacidade" legacyBehavior>
                        <a className="text-blue-600 dark:text-blue-400 hover:underline">
                          Ler nossa política de privacidade completa
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Confira nossos planos e escolha a melhor forma de cuidar do seu dinheiro
                  </h2>
                  <div className="mt-4 flex justify-center">
                    <div className="inline-flex rounded-md shadow-sm">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium rounded-l-md bg-blue-600 text-white"
                      >
                        Anual
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium rounded-r-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Mensal
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -5 }}
                      className={`relative rounded-xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500' : 'border border-gray-200 dark:border-gray-700'}`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 transform translate-x-2 -translate-y-2 rotate-12">
                          MAIS POPULAR
                        </div>
                      )}
                      <div className="p-6 bg-white dark:bg-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{plan.description}</p>
                        
                        <div className="mt-6">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ {plan.priceMonthly.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400">/mês</span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          12x de R$ {(plan.priceMonthly).toFixed(2)} ou R$ {plan.priceYearly.toFixed(2)} à vista
                        </div>
                        <div className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {plan.discount}
                        </div>

                        <ul className="mt-6 space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                              <FiCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="ml-2 text-gray-700 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handlePlanSelect(plan.id)}
                          className={`mt-8 w-full px-4 py-3 rounded-md font-medium ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'} transition-colors`}
                        >
                          {selectedPlan === plan.id ? 'Plano Atual' : 'Assinar'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
