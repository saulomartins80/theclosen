#!/bin/bash

# Script para gerar secrets seguros para Docker
# Execute: chmod +x scripts/generate-secrets.sh && ./scripts/generate-secrets.sh

echo "🔐 Gerando secrets seguros para Docker..."

# Criar diretório de secrets se não existir
mkdir -p secrets

# 1. JWT Secret (64 bytes = 512 bits)
echo "Gerando JWT_SECRET..."
openssl rand -hex 64 > secrets/jwt_secret.txt
echo "✅ JWT_SECRET gerado"

# 2. Encryption Key (32 bytes = 256 bits)
echo "Gerando ENCRYPTION_KEY..."
openssl rand -hex 32 > secrets/encryption_key.txt
echo "✅ ENCRYPTION_KEY gerado"

# 3. HSM API Key
echo "Gerando HSM_API_KEY..."
openssl rand -hex 32 > secrets/hsm_api_key.txt
echo "✅ HSM_API_KEY gerado"

# 4. QWAC Certificate (simulado)
echo "Gerando QWAC_CERT..."
openssl req -x509 -newkey rsa:4096 -keyout secrets/qwac_key.pem -out secrets/qwac_cert.pem -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=Finnextho/CN=openfinance.finnextho.com"
echo "✅ QWAC_CERT gerado"

# 5. Audit API Key
echo "Gerando AUDIT_API_KEY..."
openssl rand -hex 32 > secrets/audit_api_key.txt
echo "✅ AUDIT_API_KEY gerado"

# 6. Redis Password
echo "Gerando REDIS_PASSWORD..."
openssl rand -hex 16 > secrets/redis_password.txt
echo "✅ REDIS_PASSWORD gerado"

# 7. MongoDB Root Password
echo "Gerando MONGO_ROOT_PASSWORD..."
openssl rand -hex 16 > secrets/mongo_root_password.txt
echo "✅ MONGO_ROOT_PASSWORD gerado"

# Criar Docker secrets
echo "📦 Criando Docker secrets..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Criar secrets no Docker
docker secret create jwt_secret secrets/jwt_secret.txt
docker secret create encryption_key secrets/encryption_key.txt
docker secret create hsm_api_key secrets/hsm_api_key.txt
docker secret create qwac_cert secrets/qwac_cert.pem
docker secret create qwac_key secrets/qwac_key.pem
docker secret create audit_api_key secrets/audit_api_key.txt

echo "✅ Docker secrets criados com sucesso!"

# Criar arquivo .env com as variáveis
echo "📝 Criando arquivo .env..."
cat > .env << EOF
# Secrets gerados automaticamente
JWT_SECRET=$(cat secrets/jwt_secret.txt)
ENCRYPTION_KEY=$(cat secrets/encryption_key.txt)
HSM_API_KEY=$(cat secrets/hsm_api_key.txt)
AUDIT_API_KEY=$(cat secrets/audit_api_key.txt)
REDIS_PASSWORD=$(cat secrets/redis_password.txt)
MONGO_ROOT_PASSWORD=$(cat secrets/mongo_root_password.txt)

# Configurações do ambiente
NODE_ENV=production
HSM_ENDPOINT=http://hsm-simulator:5000
MONGO_ROOT_USER=admin
MONGO_DATABASE=finnextho
MONGO_URI=mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/${MONGO_DATABASE}?authSource=admin
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# Configurações de segurança
CORS_ORIGIN=https://finnextho.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ Arquivo .env criado"

# Configurar permissões
chmod 600 .env
chmod 600 secrets/*

echo ""
echo "🎉 Todos os secrets foram gerados com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure seu certificado SSL real em ./ssl/"
echo "2. Configure o nginx.conf com seu domínio"
echo "3. Execute: docker-compose -f docker-compose.secure.yml up -d"
echo ""
echo "⚠️  IMPORTANTE:"
echo "- Mantenha os arquivos secrets/ seguros"
echo "- Nunca commite o arquivo .env no Git"
echo "- Em produção, use um HSM real (AWS CloudHSM ou Google Cloud HSM)"
echo "- Configure monitoramento e alertas"
echo ""
echo "🔐 Secrets gerados:"
ls -la secrets/
echo ""
echo "📊 Docker secrets criados:"
docker secret ls 