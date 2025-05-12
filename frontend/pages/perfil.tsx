//pages/profile.tsx
import { useAuth, SessionUser } from '../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { FiUser, FiMail, FiLock, FiCreditCard, FiEdit, FiCamera, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import Image from 'next/image';
import DeepSeekChat from '../components/DeepSeekChat';
import api from '../services/api';

interface AuthUserData {
  uid: string;
  email: string | null;
  name: string | null;
  photoUrl: string | null;
  subscription?: { plan?: string; status?: string; expiresAt?: string } | null;
}

interface ProfileAuthContextType {
  user: AuthUserData | null;
  subscription: { plan?: string; status?: string; expiresAt?: string } | null;
  loadingSubscription: boolean;
  refreshSubscription: () => Promise<void>;
  updateUserContextProfile: (updatedProfileData: Partial<SessionUser>) => void;
}

export default function ProfilePage() {
  const { 
    user, 
    subscription, 
    loadingSubscription, 
    refreshSubscription, 
    updateUserContextProfile
  } = useAuth() as ProfileAuthContextType;

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const storage = getStorage();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '', 
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAvatarPreview(user.photoUrl || '/default-avatar.png');
    }
  }, [user]);

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
        setAvatarPreview(user?.photoUrl || '/default-avatar.png');
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('A imagem deve ter menos de 2MB');
        setAvatarFile(null);
        setAvatarPreview(user?.photoUrl || '/default-avatar.png');
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
        throw new Error('Usuário não autenticado');
      }

      const updatePayload: any = {};
      let finalPhotoUrl = user.photoUrl;

      if (avatarFile) {
        setIsUploading(true);
        try {
          const timestamp = Date.now();
          const storageRef = ref(storage, `avatars/${user.uid}/avatar_${timestamp}`);
          await uploadBytes(storageRef, avatarFile);
          finalPhotoUrl = await getDownloadURL(storageRef);
          updatePayload.photoUrl = finalPhotoUrl;
        } catch (error) {
          console.error('Erro no upload da foto:', error);
          toast.error('Falha ao carregar a nova foto.');
          setIsUploading(false);
          setIsLoading(false);
          return;
        } finally {
           setIsUploading(false);
        }
      }

      if (formData.name !== user.name) {
        updatePayload.name = formData.name;
      }

      if (formData.email !== user.email) {
         if (!formData.currentPassword) {
            throw new Error('Forneça sua senha atual para alterar o email');
          }
         updatePayload.email = formData.email;
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
      }

      if (Object.keys(updatePayload).length > 0) {
         console.log('Sending update payload to backend:', updatePayload);
         const response = await api.put('/api/users/profile', updatePayload);
         
         if (!response.data.success) {
            throw new Error(response.data.message || 'Falha ao atualizar perfil no backend');
         }
         
         const updatedBackendProfile = response.data.data;
         
         if (updatedBackendProfile) {
           const profileForContext: Partial<SessionUser> = {
             name: updatedBackendProfile.name,
             email: updatedBackendProfile.email,
             photoUrl: updatedBackendProfile.photoUrl,
           };
           updateUserContextProfile(profileForContext);
         } else {
           await refreshSubscription(); 
         }
      } else {
         toast.info('Nenhuma mudança para salvar.');
      }

      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (!user?.uid) throw new Error('Usuário não autenticado');
      
      // Corrigindo a URL da chamada para a API Route do Next.js
      const response = await api.post('/api/manage-subscription', { userId: user.uid });

      if (response.data && response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
         throw new Error(response.data.message || 'Não foi possível iniciar o gerenciamento da assinatura.');
      }
      
    } catch (error: any) {
      console.error('Error managing subscription:', error);
      toast.error(error.message || 'Erro ao gerenciar assinatura');
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!user?.uid) throw new Error('Usuário não autenticado');

      const response = await api.post('/api/subscription/upgrade', { userId: user.uid, plan: 'premium' });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Falha ao solicitar upgrade');
      }

      await refreshSubscription(); 
      toast.success('Solicitação de upgrade enviada! Sua assinatura será atualizada em breve.');

    } catch (error: any) {
      console.error('Erro ao solicitar upgrade:', error);
      toast.error(error.message || 'Erro ao solicitar upgrade. Tente novamente.');
    }
  };

  const subscriptionStatus = useMemo(() => {
    if (!subscription) return 'Nenhum plano ativo';

    const statusMap = {
      active: 'Ativo',
      inactive: 'Inativo',
      canceled: 'Cancelado',
      expired: 'Expirado',
      pending: 'Pendente'
    };

    return `Status: ${statusMap[subscription.status as keyof typeof statusMap] || subscription.status}`;
  }, [subscription]);

  const currentAvatarSrc = avatarPreview || user?.photoUrl || '/default-avatar.png';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gerencie suas informações pessoais e segurança
            </p>
          </div>
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                   setIsEditing(false);
                   setAvatarFile(null);
                   setAvatarPreview(user?.photoUrl || '/default-avatar.png');
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
                {isLoading || isUploading ? 'Salvando...' : (
                  <>
                    <FiCheck className="inline mr-2" /> Salvar
                  </>
                )}
              </button>
            </div>
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
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-transparent border-b border-white text-center text-white focus:outline-none placeholder-white::placeholder"
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
                      Segurança
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Senha Atual (para alterar email/senha)
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {subscription?.plan ? `Plano ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}` : 'Nenhum plano ativo'}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {subscriptionStatus}
                          {subscription?.expiresAt && ` - Válido até ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          type="button"
                          onClick={handleManageSubscription}
                          disabled={loadingSubscription}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          {loadingSubscription ? 'Carregando...' : 'Gerenciar Assinatura'}
                        </button>
                        {/* Mostrar botão de upgrade apenas se não for premium */}
                        {subscription?.plan !== 'premium' && (
                           <button 
                           type="button"
                           onClick={handleUpgrade}
                           className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors text-sm"
                         >
                           Upgrade para Premium
                         </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
