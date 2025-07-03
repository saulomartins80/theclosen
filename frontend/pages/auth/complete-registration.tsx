import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthWithRegistration } from '../../src/hooks/useAuthWithRegistration';
import { completeUserRegistration } from '../../lib/firebase/autoRegistration';
import { auth } from '../../lib/firebase/client';
import { FiUser, FiPhone, FiCalendar, FiCreditCard, FiLoader, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CompleteRegistration: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuthWithRegistration();
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    cpf: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || ''
      }));
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setSubmitting(true);
      
      await completeUserRegistration(user.uid, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        cpf: formData.cpf
      });

      // Redirecionar para dashboard após cadastro completo
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao completar cadastro:', error);
      alert('Erro ao completar cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500 mx-auto"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Cabeçalho com gradiente */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Complete seu cadastro</h1>
            <p className="text-blue-100 mt-2">
              Precisamos de algumas informações adicionais
            </p>
          </div>
          
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="dateOfBirth" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data de nascimento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cpf" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  CPF
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
              className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  Completando cadastro...
                </>
              ) : (
                <>
                  Completar cadastro
                  <FiArrowRight />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteRegistration; 