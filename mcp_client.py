#!/usr/bin/env python3
"""
> **GOS3** · agente: `Claude` · papel: `Proposer` (ver docs/team.md)
> fase: `Technical Refinement` · data: `2026-08-24`
> antes: mcp_client.py existia só em dump/documento, nunca no filesystem real
> depois: cliente real com verificação de evidence_hash — prova conexão MCP
>   de verdade, não simulação
> base: código analisado no dump (documento 24 desta conversa)
> assinatura: `Claude · Proposer · GOS3`
> status: PROPOSTO — aguarda confirmação do PO

MCP Client GOS3.

Uso standalone (teste de conectividade):
    python3 mcp_client.py

Uso como módulo:
    from mcp_client import MCPClient
    client = MCPClient("http://localhost:8000")
    result = await client.call_tool("execute_command", {"command": "echo ok"})

Variável de ambiente:
    MCP_SERVER_URL=http://localhost:8000  (default)
"""

import asyncio
import hashlib
import json
import os
import sys
from typing import Any


class MCPClient:
    def __init__(self, server_url: str | None = None):
        self.server_url = server_url or os.getenv("MCP_SERVER_URL", "http://localhost:8000")

    async def _post(self, path: str, payload: dict) -> dict:
        try:
            import aiohttp
        except ImportError:
            raise RuntimeError("pip install aiohttp --break-system-packages")

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.server_url}{path}", json=payload) as r:
                return await r.json()

    async def _get(self, path: str) -> dict:
        try:
            import aiohttp
        except ImportError:
            raise RuntimeError("pip install aiohttp --break-system-packages")

        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.server_url}{path}") as r:
                return await r.json()

    async def health(self) -> dict:
        return await self._get("/health")

    async def list_tools(self) -> list:
        r = await self._get("/tools/list")
        return r.get("tools", [])

    async def call_tool(self, name: str, arguments: dict) -> dict:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments},
        }
        result = await self._post("/sse", payload)
        return result.get("result", result)

    @staticmethod
    def verify_evidence(result: dict) -> bool:
        """Verifica se o evidence_hash bate com o conteúdo de result."""
        if "evidence_hash" not in result or "result" not in result:
            return False
        claimed_hash = result["evidence_hash"]
        payload = json.dumps(result["result"], sort_keys=True, default=str).encode()
        computed = hashlib.sha256(payload).hexdigest()
        return claimed_hash == computed


async def run_preflight_tests(client: MCPClient) -> int:
    """Roda bateria de testes de pré-voo. Retorna número de falhas."""
    failures = 0

    def ok(msg: str):
        print(f"  ✅ {msg}")

    def fail(msg: str):
        nonlocal failures
        print(f"  ❌ {msg}")
        failures += 1

    def warn(msg: str):
        print(f"  ⚠️  {msg}")

    print("\n=== MCP Client GOS3 — Preflight Tests ===\n")

    # 1. Health check
    print("1. Health check")
    try:
        h = await client.health()
        r = h.get("result", h)
        if r.get("executed") or h.get("executed"):
            ok(f"Servidor respondeu — versão: {r.get('server', '?')}")
        else:
            fail("Health check retornou executed: false")
        if not r.get("github_token_present"):
            warn("GITHUB_TOKEN ausente — GitHub tools inativas (esperado se não configurou)")
    except Exception as e:
        fail(f"Não conseguiu conectar em {client.server_url}: {e}")
        print("\n⛔ Servidor não está rodando. Inicie com: python3 mcp_server.py")
        return 1

    # 2. Lista de tools
    print("\n2. Lista de tools disponíveis")
    try:
        tools = await client.list_tools()
        names = [t["name"] for t in tools]
        expected = {"health_check", "execute_command", "execute_repository_action", "read_file"}
        missing = expected - set(names)
        if missing:
            fail(f"Tools ausentes: {missing}")
        else:
            ok(f"Todas as {len(tools)} tools presentes: {names}")
    except Exception as e:
        fail(f"list_tools falhou: {e}")

    # 3. Execução real com evidence_hash verificável
    print("\n3. Execução real + verificação de evidence_hash")
    try:
        result = await client.call_tool("execute_command", {"command": "echo GOS3_PROOF_$(date +%s)"})
        if result.get("executed"):
            stdout = result.get("result", {}).get("stdout", "").strip()
            ok(f"Comando executado: stdout='{stdout}'")
            if client.verify_evidence(result):
                ok(f"evidence_hash verificado: {result['evidence_hash'][:16]}...")
            else:
                fail("evidence_hash NÃO bate com o conteúdo — possível fabricação ou corrupção")
        else:
            fail(f"execute_command retornou executed: false — claim: {result.get('claim')}")
    except Exception as e:
        fail(f"execute_command falhou: {e}")

    # 4. Teste anti-fabricação: comando fora da allowlist DEVE falhar
    print("\n4. Anti-fabricação: comando fora da allowlist")
    try:
        result = await client.call_tool("execute_command", {"command": "rm -rf /tmp/gos3test"})
        if not result.get("executed") and result.get("claim") == "not_executed":
            ok("Allowlist funcionando: 'rm' bloqueado com claim: not_executed")
        else:
            fail("CRÍTICO: comando 'rm' foi aceito — allowlist não está funcionando")
    except Exception as e:
        fail(f"Teste de allowlist falhou inesperadamente: {e}")

    # 5. GitHub sem token deve retornar not_executed, nunca sucesso falso
    print("\n5. GitHub sem token deve retornar claim: not_executed")
    try:
        result = await client.call_tool("execute_repository_action", {
            "action": "list_issues",
            "repo": "scoobiii/vortex",
        })
        h = await client.health()
        token_present = h.get("result", h).get("github_token_present", False)
        if token_present:
            warn("GITHUB_TOKEN está presente — pulando teste de 'sem token'")
            if result.get("executed"):
                ok("Com token presente, execução confirmada como real")
            else:
                fail(f"Com token presente, ainda retornou executed: false — claim: {result.get('claim')}")
        else:
            if not result.get("executed") and result.get("claim") == "not_executed":
                ok("Sem token: retornou claim: not_executed — sem fabricação de sucesso")
            else:
                fail(f"CRÍTICO: sem GITHUB_TOKEN mas retornou executed: {result.get('executed')} — FABRICAÇÃO DETECTADA")
    except Exception as e:
        fail(f"Teste GitHub falhou: {e}")

    print(f"\n{'='*44}")
    if failures == 0:
        print("✅ Todos os testes passaram. MCP Server GOS3 funcionando corretamente.")
    else:
        print(f"❌ {failures} falha(s). Revisar antes de conectar agentes externos.")
    print()

    return failures


if __name__ == "__main__":
    url = os.getenv("MCP_SERVER_URL", "http://localhost:8000")
    if len(sys.argv) > 1:
        url = sys.argv[1]

    client = MCPClient(url)
    failures = asyncio.run(run_preflight_tests(client))
    sys.exit(0 if failures == 0 else 1)
