import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redireciona usuários logados para o dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Cabeçalho Público */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Finanext</h1>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Login
            </Link>
            <Link 
              href="/auth/register" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Controle suas finanças com o Finanext
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A ferramenta completa para gerenciar seus investimentos, despesas e receitas.
          </p>
        </section>

        {/* Recursos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '📊',
              title: "Controle Total",
              description: "Gerencie todas suas transações em um só lugar"
            },
            {
              icon: '📈',
              title: "Relatórios Detalhados",
              description: "Visualize gráficos e relatórios completos"
            },
            {
              icon: '🔒',
              title: "Segurança",
              description: "Seus dados protegidos com criptografia"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}