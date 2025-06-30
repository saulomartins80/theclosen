# Migração para o Render - TheClosen

## Resumo da Migração

Este documento descreve a migração completa do projeto TheClosen do Docker para o Render, removendo todas as dependências do Docker e configurando o deploy automatizado.

## Arquivos Removidos (Docker)

### Backend
- ✅ `Dockerfile`
- ✅ `docker-compose.secure.yml`
- ✅ `docker-compose.simple.yml`
- ✅ `start-docker.sh`
- ✅ `start-docker-simple.sh`
- ✅ `stop-docker.sh`
- ✅ `test-docker.sh`
- ✅ `test-docker.ps1`
- ✅ `test-simple.ps1`
- ✅ `final-test.ps1`
- ✅ `nginx.conf`
- ✅ `DOCKER_SETUP.md`
- ✅ `hsm-simulator/` (diretório)
- ✅ `secrets/` (diretório)
- ✅ `docker.env`
- ✅ `mongo-init.js`
- ✅ `vercel.json`
- ✅ `.vercelignore`

### Frontend
- ✅ `vercel.json` (será removido se existir)

## Arquivos Criados/Atualizados

### Backend
- ✅ `render.yaml` - Configuração do Render para backend
- ✅ `RENDER_DEPLOYMENT.md` - Documentação de deploy
- ✅ `REDIS_SETUP.md` - Configuração específica do Redis
- ✅ `.gitignore` - Atualizado para excluir arquivos do Docker

### Frontend
- ✅ `render.yaml` - Configuração do Render para frontend
- ✅ `RENDER_DEPLOYMENT.md` - Documentação de deploy

## Configuração do Render

### 1. Backend (theclosen-backend)

**URL**: `https://theclosen-backend.onrender.com`

**Configuração**:
- Environment: Node.js
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check: `/health`

**Variáveis de Ambiente**:
```env
NODE_ENV=production
PORT=10000
MONGO_URI=<fornecida pelo Render>
JWT_SECRET=<sua chave secreta>
FIREBASE_ADMIN_PROJECT_ID=<seu projeto>
FIREBASE_ADMIN_CLIENT_EMAIL=<seu email>
FIREBASE_ADMIN_PRIVATE_KEY=<sua chave privada>
STRIPE_SECRET_KEY=<sua chave do Stripe>
STRIPE_WEBHOOK_SECRET=<seu webhook secret>
FRONTEND_URL=https://theclosen-frontend.onrender.com
REDIS_URL=redis://red-d1gsqdvgi27c73c34r8g:6379
OPENAI_API_KEY=<sua chave OpenAI>
YAHOO_FINANCE_API_KEY=<sua chave Yahoo>
ENCRYPTION_KEY=<sua chave de criptografia>
HSM_API_KEY=<sua chave HSM>
AUDIT_API_KEY=<sua chave de auditoria>
```

### 2. Frontend (theclosen-frontend)

**URL**: `https://theclosen-frontend.onrender.com`

**Configuração**:
- Environment: Node.js
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check: `/`

**Variáveis de Ambiente**:
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://theclosen-backend.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=<sua chave>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<seu domínio>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<seu projeto>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<seu bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<seu sender ID>
NEXT_PUBLIC_FIREBASE_APP_ID=<seu app ID>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<sua chave pública>
```

### 3. Database MongoDB

**Nome**: `theclosen-mongodb`
**Database**: `finnextho`
**Plan**: Starter (gratuito)

### 4. Redis Cache (finextho-redis)

**Nome**: `finextho-redis`
**URL**: `redis://red-d1gsqdvgi27c73c34r8g:6379`
**Plan**: Free (25 MB RAM, 50 conexões)
**Região**: Oregon

**Funcionalidades**:
- Cache de respostas do chatbot
- Cache de contexto do usuário
- Cache de sugestões
- Cache de análise de sentimentos
- Cache de métricas de performance

## Passos para Deploy

### 1. Preparação
1. Certifique-se de que todos os arquivos do Docker foram removidos
2. Verifique se o `render.yaml` está configurado corretamente
3. Confirme que o `.gitignore` está atualizado

### 2. Deploy no Render
1. Acesse [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie o serviço de banco de dados MongoDB primeiro
4. Crie a instância Redis (Key-Value Store)
5. Crie o serviço web do backend
6. Configure todas as variáveis de ambiente (incluindo REDIS_URL)
7. Crie o serviço web do frontend
8. Configure as variáveis de ambiente do frontend

### 3. Verificação
1. Teste o endpoint `/health` do backend
2. Teste a página inicial do frontend
3. Verifique a conexão entre frontend e backend
4. Teste as funcionalidades principais
5. Verifique a conexão com Redis

## Vantagens da Migração

### ✅ Benefícios do Render
- **Deploy automatizado** via GitHub
- **SSL gratuito** automático
- **CDN global** para melhor performance
- **Logs centralizados** e monitoramento
- **Escalabilidade** fácil
- **Integração nativa** com MongoDB e Redis

### ✅ Remoção do Docker
- **Menos complexidade** de configuração
- **Deploy mais rápido** e simples
- **Menos recursos** necessários
- **Manutenção reduzida**

### ✅ Cache com Redis
- **Performance melhorada** com cache
- **Redução de latência** da API
- **Melhor experiência** do usuário
- **Escalabilidade** do sistema

## Troubleshooting

### Problemas Comuns

1. **Build falha**
   - Verifique se todas as dependências estão no `package.json`
   - Confirme se o Node.js version está correto

2. **Variáveis de ambiente**
   - Certifique-se de que todas as variáveis estão configuradas
   - Verifique se não há espaços extras

3. **Conexão com MongoDB**
   - Confirme se a URI do MongoDB está correta
   - Verifique se o banco está acessível

4. **Conexão com Redis**
   - Verifique se `REDIS_URL` está configurada
   - Confirme se o Redis está ativo no Render

5. **CORS errors**
   - Configure o CORS corretamente no backend
   - Verifique se a URL do frontend está correta

### Logs e Debug
- Acesse o painel do Render
- Vá para "Logs" no seu serviço
- Verifique os logs de build e runtime

## Próximos Passos

1. **Deploy no Render** seguindo as instruções
2. **Teste completo** de todas as funcionalidades
3. **Configuração de domínio** personalizado (opcional)
4. **Monitoramento** e alertas
5. **Backup** do banco de dados
6. **Otimização** do cache Redis

## Suporte

Para dúvidas sobre o Render:
- [Documentação oficial](https://render.com/docs)
- [Comunidade](https://community.render.com)
- [Status do serviço](https://status.render.com)

Para dúvidas sobre Redis:
- [Documentação do ioredis](https://github.com/luin/ioredis)
- [Documentação do Render Redis](https://render.com/docs/redis)

---

**Status da Migração**: ✅ Concluída
**Data**: 29/06/2025
**Versão**: 1.0.0 