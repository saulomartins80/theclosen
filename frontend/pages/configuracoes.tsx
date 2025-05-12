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
  FiSun,
  FiMonitor,
  FiAward // Icon for premium/test plan
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore'; 
import { toast } from 'react-toastify';
import { useTheme, Theme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { subscriptionService, Subscription } from '../services/subscriptionService';

export default function ConfiguracoesPage() {
  const { user, setUser } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false); 
  const [isPlanLoading, setIsPlanLoading] = useState(false); 
  const [activeTab, setActiveTab] = useState('account');
  const [currentUserSubscription, setCurrentUserSubscription] = useState<Subscription | null>(null);

  const [settings, setSettings] = useState({
    language: 'pt-BR',
    emailNotifications: true,
    pushNotifications: true,
    dataSharing: false,
    currency: 'BRL'
  });

  useEffect(() => {
    if (user?.uid) { 
      const loadInitialData = async () => {
        setIsLoading(true);
        try {
          const db = getFirestore();
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists() && docSnap.data().settings) {
            setSettings(docSnap.data().settings);
          }
          if (user.subscription) {
            setCurrentUserSubscription(user.subscription);
          } else {
            const subscription = await subscriptionService.getCurrentUserSubscription(user);
            setCurrentUserSubscription(subscription);
          }
        } catch (error) {
          console.error('[ConfiguracoesPage] Error loading initial data:', error);
          toast.error('Erro ao carregar dados da página.');
        } finally {
          setIsLoading(false);
        }
      };
      loadInitialData();
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
        toast.error('Usuário não autenticado. Não é possível salvar configurações.');
        setIsLoading(false);
        return;
      }
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { settings }, { merge: true }); 
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações.');
      console.error('[ConfiguracoesPage] Error saving settings to Firestore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateTestPlan = async (backendPlanId: string) => {
    if (!user?.uid) { 
      toast.error('Você precisa estar logado para ativar um plano de teste.');
      return;
    }
    setIsPlanLoading(true);
    try {
      const newSubscription = await subscriptionService.activateTestPlan(user.uid, backendPlanId);
      setCurrentUserSubscription(newSubscription);
      if (setUser) {
        setUser(prevUser => prevUser ? { ...prevUser, subscription: newSubscription } : null);
      }
      toast.success(`Plano de teste (${backendPlanId}) ativado com sucesso! Aproveite por 7 dias.`);
    } catch (error: any) {
      console.error("[ConfiguracoesPage] Error activating test plan:", error);
      toast.error(error.response?.data?.message || error.message || 'Erro ao ativar o plano de teste.');
    } finally {
      setIsPlanLoading(false);
    }
  };

  const accountSettings = [
    {
      name: "themeSelector",
      label: "Tema",
      description: "Escolha o tema da interface",
      type: "radiogroup",
      options: [
        { value: "light" as Theme, label: "Claro", icon: <FiSun className="h-5 w-5 mr-2" /> },
        { value: "dark" as Theme, label: "Escuro", icon: <FiMoon className="h-5 w-5 mr-2" /> },
        { value: "system" as Theme, label: "Sistema", icon: <FiMonitor className="h-5 w-5 mr-2" /> }
      ],
      currentValue: theme,
      onChange: handleThemeChange,
      icon: resolvedTheme === 'dark' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" /> 
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

  const plansData = [
    {
      id: 'free',
      name: 'Plano Gratuito',
      description: 'Recursos essenciais para começar a organizar suas finanças.',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        'Lançamentos manuais limitados',
        'Relatórios básicos',
        'Suporte comunitário'
      ],
      actionButton: (
        <button
          disabled={currentUserSubscription?.plan === 'free' || isPlanLoading}
          className={`mt-8 w-full px-4 py-3 rounded-md font-medium 
            ${currentUserSubscription?.plan === 'free' 
              ? 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'} 
            transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
            onClick={() => toast.info('Lógica para mudar para o plano Free ainda não implementada.')}
        >
          {currentUserSubscription?.plan === 'free' ? 'Plano Atual' : 'Mudar para Gratuito'}
        </button>
      )
    },
    {
      id: 'manual',
      name: 'Plano Manual',
      description: 'Para quem gosta de acompanhar cada detalhe e lançar manualmente.',
      priceMonthly: 19.90,
      priceYearly: 199.90,
      discount: '15% OFF no anual',
      popular: false,
      features: [
        'Lançamentos manuais ilimitados',
        'Relatórios básicos',
        'Suporte por email',
        '1 conta bancária'
      ],
      actionButton: (
        <button
          onClick={() => toast.info('Lógica de assinatura para Plano Manual ainda não implementada.')}
          disabled={currentUserSubscription?.plan === 'manual' || isPlanLoading}
          className={`mt-8 w-full px-4 py-3 rounded-md font-medium 
            ${currentUserSubscription?.plan === 'manual' 
              ? 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'} 
            transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {currentUserSubscription?.plan === 'manual' ? 'Plano Atual' : 'Assinar Plano Manual'}
        </button>
      )
    },
    {
      id: 'conectado-plus',
      name: 'Plano Conectado Plus (Teste Premium)',
      description: 'Experimente todos os recursos premium gratuitamente por 7 dias!',
      priceMonthly: 59.90, 
      priceYearly: 599.90,
      discount: '15% OFF no anual',
      popular: true,
      features: [
        'Todos os recursos premium inclusos',
        'Conexão com contas ilimitadas',
        'Relatórios personalizados e avançados',
        'Suporte prioritário 24/7',
        'Exportação para Excel e mais'
      ],
      actionButton: (
        <button
          onClick={() => handleActivateTestPlan('premium')}
          disabled={isPlanLoading || currentUserSubscription?.plan === 'premium'}
          className={`mt-8 w-full px-4 py-3 rounded-md font-medium flex items-center justify-center 
            ${currentUserSubscription?.plan === 'premium' 
              ? 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700'} 
            transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {isPlanLoading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {currentUserSubscription?.plan === 'premium' 
            ? <><FiCheck className="mr-2"/> Teste Premium Ativo</> 
            : <><FiAward className="mr-2"/>Ativar Teste Premium (7 dias)</>}
        </button>
      )
    }
  ];

  const selectBaseClasses = "bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const selectDarkClasses = "dark:bg-gray-700 dark:border-gray-600 dark:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <nav>
                {['account', 'notifications', 'privacy', 'plans'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-6 py-4 flex items-center capitalize transition-colors duration-150 ${
                      activeTab === tab 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
                  >
                    {tab === 'account' && <FiUser className="mr-3" />}
                    {tab === 'notifications' && <FiBell className="mr-3" />}
                    {tab === 'privacy' && <FiLock className="mr-3" />}
                    {tab === 'plans' && <FiCreditCard className="mr-3" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

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
                         {setting.type === "toggle" ? (
                           <button 
                            type="button" 
                            onClick={() => (setting.onChange ? setting.onChange(!settings[setting.name as keyof typeof settings]) : handleSettingChange(setting.name as keyof typeof settings, !settings[setting.name as keyof typeof settings]))} 
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                        ${(setting.name === 'themeSelector' ? (setting.currentValue !== 'system' && setting.currentValue === 'dark') : settings[setting.name as keyof typeof settings]) 
                                          ? 'bg-blue-600 dark:bg-blue-500' 
                                          : 'bg-gray-200 dark:bg-gray-600' }`}>
                             <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out 
                                             ${(setting.name === 'themeSelector' ? (setting.currentValue !== 'system' && setting.currentValue === 'dark') : settings[setting.name as keyof typeof settings]) 
                                               ? 'translate-x-5' 
                                               : 'translate-x-0'}`} />
                           </button>
                         ) : setting.type === "select" ? (
                           <select 
                            value={String(settings[setting.name as keyof typeof settings])} 
                            onChange={(e) => handleSettingChange(setting.name as keyof typeof settings, e.target.value)} 
                            className={`mt-1 block w-full sm:w-48 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md focus:outline-none ${selectBaseClasses} ${selectDarkClasses}`}>
                             {setting.options?.map((option) => (
                               <option key={option.value} value={option.value} className="text-gray-900 dark:text-white bg-white dark:bg-gray-700">
                                {option.label}
                               </option>
                               ))}
                           </select>
                         ) : setting.type === "radiogroup" ? (
                           <div className="flex items-center space-x-2">
                             {setting.options?.map((option) => (
                               <button 
                                key={option.value} 
                                onClick={() => setting.onChange(option.value as Theme)} 
                                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors 
                                            ${setting.currentValue === option.value 
                                              ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-gray-100' 
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' }`}>
                                 {option.icon} {option.label}
                               </button>
                             ))}
                           </div>
                         ) : null }
                       </div>
                     ))}
                   </div>
                 </div>
                 <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-right">
                   <button onClick={saveSettings} disabled={isLoading || isPlanLoading} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all">
                     {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Salvando...</>) : 'Salvar Alterações'}
                   </button>
                 </div>
               </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                 <div className="p-6">
                   <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações de Notificação</h2>
                   <div className="space-y-6">
                     {notificationSettings.map((setting) => (
                       <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="flex items-start sm:items-center">
                           <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">{setting.icon}</div>
                           <div>
                             <h3 className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                           </div>
                         </div>
                         <button type="button" onClick={() => handleSettingChange(setting.name as keyof typeof settings, !settings[setting.name as keyof typeof settings])} 
                                 className={`relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                             ${settings[setting.name as keyof typeof settings] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                           <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out 
                                           ${settings[setting.name as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
               </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                 <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações de Privacidade</h2>
                  <div className="space-y-6">
                    {privacySettings.map((setting) => (
                      <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">{setting.icon}</div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleSettingChange(setting.name as keyof typeof settings, !settings[setting.name as keyof typeof settings])} 
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                            ${settings[setting.name as keyof typeof settings] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out 
                                          ${settings[setting.name as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                      <Link href="/politica-de-privacidade" legacyBehavior>
                        <a className="text-blue-600 dark:text-blue-400 hover:underline">Ler nossa política de privacidade completa</a>
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
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Nossos Planos
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Escolha o plano que melhor se adapta às suas necessidades financeiras. 
                    {currentUserSubscription?.plan !== 'premium' && currentUserSubscription?.plan !== 'free' && (
                       " Ou experimente nosso plano Premium gratuitamente por 7 dias!"
                    )}
                    {currentUserSubscription?.plan === 'free' && " Você está atualmente no plano gratuito."}
                    {currentUserSubscription?.plan === 'premium' && ` Você está no plano Premium. ${(currentUserSubscription.expiresAt && new Date(currentUserSubscription.expiresAt) > new Date()) ? `Expira em: ${new Date(currentUserSubscription.expiresAt).toLocaleDateString()}` : 'Sua assinatura premium expirou.'}`}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {plansData.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -5 }}
                      className={`relative flex flex-col rounded-xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-orange-500' : 'border border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 transform translate-x-2 -translate-y-2 rotate-12">
                          TESTE PREMIUM
                        </div>
                      )}
                      <div className="p-6 flex-grow">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 min-h-[60px]">{plan.description}</p>
                        
                        <div className="mt-6">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ {plan.priceMonthly.toFixed(2)}</span>
                          <span className="text-gray-500 dark:text-gray-400">/mês</span>
                        </div>
                        {plan.priceYearly > 0 && (
                          <>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ou R$ {plan.priceYearly.toFixed(2)}/ano
                            </div>
                            {plan.discount && (
                                <div className="mt-2 text-orange-600 dark:text-orange-400 text-sm font-medium">
                                {plan.discount}
                                </div>
                            )}
                          </>
                        )}

                        <ul className="mt-6 space-y-3 flex-grow">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                              <FiCheck className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 mt-auto">
                        {plan.actionButton ? plan.actionButton : (
                          <button
                            onClick={() => toast.info(`Lógica de assinatura para ${plan.name} ainda não implementada.`)}
                            disabled={currentUserSubscription?.plan === plan.id || isPlanLoading}
                            className={`w-full px-4 py-3 rounded-md font-medium 
                              ${currentUserSubscription?.plan === plan.id 
                                ? 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white'} 
                              transition-colors disabled:opacity-70`}
                          >
                            {currentUserSubscription?.plan === plan.id ? 'Plano Atual' : `Assinar ${plan.name}`}
                          </button>
                        )}
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
