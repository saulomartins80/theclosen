import React from 'react';
import Head from 'next/head';
import { Footer } from '../components/layout/Footer';
import { ClientHeader } from '../components/layout/ClientHeader';

export default function Solucoes() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Soluções - TheClosen</title>
        <meta name="description" content="Conheça as soluções da plataforma TheClosen" />
      </Head>

      <ClientHeader />
      
      <main className="container mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Nossas Soluções
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Conheça nossas soluções personalizadas para suas necessidades financeiras.
        </p>
      </main>

      <Footer />
    </div>
  );
} 