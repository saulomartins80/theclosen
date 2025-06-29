# Deploy no Render - TheClosen Backend

## Configuração do Render

### 1. Criar conta no Render
- Acesse [render.com](https://render.com)
- Crie uma conta gratuita
- Conecte seu repositório GitHub

### 2. Configurar Web Service
- **Nome**: `theclosen-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Starter` (gratuito)

### 3. Variáveis de Ambiente
Configure as seguintes variáveis de ambiente no painel do Render:

#### Obrigatórias:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `MONGO_URI`: URI do MongoDB (fornecida pelo Render)
- `JWT_SECRET`: Chave secreta para JWT
- `FIREBASE_ADMIN_PROJECT_ID`: ID do projeto Firebase
- `FIREBASE_ADMIN_CLIENT_EMAIL`: Email do cliente Firebase Admin
- `FIREBASE_ADMIN_PRIVATE_KEY`: Chave privada do Firebase Admin
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe
- `STRIPE_WEBHOOK_SECRET`: Segredo do webhook do Stripe
- `FRONTEND_URL`: `https://theclosen-frontend.onrender.com`

#### Opcionais:
- `REDIS_URL`: URL do Redis (se usar cache)
- `OPENAI_API_KEY`: Chave da API OpenAI
- `YAHOO_FINANCE_API_KEY`: Chave da API Yahoo Finance
- `ENCRYPTION_KEY`: Chave de criptografia
- `HSM_API_KEY`: Chave da API HSM
- `AUDIT_API_KEY`: Chave da API de auditoria

### 4. Configurar Database MongoDB
- Crie um novo MongoDB no Render
- **Nome**: `theclosen-mongodb`
- **Database Name**: `finnextho`
- **Plan**: `Starter` (gratuito)

### 5. Health Check
- **Path**: `/health`
- O endpoint de health check deve retornar status 200

## Estrutura do Projeto

```
backend/
├── src/
│   ├── index.ts          # Ponto de entrada
│   ├── config/           # Configurações
│   ├── controllers/      # Controladores
│   ├── middlewares/      # Middlewares
│   ├── models/          # Modelos do MongoDB
│   ├── routes/          # Rotas da API
│   └── services/        # Serviços
├── package.json         # Dependências
├── tsconfig.json        # Configuração TypeScript
└── render.yaml          # Configuração do Render
```

## Comandos de Build

O Render executará automaticamente:
1. `npm install` - Instala dependências
2. `npm run build` - Compila TypeScript
3. `npm start` - Inicia o servidor

## Monitoramento

- **Logs**: Acessíveis no painel do Render
- **Health Check**: `/health` endpoint
- **Métricas**: Disponíveis no dashboard do Render

## Troubleshooting

### Problemas Comuns:
1. **Build falha**: Verifique se todas as dependências estão no `package.json`
2. **Variáveis de ambiente**: Confirme se todas as variáveis estão configuradas
3. **Porta**: Certifique-se de que a aplicação usa a porta definida em `PORT`
4. **MongoDB**: Verifique se a URI do MongoDB está correta

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
- Otimize queries do MongoDB
- Use cache quando possível 