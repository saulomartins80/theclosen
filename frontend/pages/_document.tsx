import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR" className="light">
      <Head>
        {/* Adicione tags meta aqui se necessário */}
      </Head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}