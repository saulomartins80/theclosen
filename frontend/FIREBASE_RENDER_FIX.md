# Correção do Firebase no Render

## Problema Identificado
O erro `auth/argument-error` indica que as variáveis de ambiente do Firebase não estão configuradas corretamente no Render.

## Solução

### 1. Acesse o Firebase Console
1. Vá para https://console.firebase.google.com/
2. Selecione seu projeto
3. Clique em ⚙️ (Configurações) > Configurações do projeto
4. Na aba "Geral", role até "Seus aplicativos"
5. Selecione o app web ou crie um novo

### 2. Copie as Configurações
Na seção "Configuração do SDK", você verá algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 3. Configure no Render
1. Acesse https://dashboard.render.com/
2. Vá para seu serviço `finnextho-frontend`
3. Clique em "Environment"
4. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Configure Autenticação no Firebase
1. No Firebase Console, vá para "Authentication"
2. Clique em "Sign-in method"
3. Habilite "Google"
4. Configure o domínio autorizado:
   - Adicione: `finnextho-frontend.onrender.com`
   - Adicione: `localhost` (para desenvolvimento)

### 5. Redeploy
1. No Render, clique em "Manual Deploy"
2. Selecione "Deploy latest commit"

### 6. Verificação
Após o deploy, teste o login com Google. Se ainda houver problemas, verifique os logs no console do navegador.

## Variáveis Obrigatórias
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Chave da API
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Domínio de autenticação
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - ID do projeto
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Bucket de storage
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - ID do sender
- `NEXT_PUBLIC_FIREBASE_APP_ID` - ID do app

## Variável Opcional
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - ID do Google Analytics (opcional)

## Teste Local
Para testar localmente, crie um arquivo `.env.local` na pasta `frontend` com as mesmas variáveis. 