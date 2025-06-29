// pages/configuracoes.tsx
import { useState, useEffect, useCallback } from 'react';
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
  FiShield,
  FiTrash2,
  FiKey,
  FiHardDrive,
  FiPlusCircle // Novo ícone para adicionar notificação de exemplo
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useTheme, Theme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import DangerZone from '../components/DangerZone';
import Modal from "../components/Modal";
import PasswordChangeForm from "../components/PasswordChangeForm";
import TwoFactorAuthSetup from "../components/TwoFactorAuthSetup";
import { useRouter } from 'next/router';
import Notifications, { NotificationItem } from '../components/Notifications'; // Importe o componente e tipo

interface Settings {
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dataSharing: boolean;
  currency: string;
  twoFactorEnabled: boolean;
  backupFrequency: string;
  sessionTimeout: number;
}

export default function ConfiguracoesPage() {
  const { user, updateUserContextProfile } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'in-progress' | 'completed' | 'failed'>('idle');
  const router = useRouter();

  // Estado local para notificações de exemplo
  const [sampleNotifications, setSampleNotifications] = useState<NotificationItem[]>([]);
  const [notificationCounter, setNotificationCounter] = useState(0);

  const [settings, setSettings] = useState<Settings>({
    language: 'pt-BR',
    emailNotifications: true,
    pushNotifications: true,
    dataSharing: false,
    currency: 'BRL',
    twoFactorEnabled: false,
    backupFrequency: 'weekly',
    sessionTimeout: 30
  });

  const loadInitialData = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists() && docSnap.data().settings) {
        const userSettings = docSnap.data().settings as Partial<Settings>;
        setSettings(prev => ({
          ...prev,
          ...userSettings,
          twoFactorEnabled: userSettings.twoFactorEnabled || false
        }));
      }
    } catch (error) {
      console.error('[ConfiguracoesPage] Error loading initial data:', error);
      toast.error('Erro ao carregar dados da página.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSettingChange = (key: keyof Settings, value: any) => {
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

  const handleBackupData = async () => {
    setBackupStatus('in-progress');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBackupStatus('completed');
      toast.success('Backup dos dados realizado com sucesso!');
    } catch (error) {
      setBackupStatus('failed');
      toast.error('Falha ao realizar backup dos dados.');
    } finally {
      setTimeout(() => setBackupStatus('idle'), 3000);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    toast.success('Senha alterada com sucesso!');
  };

  const handle2FASetupComplete = (success: boolean) => {
    setShow2FAModal(false);
    if (success) {
      const updatedSettings = { ...settings, twoFactorEnabled: true };
      setSettings(updatedSettings);
      saveSettings();
      toast.success('Autenticação de dois fatores ativada com sucesso!');
    } else {
      toast.error('Falha na configuração da Autenticação de Dois Fatores.');
    }
  };

  // Funções para gerenciar notificações de exemplo
  const addSampleNotification = (type: NotificationItem['type'], message: string) => {
    setNotificationCounter(prev => prev + 1);
    const newNotification: NotificationItem = {
      id: `sample-${notificationCounter}`,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    setSampleNotifications(prev => [newNotification, ...prev]);
    toast.info(`Nova notificação de exemplo: ${message}`);
  };

  const markSampleAsRead = (id: string) => {
    setSampleNotifications(sampleNotifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllSampleAsRead = () => {
    setSampleNotifications(sampleNotifications.map(n => ({ ...n, read: true })));
  };

  interface SettingOption {
    value: string | number | Theme;
    label: string;
    icon?: React.ReactNode;
  }

  interface AccountSetting {
    name: keyof Settings | 'themeSelector' | 'changePassword' | 'backup';
    label: string;
    description: string;
    type: "toggle" | "select" | "radiogroup" | "action";
    options?: SettingOption[];
    currentValue?: any;
    onChange?: (value: any) => void;
    icon: React.ReactNode;
    action?: () => void;
    status?: string;
  }

  const accountSettings: AccountSetting[] = [
    {
      name: "themeSelector",
      label: "Tema",
      description: "Escolha o tema da interface",
      type: "radiogroup",
      options: [
        { value: "light", label: "Claro", icon: <FiSun className="h-5 w-5 mr-2" /> },
        { value: "dark", label: "Escuro", icon: <FiMoon className="h-5 w-5 mr-2" /> },
        { value: "system", label: "Sistema", icon: <FiMonitor className="h-5 w-5 mr-2" /> }
      ],
      currentValue: theme,
      onChange: handleThemeChange,
      icon: resolvedTheme === 'dark' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />
    },
    {
      name: "language",
      label: "Idioma",
      description: "Selecione o idioma da interface",
      type: "select",
      options: [
        { value: "pt-BR", label: "Português (Brasil)" },
        { value: "en-US", label: "English (US)" },
      ],
      currentValue: settings.language,
      onChange: (value) => handleSettingChange('language', value),
      icon: <FiGlobe className="h-5 w-5" />
    },
    {
      name: "currency",
      label: "Moeda Padrão",
      description: "Selecione a moeda padrão para exibição de valores",
      type: "select",
      options: [
        { value: "BRL", label: "Real Brasileiro (R$)" },
        { value: "USD", label: "Dólar Americano (US$)" },
        { value: "EUR", label: "Euro (€)" }
      ],
      currentValue: settings.currency,
      onChange: (value) => handleSettingChange('currency', value),
      icon: <FiCreditCard className="h-5 w-5" />
    }
  ];

  const notificationSettings: AccountSetting[] = [
    {
      name: "emailNotifications",
      label: "Notificações por email",
      description: "Receba atualizações importantes por email",
      type: "toggle",
      currentValue: settings.emailNotifications,
      onChange: (value) => handleSettingChange('emailNotifications', value),
      icon: <FiMail className="h-5 w-5" />
    },
    {
      name: "pushNotifications",
      label: "Notificações push",
      description: "Receba notificações em tempo real no seu dispositivo",
      type: "toggle",
      currentValue: settings.pushNotifications,
      onChange: (value) => handleSettingChange('pushNotifications', value),
      icon: <FiBell className="h-5 w-5" />
    }
  ];

  const privacySettings: AccountSetting[] = [
    {
      name: "dataSharing",
      label: "Compartilhamento de dados de uso",
      description: "Permita o uso de dados anonimizados para melhorar nossos serviços",
      type: "toggle",
      currentValue: settings.dataSharing,
      onChange: (value) => handleSettingChange('dataSharing', value),
      icon: <FiDatabase className="h-5 w-5" />
    },
    {
      name: "sessionTimeout",
      label: "Tempo limite da sessão",
      description: "Minutos de inatividade antes do logout automático",
      type: "select",
      options: [
        { value: 15, label: "15 minutos" },
        { value: 30, label: "30 minutos" },
        { value: 60, label: "1 hora" },
        { value: 1440, label: "24 horas (Não recomendado em dispositivos compartilhados)" }
      ],
      currentValue: settings.sessionTimeout,
      onChange: (value) => handleSettingChange('sessionTimeout', Number(value)),
      icon: <FiShield className="h-5 w-5" />
    }
  ];

  const securitySettings: AccountSetting[] = [
    {
      name: "twoFactorEnabled",
      label: "Autenticação de dois fatores",
      description: "Adicione uma camada extra de segurança à sua conta",
      type: "action",
      icon: <FiKey className="h-5 w-5" />,
      action: () => setShow2FAModal(true),
      status: settings.twoFactorEnabled ? "Ativado" : "Desativado"
    },
    {
      name: "changePassword",
      label: "Alterar senha",
      description: "Atualize sua senha regularmente para maior segurança",
      type: "action",
      icon: <FiLock className="h-5 w-5" />,
      action: () => setShowPasswordModal(true)
    },
    {
      name: "backup",
      label: "Backup dos dados",
      description: "Faça backup de todas as suas informações financeiras",
      type: "action",
      icon: <FiHardDrive className="h-5 w-5" />,
      action: handleBackupData,
      status: backupStatus === 'completed' ? "Último backup: Hoje" :
              backupStatus === 'in-progress' ? "Backup em andamento..." :
              backupStatus === 'failed' ? "Falha no último backup" : "Nunca realizado ou status desconhecido"
    }
  ];

  const inputBaseClasses = "w-full p-2 border rounded-lg focus:outline-none focus:ring-2";
  const inputThemeClasses = resolvedTheme === 'dark'
    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400';

  const renderSettingControl = (setting: AccountSetting) => {
    switch (setting.type) {
      case "toggle":
        return (
          <button
            type="button"
            onClick={() => setting.onChange?.(!setting.currentValue)}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        ${setting.currentValue
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-600'
                        }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${setting.currentValue
                              ? 'translate-x-5'
                              : 'translate-x-0'}`}
            />
          </button>
        );
      case "select":
        return (
          <select
            value={String(setting.currentValue)}
            onChange={(e) => setting.onChange?.(e.target.value)}
            className={`mt-1 block w-full sm:w-48 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md focus:outline-none ${inputBaseClasses} ${inputThemeClasses}`}
          >
            {setting.options?.map((option) => (
              <option key={String(option.value)} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "radiogroup":
        return (
          <div className="flex items-center space-x-2">
            {setting.options?.map((option) => (
              <button
                key={String(option.value)}
                onClick={() => setting.onChange?.(option.value as Theme)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                            ${setting.currentValue === option.value
                              ? resolvedTheme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                              : resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>
        );
      case "action":
        return (
          <>
          <button
            onClick={setting.action}
            disabled={backupStatus === 'in-progress' && setting.name === 'backup'}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
               resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } ${backupStatus === 'in-progress' && setting.name === 'backup' ? '' : 'shadow-sm'}`}
          >
            {backupStatus === 'in-progress' && setting.name === 'backup' ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {setting.name === 'twoFactorEnabled' ? (settings.twoFactorEnabled ? 'Gerenciar' : 'Ativar') :
             setting.name === 'backup' ? 'Executar Backup' : 'Alterar'}
          </button>
           {setting.name === 'twoFactorEnabled' && settings.twoFactorEnabled && (
              <button
                 onClick={() => setShow2FAModal(true)}
                 className={`ml-2 px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm ${
                    resolvedTheme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                 }`}
              >
                 Desativar
              </button>
           )}
           </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      resolvedTheme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Modals */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Alterar Senha"
      >
        <PasswordChangeForm
          onSuccess={handlePasswordChangeSuccess}
          onCancel={() => setShowPasswordModal(false)}
        />
      </Modal>

      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title={settings.twoFactorEnabled ? "Gerenciar Autenticação de Dois Fatores" : "Configurar Autenticação de Dois Fatores"}
        size="lg"
      >
        <TwoFactorAuthSetup
          onComplete={handle2FASetupComplete}
          currentStatus={settings.twoFactorEnabled}
        />
      </Modal>

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
                {[
                  { id: 'account', label: 'Conta', icon: <FiUser className="mr-3" /> },
                  { id: 'notifications', label: 'Notificações', icon: <FiBell className="mr-3" /> },
                  { id: 'privacy', label: 'Privacidade', icon: <FiDatabase className="mr-3" /> },
                  { id: 'security', label: 'Segurança', icon: <FiShield className="mr-3" /> },
                  { id: 'danger', label: 'Zona de Risco', icon: <FiTrash2 className="mr-3" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-6 py-4 flex items-center transition-colors duration-150 ${
                      activeTab === tab.id
                        ? resolvedTheme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600'
                        : resolvedTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
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
                          <div className={`p-2 rounded-lg mr-3 ${resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
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
                        {renderSettingControl(setting)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`px-6 py-4 text-right ${resolvedTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
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

                  {/* Seção para exibir notificações dinâmicas */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Suas Notificações Recentes</h3>
                      {/* Botão para adicionar notificação de exemplo */}
                      <button
                        onClick={() => addSampleNotification('info', `Notificação de Exemplo ${notificationCounter + 1}`)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${resolvedTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                      >
                        <FiPlusCircle size={16} /> Adicionar Exemplo
                      </button>
                    </div>
                    {/* Componente de Notificações */}
                    <Notifications
                      resolvedTheme={resolvedTheme}
                    />
                  </div>

                  <div className="space-y-6">
                    {notificationSettings.map((setting) => (
                      <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center">
                          <div className={`p-2 rounded-lg mr-3 ${resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                          </div>
                        </div>
                        {renderSettingControl(setting)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`px-6 py-4 text-right ${resolvedTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
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
                          <div className={`p-2 rounded-lg mr-3 ${resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                          </div>
                        </div>
                        {renderSettingControl(setting)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`px-6 py-4 text-right ${resolvedTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Configurações de Segurança</h2>
                  <div className="space-y-6">
                    {securitySettings.map((setting) => (
                      <div key={setting.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center">
                          <div className={`p-2 rounded-lg mr-3 ${resolvedTheme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                            {setting.status && (
                              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{setting.status}</p>
                            )}
                          </div>
                        </div>
                        {renderSettingControl(setting)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`px-6 py-4 text-right ${resolvedTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Zona de Risco</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ações nesta seção são irreversíveis. Por favor, proceda com cautela.
                  </p>
                  <DangerZone
                    userId={user?.uid || ''}
                    onAccountDeleted={() => {
                      if (updateUserContextProfile) updateUserContextProfile({});
                      router.push('/');
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}