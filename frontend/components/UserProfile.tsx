// components/UserProfile.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import api from "../services/api";

interface UserProfileData {
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/api/user/${user.uid}`);
        
        if (response.data) {
          setUserData(response.data);
        } else {
          throw new Error('Dados do usuário não encontrados');
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Perfil do Usuário</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <p className="mt-1 text-lg">{userData?.name || 'Não informado'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-lg">{userData?.email}</p>
        </div>
        
        {userData?.role && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Função</label>
            <p className="mt-1 text-lg capitalize">{userData.role}</p>
          </div>
        )}
        
        {userData?.createdAt && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Membro desde</label>
            <p className="mt-1 text-lg">
              {new Date(userData.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}