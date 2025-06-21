'use client';

import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { FiUser, FiMail, FiLock, FiCreditCard, FiEdit, FiCamera, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import Image from 'next/image';
import api from '../services/api';
import { getApp } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { User, Shield, CreditCard, Settings, LogOut, CheckCircle } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';

interface AuthUserData {
  uid: string;
  email: string | null;
  name: string | null;
  photoUrl?: string | null;
  photoURL?: string | null;
  subscription?: { plan?: string; status?: string; expiresAt?: string } | null;
}

interface ProfileAuthContextType {
  user: AuthUserData | null;
  subscription: { plan?: string; status?: string; expiresAt?: string } | null;
  loadingSubscription: boolean;
  refreshSubscription: () => Promise<void>;
  updateUserContextProfile: (updatedProfileData: Partial<AuthUserData>) => void;
}

interface UserData {
  name: string;
  email: string;
  subscription?: {
    status: string | undefined;
    planName: string;
  };
}

export default function Profile() {
  const {
    user,
    subscription,
    loadingSubscription,
    refreshSubscription,
    updateUserContextProfile
  } = useAuth() as ProfileAuthContextType;
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize Firebase Storage with explicit app initialization
  const storage = useMemo(() => {
    try {
      const firebaseApp = getApp();
      return getStorage(firebaseApp);
    } catch (error) {
      console.error('Failed to initialize Firebase Storage:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAvatarPreview(user.photoUrl || user.photoURL || '/default-avatar.png');
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        // Usar dados do contexto de autenticação em vez de fazer chamada separada
        if (user) {
          setUserData({
            name: user.name || '',
            email: user.email || '',
            subscription: user.subscription ? {
              status: user.subscription.status || 'unknown',
              planName: user.subscription.plan || 'Trial'
            } : undefined
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de arquivo inválido. Use JPEG, PNG ou WEBP');
        setAvatarFile(null);
        setAvatarPreview(user?.photoUrl || user?.photoURL || '/default-avatar.png');
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('A imagem deve ter menos de 2MB');
        setAvatarFile(null);
        setAvatarPreview(user?.photoUrl || user?.photoURL || '/default-avatar.png');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.uid) {
        throw new Error('Usuário não autenticado ou UID indisponível');
      }

      const updatePayload: any = {};
      let finalPhotoUrl = user.photoUrl || user.photoURL;

      if (avatarFile) {
        setIsUploading(true);
        try {
          if (!storage) {
            throw new Error('Serviço de armazenamento não disponível');
          }
          if (!user.uid) {
            throw new Error('UID do usuário indisponível para upload de avatar.');
          }
          if (!(avatarFile instanceof Blob)) {
            throw new Error('Tipo de arquivo inválido para upload.');
          }

          const timestamp = Date.now();
          const storageRef = ref(storage, `avatars/${user.uid}/avatar_${timestamp}`);
          await uploadBytes(storageRef, avatarFile);
          finalPhotoUrl = await getDownloadURL(storageRef);
          updatePayload.photoUrl = finalPhotoUrl;
        } catch (error) {
          console.error('Erro no upload da foto:', error);
          toast.error('Falha ao carregar a nova foto.');
          setAvatarFile(null);
          setAvatarPreview(user?.photoUrl || user?.photoURL || '/default-avatar.png');
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const hasProfileChanges = formData.name !== user.name || formData.email !== user.email;
      const hasPasswordChanges = formData.newPassword !== '';

      if (hasProfileChanges || hasPasswordChanges || updatePayload.photoUrl) {
        if (formData.name !== user.name && formData.name.trim() !== '') {
          updatePayload.name = formData.name.trim();
        }

        if (formData.email !== user.email && formData.email.trim() !== '') {
          if (!formData.currentPassword) {
            throw new Error('Forneça sua senha atual para alterar o email');
          }
          updatePayload.email = formData.email.trim();
          updatePayload.currentPassword = formData.currentPassword;
        }

        if (formData.newPassword) {
          if (formData.newPassword !== formData.confirmPassword) {
            throw new Error('As novas senhas não coincidem');
          }
          if (!formData.currentPassword) {
            throw new Error('Forneça sua senha atual para alterar a senha');
          }
          updatePayload.newPassword = formData.newPassword;
          updatePayload.currentPassword = formData.currentPassword;
        }

        const response = await api.put('/api/user/profile', updatePayload);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Falha ao atualizar perfil no backend');
        }

        const updatedUserData = response.data.data;
        if (updatedUserData) {
          const profileForContext: Partial<AuthUserData> = {
            ...user,
            name: updatedUserData.name !== undefined ? updatedUserData.name : user.name,
            email: updatedUserData.email !== undefined ? updatedUserData.email : user.email,
            photoUrl: updatedUserData.photoUrl !== undefined ? updatedUserData.photoUrl : user.photoUrl || user.photoURL,
            ...(updatedUserData.subscription && updatedUserData.subscription.id
              ? { subscription: updatedUserData.subscription }
              : {}),
          };
          updateUserContextProfile(profileForContext);
        } else {
          console.warn('Backend did not return updated user data.');
        }
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.info('Nenhuma mudança para salvar.');
      }

      setIsEditing(false);
      setAvatarFile(null);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      console.log('[Profile] Iniciando criação de sessão do portal...');
      const response = await api.post('/api/subscriptions/create-portal-session');
      console.log('[Profile] Resposta do portal:', response.data);
      
      // O backend retorna { url: session.url }
      if (response.data.url) {
        console.log('[Profile] Redirecionando para:', response.data.url);
        window.location.href = response.data.url;
      } else {
        console.error('[Profile] URL não encontrada na resposta:', response.data);
        throw new Error('URL do portal não encontrada na resposta');
      }
    } catch (error) {
      console.error('[Profile] Erro ao gerenciar assinatura:', error);
      toast.error('Não foi possível acessar o portal de assinatura');
    }
  };

  const subscriptionStatus = useMemo(() => {
    if (loadingSubscription) return 'Carregando status...';
    if (!subscription) return 'Nenhum plano ativo';

    const statusMap: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      canceled: 'Cancelado',
      expired: 'Expirado',
      pending: 'Pendente',
      trialing: 'Teste Gratuito',
      past_due: 'Pagamento Pendente'
    };

    const planName = subscription.plan ? `Plano ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}` : '';
    const statusText = `Status: ${statusMap[subscription.status as string] || subscription.status}`;
    const expiresText = subscription?.expiresAt && new Date(subscription.expiresAt).getTime() > Date.now()
      ? ` - Válido até ${new Date(subscription.expiresAt).toLocaleDateString()}`
      : (subscription?.status === 'active' ? ' - Data de expiração não disponível' : '');

    return `${planName} ${statusText}${expiresText}`;
  }, [subscription, loadingSubscription]);

  const currentAvatarSrc = avatarPreview || user?.photoUrl || user?.photoURL || '/default-avatar.png';

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gerencie suas informações pessoais e segurança
            </p>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(user?.photoUrl || user?.photoURL || '/default-avatar.png');
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="inline mr-2" /> Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading || isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isLoading || isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FiCheck className="inline mr-2" /> Salvar
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                <FiEdit className="inline mr-2" /> Editar Perfil
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-200 overflow-hidden">
                  <Image
                    src={currentAvatarSrc}
                    alt="Foto de perfil"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    priority
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                {isEditing && !isUploading && (
                  <>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <FiCamera className="text-white text-2xl" />
                      <span className="sr-only">Alterar foto</span>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </>
                )}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">
                {isEditing ? (
                  <input
                    type="text"
                    id="header-name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-transparent border-b border-white text-center text-white placeholder-white::placeholder focus:outline-none"
                  />
                ) : (
                  user?.name || 'Usuário'
                )}
              </h2>
              <p className="text-blue-100">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome Completo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="name"
                          name="name"
                          autoComplete="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      ) : (
                        <p className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-gray-900 dark:text-gray-200">
                          {user?.name || 'Não informado'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      ) : (
                        <p className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-gray-900 dark:text-gray-200">
                          {user?.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Segurança (Alterar Senha/Email)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Senha Atual (Necessária para alterar email ou senha)
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            autoComplete="current-password"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nova Senha
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              id="newPassword"
                              name="newPassword"
                              autoComplete="new-password"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showNewPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirmar Nova Senha
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword"
                              name="confirmPassword"
                              autoComplete="new-password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Assinatura
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-800/60 p-6 rounded-lg border border-blue-100 dark:border-gray-700">
                    {loadingSubscription ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : subscription ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Plano Atual</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                              {subscription.plan || 'Gratuito'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <p className={`text-lg font-medium capitalize ${
                              subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                            </p>
                          </div>
                        </div>

                        {subscription.expiresAt && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Próxima Renovação</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              {new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={handleManageSubscription}
                            disabled={loadingSubscription || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            {loadingSubscription || isLoading ? 'Carregando...' : 'Gerenciar Assinatura'}
                          </button>
                          {subscription?.plan !== 'premium' && (
                            <button
                              type="button"
                              onClick={() => router.push('/assinaturas')}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
                            >
                              Upgrade para Premium
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Você ainda não tem uma assinatura ativa</p>
                        <button
                          onClick={() => router.push('/assinaturas')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Ver Planos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ações
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/assinaturas')}
              className="w-full flex items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CreditCard className="w-5 h-5 text-purple-500 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Gerenciar Assinatura</span>
            </button>

            <button
              onClick={() => router.push('/configuracoes')}
              className="w-full flex items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5 text-purple-500 mr-3" />
              <span className="text-gray-700 dark:text-gray-300">Configurações</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-500"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 