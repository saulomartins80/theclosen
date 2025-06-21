import React from 'react';
import Head from 'next/head';
import { Footer } from '../components/layout/Footer';
import { ClientHeader } from '../components/layout/ClientHeader';

export default function Precos() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Preços - TheClosen</title>
        <meta name="description" content="Conheça nossos planos e preços" />
      </Head>

      <ClientHeader />
      
      <main className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Nossos Planos
        </h1>
        {/* Conteúdo da página */}
      </main>

      <Footer />
    </div>
  );
} 