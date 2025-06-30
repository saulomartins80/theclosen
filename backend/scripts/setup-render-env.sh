#!/bin/bash

# Script para configurar todas as variáveis de ambiente no Render
# Uso: ./scripts/setup-render-env.sh

echo "🚀 Configurando variáveis de ambiente no Render..."

# Variáveis que você precisa definir manualmente (substitua pelos valores reais)
SERVICE_NAME="theclosen-backend"

# Configurar variáveis de ambiente
echo "📝 Configurando variáveis de ambiente..."

# Variáveis com valores padrão
render env set NODE_ENV production --service $SERVICE_NAME
render env set PORT 10000 --service $SERVICE_NAME
render env set FRONTEND_URL "https://theclosen-frontend.onrender.com" --service $SERVICE_NAME
render env set REDIS_URL "redis://red-d1gsqdvgi27c73c34r8g:6379" --service $SERVICE_NAME
render env set RATE_LIMIT_WINDOW_MS 900000 --service $SERVICE_NAME
render env set RATE_LIMIT_MAX 1000 --service $SERVICE_NAME

# Variáveis que precisam ser configuradas manualmente
echo "⚠️  Configure as seguintes variáveis manualmente no dashboard do Render:"
echo ""
echo "🔐 Variáveis de Segurança (configure no dashboard):"
echo "   - MONGO_URI"
echo "   - JWT_SECRET"
echo "   - APP_JWT_SECRET"
echo "   - FIREBASE_ADMIN_PROJECT_ID"
echo "   - FIREBASE_ADMIN_CLIENT_EMAIL"
echo "   - FIREBASE_ADMIN_PRIVATE_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - DEEPSEEK_API_KEY"
echo "   - YAHOO_FINANCE_API_KEY"
echo "   - ENCRYPTION_KEY"
echo "   - HSM_API_KEY"
echo "   - AUDIT_API_KEY"
echo "   - FIREBASE_STORAGE_BUCKET"
echo "   - NEXT_PUBLIC_FIREBASE_DATABASE_URL"
echo "   - OPENWEATHER_API_KEY"
echo ""

echo "✅ Script concluído!"
echo "📋 Acesse: https://dashboard.render.com/web/$SERVICE_NAME/environment" 