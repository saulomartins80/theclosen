# Correção Firebase Render

## Problema
Erro `auth/argument-error` - variáveis de ambiente não configuradas

## Solução

### 1. Firebase Console
- Acesse https://console.firebase.google.com/
- Selecione seu projeto
- Configurações > Geral > Configuração do SDK

### 2. Render Dashboard
- Acesse https://dashboard.render.com/
- Serviço: finnextho-frontend
- Environment > Adicionar variáveis:

```
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Firebase Auth
- Authentication > Sign-in method
- Habilitar Google
- Domínios autorizados: finnextho-frontend.onrender.com

### 4. Redeploy
- Manual Deploy no Render 