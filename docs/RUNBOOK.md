> **GOS3** · agente: `SeniorOpsScrum / Gemini` · papel: `InfraGuard & Reliability` (ver docs/team.md)
> fase: `Technical Refinement (E4) & Visual Analytics Release` · data: `2026-08-22` · hora: `18:35:00 UTC`
> antes: Documentação cobria fase 4 de blindagem
> depois: Runbook determinístico atualizado GOS3 v1.2 para Termux + Proot Alpine, Docker e Cloud Run
> base: commit `gos3-core-v1.2`
> assinatura: `SeniorOpsScrum & Gemini · InfraGuard & Reliability · GOS3`

# Runbook de Inicialização Segura e Recuperação (Termux + Proot Alpine)

Este runbook define o procedimento operacional padrão (SOP) determinístico para inicialização, resolução de conflitos de porta e auditoria de credenciais do Vortex Molt Hybrid Hub (zAI).

---

## 🔒 Princípios de Segurança e Blindagem

1. **Proteção do Segredo**: `GEMINI_API_KEY` jamais deve ser exibida via `echo`, colocada em comandos diretos de console, commits ou arquivos de documentação.
2. **Localização Exclusiva**: O token reside estritamente em `~/zAI/.env`.
3. **Evitar Instalações Cíclicas**: Não execute `npm install` sem necessidade; após a primeira instalação, o ambiente já possui as dependências compiladas.
4. **Prevenção de Conflitos de Porta**: Nunca suba uma nova instância sem antes verificar se as portas `3000` (Express) e `24678` (Vite WS) estão livres.
5. **Isolamento de Filesystem**: O diretório `~/zAI` dentro do Proot Alpine é um chroot isolado. O espaço livre inspecionado fora do container (Android) não reflete o filesystem do Alpine (`df -h /`).

---

## 🛠️ Procedimento Determinístico de Startup

### 1. Entrar no Proot Alpine
```bash
proot-distro login alpine
cd ~/zAI
```

### 2. Validar e Exportar Variáveis de Ambiente
```bash
test -f .env || {
  echo "ERRO: .env não encontrado em ~/zAI/.env"
  exit 1
}

# Exporta todas as variáveis para o ambiente do processo
set -a
. ./.env
set +a

# Testa a presença da variável sem vazar o valor na saída
test -n "${GEMINI_API_KEY:-}" || {
  echo "ERRO: GEMINI_API_KEY não carregada no ambiente"
  exit 1
}

echo "✓ GEMINI_API_KEY carregada com sucesso"
```

### 3. Verificar e Limpar Instâncias Órfãs
```bash
# Verifica processos ativos
ps aux | grep -E 'node|tsx|vite' | grep -v grep

# Se houver processos antigos, finalize-os:
pkill -f 'tsx server.ts' 2>/dev/null || true
pkill -f 'vite' 2>/dev/null || true
sleep 1
```

### 4. Executar Servidor com Startup Seguro
```bash
./start.sh
# ou: npm run dev
```

### 5. Health Check Obrigatório
Em uma segunda janela ou via curl:
```bash
curl -s http://127.0.0.1:3000/api/health
```

**Critério de Sucesso**:
- `"status": "ok"`
- `"hasGeminiApiKey": true` (quando configurado no `.env`)

---

## 🚨 Troubleshooting & Matriz de Recuperação

| Sintoma | Causa Raiz | Procedimento de Correção |
|---|---|---|
| `EADDRINUSE 0.0.0.0:3000` | Instância anterior ainda ativa ocupando o socket HTTP. | `pkill -f 'tsx server.ts' && sleep 1` antes de reiniciar. |
| `WebSocket :24678 already in use` | Instância anterior do Vite dev server ativa. | `pkill -f 'vite' && pkill -f 'tsx' && sleep 1`. |
| `"hasGeminiApiKey": false` | Servidor foi iniciado antes do `export` do `.env`. | `set -a && . ~/zAI/.env && set +a` e reiniciar o servidor. |
| `df / 100% no Termux` | Partição do host Android cheia; falso positivo no Alpine. | Rodar `df -h /` dentro do Proot Alpine para checar a cota real. |
| Crash por falta de RAM no Android | Limite de memória do v8 excedido no kernel mobile. | Iniciar com flags enxutas: `export NODE_OPTIONS="--max-old-space-size=512"`. |
