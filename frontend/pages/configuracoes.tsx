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
  FiHardDrive
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
  const { user, setUser } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'in-progress' | 'completed' | 'failed'>('idle');
  const router = useRouter();

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
      
      if (setUser && user) {
        setUser(prev => prev ? { ...prev, settings } : null);
      }
      
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
      setSettings(prev => ({ ...prev, twoFactorEnabled: true }));
      toast.success('Autenticação de dois fatores ativada com sucesso!');
    }
  };

  interface SettingOption {
    value: string | number | Theme;
    label: string;
    icon?: React.ReactNode;
  }

  interface AccountSetting {
    name: string;
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

  const notificationSettings: AccountSetting[] = [
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

  const privacySettings: AccountSetting[] = [
    {
      name: "dataSharing",
      label: "Compartilhamento de dados",
      description: "Permita que usemos seus dados para melhorar nossos serviços",
      type: "toggle",
      icon: <FiDatabase className="h-5 w-5" />
    },
    {
      name: "sessionTimeout",
      label: "Tempo de sessão",
      description: "Minutos de inatividade antes do logout automático",
      type: "select",
      options: [
        { value: 15, label: "15 minutos" },
        { value: 30, label: "30 minutos" },
        { value: 60, label: "1 hora" },
        { value: 1440, label: "24 horas" }
      ],
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
              backupStatus === 'failed' ? "Falha no último backup" : ""
    }
  ];

  const selectBaseClasses = "bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const selectDarkClasses = "dark:bg-gray-700 dark:border-gray-600 dark:text-white";

  const renderSettingControl = (setting: AccountSetting) => {
    switch (setting.type) {
      case "toggle":
        return (
          <button 
            type="button" 
            onClick={() => {
              if (setting.name === 'themeSelector') {
                // Lógica específica para o tema
                const newValue = !(theme === 'dark');
                handleThemeChange(newValue ? 'dark' : 'light');
              } else {
                handleSettingChange(
                  setting.name as keyof Settings, 
                  !settings[setting.name as keyof Settings]
                );
              }
            }} 
            className={`relative inline-flex flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                        ${(setting.name === 'themeSelector' ? (theme === 'dark') : settings[setting.name as keyof Settings]) 
                          ? 'bg-blue-600 dark:bg-blue-500' 
                          : 'bg-gray-200 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out 
                            ${(setting.name === 'themeSelector' ? (theme === 'dark') : settings[setting.name as keyof Settings]) 
                              ? 'translate-x-5' 
                              : 'translate-x-0'}`} 
            />
          </button>
        );
      case "select":
        return (
          <select 
            value={String(settings[setting.name as keyof Settings])} 
            onChange={(e) => handleSettingChange(setting.name as keyof Settings, e.target.value)} 
            className={`mt-1 block w-full sm:w-48 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md focus:outline-none ${selectBaseClasses} ${selectDarkClasses}`}
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
                              ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-gray-100' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>
        );
      case "action":
        return (
          <button
            onClick={setting.action}
            disabled={backupStatus === 'in-progress' && setting.name === 'backup'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        title="Configurar Autenticação de Dois Fatores"
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
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
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
                        {renderSettingControl(setting)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-right">
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
                        {renderSettingControl(setting)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-right">
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
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">{setting.icon}</div>
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
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-right">
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
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-3">{setting.icon}</div>
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
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-right">
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
                      if (setUser) setUser(null);
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