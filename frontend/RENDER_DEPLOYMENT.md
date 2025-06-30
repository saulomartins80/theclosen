# Deploy no Render - TheClosen Frontend

## Configuração do Render

### 1. Criar conta no Render
- Acesse [render.com](https://render.com)
- Crie uma conta gratuita
- Conecte seu repositório GitHub

### 2. Configurar Web Service
- **Nome**: `theclosen-frontend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Starter` (gratuito)

### 3. Variáveis de Ambiente
Configure as seguintes variáveis de ambiente no painel do Render:

#### Obrigatórias:
- `NODE_ENV`: `production`
- `PORT`: `3000`
- `NEXT_PUBLIC_API_URL`: `https://theclosen-backend.onrender.com`
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Chave da API Firebase
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Domínio de autenticação Firebase
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: ID do projeto Firebase
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Bucket de storage Firebase
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: ID do sender Firebase
- `NEXT_PUBLIC_FIREBASE_APP_ID`: ID do app Firebase
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Chave pública do Stripe

### 4. Health Check
- **Path**: `/`
- O endpoint de health check deve retornar status 200

## Estrutura do Projeto

```
frontend/
├── pages/               # Páginas Next.js
├── components/          # Componentes React
├── context/            # Contextos React
├── services/           # Serviços de API
├── styles/             # Estilos CSS
├── public/             # Arquivos estáticos
├── package.json        # Dependências
├── next.config.js      # Configuração Next.js
└── render.yaml         # Configuração do Render
```

## Comandos de Build

O Render executará automaticamente:
1. `npm install` - Instala dependências
2. `npm run build` - Build do Next.js
3. `npm start` - Inicia o servidor

## Configuração Next.js

Certifique-se de que o `next.config.js` está configurado para produção:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
  // Outras configurações...
}

module.exports = nextConfig
```

## Monitoramento

- **Logs**: Acessíveis no painel do Render
- **Health Check**: `/` endpoint
- **Métricas**: Disponíveis no dashboard do Render

## Troubleshooting

### Problemas Comuns:
1. **Build falha**: Verifique se todas as dependências estão no `package.json`
2. **Variáveis de ambiente**: Confirme se todas as variáveis NEXT_PUBLIC_ estão configuradas
3. **Porta**: Certifique-se de que a aplicação usa a porta definida em `PORT`
4. **API URL**: Verifique se a URL da API está correta

### Logs de Debug:
- Acesse o painel do Render
- Vá para "Logs" no seu serviço
- Verifique os logs de build e runtime

## Segurança

- Todas as variáveis sensíveis devem ser configuradas como `sync: false`
- Use HTTPS em produção
- Configure CORS adequadamente
- Implemente rate limiting

## Performance

- O plano Starter tem limitações de recursos
- Considere upgrade para planos pagos se necessário
- Otimize imagens e assets
- Use cache quando possível

## Integração com Backend

- Certifique-se de que o backend está rodando antes do frontend
- Configure a URL da API corretamente
- Teste a comunicação entre frontend e backend 