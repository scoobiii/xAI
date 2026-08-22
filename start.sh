#!/bin/sh
# ==============================================================================
# Vortex Molt Hybrid Hub (MHH) — Safe Startup & Healthcheck Script
# ==============================================================================
set -eu

APP_DIR="${HOME:-/root}/zAI"
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="$(pwd)"
fi
ENV_FILE="$APP_DIR/.env"

cd "$APP_DIR"

echo "=== 🌌 Vortex Molt Hybrid Hub (zAI) — Safe Runtime Boot ==="

# 1. Verifica existência do arquivo .env
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️ AVISO: $ENV_FILE não encontrado."
  echo "Crie o arquivo com: echo 'GEMINI_API_KEY=\"sua_chave\"' > $ENV_FILE"
  exit 1
fi
echo "✓ .env encontrado em $ENV_FILE"

# 2. Carrega .env com herança de variáveis sem exibir segredos
set -a
. "$ENV_FILE"
set +a

# 3. Valida existência de GEMINI_API_KEY sem expor o valor
if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "⚠️ AVISO: GEMINI_API_KEY está vazia ou não foi carregada."
  echo "O sistema funcionará em modo fallback determinístico (Offline)."
else
  export GEMINI_API_KEY
  echo "✓ GEMINI_API_KEY carregada e exportada para processos filhos."
fi

# 4. Limpa histórico para segurança de memória
unset HISTFILE 2>/dev/null || true

# 5. Verifica se as portas 3000 ou 24678 já estão ocupadas por instâncias órfãs
if command -v ss >/dev/null 2>&1; then
  PORT_OCCUPIED=$(ss -ltn 2>/dev/null | grep -E ':3000|:24678' || true)
elif command -v netstat >/dev/null 2>&1; then
  PORT_OCCUPIED=$(netstat -tuln 2>/dev/null | grep -E ':3000|:24678' || true)
else
  PORT_OCCUPIED=""
fi

if [ -n "$PORT_OCCUPIED" ]; then
  echo "⚠️ Detectada instância anterior ativa na porta 3000 / 24678."
  echo "Encerrando instâncias antigas para evitar EADDRINUSE..."
  pkill -f 'tsx server.ts' 2>/dev/null || true
  pkill -f 'vite' 2>/dev/null || true
  sleep 1
fi

# 6. Sobe o servidor substituindo o shell
echo "✓ Iniciando MoltBot Network (tsx server.ts)..."
echo "Acesse após o boot: http://localhost:3000"
echo

exec npm run dev
