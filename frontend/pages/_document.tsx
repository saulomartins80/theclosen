import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR" className="light">
      <Head>
        {/* Otimização para carregamento de fontes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Carrega a fonte Inter com todos os pesos (100-900) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}