import React from 'react';
import Head from 'next/head';
import { Footer } from '../components/layout/Footer';
import { ClientHeader } from '../components/layout/ClientHeader';

export default function Clientes() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Clientes - TheClosen</title>
        <meta name="description" content="Conheça nossos clientes e cases de sucesso" />
      </Head>

      <ClientHeader />
      
      <main className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Nossos Clientes
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Conheça nossos clientes e cases de sucesso.
        </p>
      </main>

      <Footer />
    </div>
  );
} 