//pages/profile.tsx
import { useAuth } from '../context/AuthContext';

// Extend the SessionUser type to include displayName
declare module '../context/AuthContext' {
  interface SessionUser {
    displayName?: string;
  }
}
import { useState, useEffect, useMemo } from 'react';
import { FiUser, FiMail, FiLock, FiCreditCard, FiEdit, FiCamera, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { toast } from 'react-toastify';
import Image from 'next/image';
import DeepSeekChat from '../components/DeepSeekChat';

export default function ProfilePage() {
  const { user, subscription, loadingSubscription, refreshSubscription } = useAuth() as {
    user: { displayName?: string; email?: string; photoUrl?: string; uid: string } | null;
    subscription: { plan?: string; status?: string; expiresAt?: string } | null;
    loadingSubscription: boolean;
    refreshSubscription: () => Promise<void>;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState('/default-avatar.png');
  const [isUploading, setIsUploading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Inicializa serviços do Firebase
  const storage = getStorage();
  const db = getFirestore();

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setAvatar(user.photoUrl || '/default-avatar.png');
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error('Você precisa estar logado para alterar a foto');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPEG, PNG ou WEBP');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 2MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload para Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `avatars/${user.uid}/avatar_${timestamp}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Atualiza Firestore com merge: true
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp(),
        ...(user.displayName && { displayName: user.displayName }),
        ...(user.email && { email: user.email }),
        createdAt: serverTimestamp()
      }, { merge: true });

      // Atualiza o perfil do auth
      await updateProfile(user as unknown as FirebaseUser, { photoURL: downloadURL });

      setAvatar(downloadURL);
      toast.success('Foto atualizada com sucesso!');
    } catch (error: unknown) {
      console.error('Erro no upload:', error);

      const errorMessages = {
        'storage/unauthorized': 'Sem permissão para upload',
        'storage/retry-limit-exceeded': 'Tempo limite excedido',
        'not-found': 'Documento não encontrado'
      };

      let errorMessage = 'Erro ao atualizar foto';

      if (error instanceof Error) {
        // Verifica se é um erro do Firebase com código
        const firebaseError = error as { code?: string };
        if (firebaseError.code && errorMessages.hasOwnProperty(firebaseError.code)) {
          errorMessage = errorMessages[firebaseError.code as keyof typeof errorMessages];
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) throw new Error('Usuário não autenticado');

      const updates: Record<string, any> = {};
      
      // Verifica mudanças antes de atualizar
      if (user && formData.displayName !== user.displayName) {
        updates.displayName = formData.displayName;
        await updateProfile(user as unknown as FirebaseUser, { displayName: formData.displayName });
      }

      if (user && formData.email !== user.email) {
        if (!formData.currentPassword) {
          throw new Error('Forneça sua senha atual para alterar o email');
        }

        const currentEmail = user.email;
        if (!currentEmail) {
          throw new Error('Email do usuário não está disponível');
        }

        try {
          const credential = EmailAuthProvider.credential(
            currentEmail,
            formData.currentPassword
          );

          // Reautentica o usuário antes de atualizar o email
          await reauthenticateWithCredential(user as unknown as FirebaseUser, credential);

          // Atualiza o email do usuário
          await updateEmail(user as unknown as FirebaseUser, formData.email);
          updates.email = formData.email;

        } catch (error: any) {
          console.error('Erro ao atualizar email:', error);

          // Lança um erro com uma mensagem clara para o usuário
          throw new Error('Falha ao atualizar email. Verifique sua senha atual.');
        }
      }

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (!user.email) {
          throw new Error('Email do usuário não está disponível');
        }
        if (!formData.currentPassword) {
          throw new Error('Forneça sua senha atual para alterar a senha');
        }

        const firebaseUser = user as unknown as FirebaseUser;

        const credential = EmailAuthProvider.credential(firebaseUser.email!, formData.currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, formData.newPassword);
      }

      // Atualiza Firestore apenas se houver mudanças
      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }

      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Aqui você pode implementar a lógica para abrir um modal
      // ou redirecionar para uma página de gerenciamento
      // Exemplo básico de atualização:
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await (user as FirebaseUser).getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid,
          plan: 'premium',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 ano
        })
      });

      if (!response.ok) throw new Error('Failed to update subscription');
      
      await refreshSubscription();
      toast.success('Assinatura atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error managing subscription:', error);
      toast.error(error.message || 'Erro ao gerenciar assinatura');
    }
  };

  const handleUpgrade = async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Atualiza a assinatura para o plano "premium"
      // Replace this with the actual implementation or import of subscriptionService
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await (user as FirebaseUser).getIdToken()}`
        },
        body: JSON.stringify({ userId: user.uid, plan: 'premium' })
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }

      // Atualiza o estado ou exibe uma mensagem de sucesso
      await refreshSubscription();
      toast.success('Assinatura atualizada para o plano Premium com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar assinatura:', error);
      toast.error(error.message || 'Erro ao atualizar assinatura. Tente novamente.');
    }
  };

  // Mapeia o status da assinatura
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chatbot */}
      <DeepSeekChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
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
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="inline mr-2" /> Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Salvando...' : (
                  <>
                    <FiCheck className="inline mr-2" /> Salvar
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiEdit className="inline mr-2" /> Editar Perfil
            </button>
          )}
        </div>

        {/* Conteúdo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* Seção de Avatar */}
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-200 overflow-hidden">
                  <Image
                    src={avatar}
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
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="bg-transparent border-b border-white text-center text-white focus:outline-none"
                  />
                ) : (
                  user?.displayName || 'Usuário'
                )}
              </h2>
              <p className="text-blue-100">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Seção de Informações Pessoais */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome Completo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          id="displayName"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      ) : (
                        <p className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                          {user?.displayName || 'Não informado'}
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      ) : (
                        <p className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                          {user?.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção de Segurança */}
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção de Assinatura */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Assinatura
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg border border-blue-100 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {subscription?.plan ? `Plano ${subscription.plan}` : 'Nenhum plano ativo'}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {subscriptionStatus}
                          {subscription?.expiresAt && ` - Válido até ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={handleManageSubscription}
                        disabled={loadingSubscription}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loadingSubscription ? 'Carregando...' : 'Gerenciar Assinatura'}
                      </button>
                      <button 
                        type="button"
                        onClick={handleUpgrade}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Upgrade para Premium
                      </button>
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