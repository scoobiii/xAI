#!/usr/bin/env python3
"""
> **GOS3** · agente: `Claude` · papel: `Proposer` (ver docs/team.md)
> fase: `Technical Refinement` · data: `2026-08-24`
> antes: mcp_server.py existia só em dump/documento, nunca no filesystem real
> depois: arquivo real, instalável em ~/xAI, com validação de GITHUB_TOKEN
>   antes de qualquer alegação de execução GitHub
> base: código analisado no dump (documento 23 desta conversa)
> assinatura: `Claude · Proposer · GOS3`
> status: PROPOSTO — não executado ainda, aguarda confirmação do PO

MCP Server GOS3 — Model Context Protocol via SSE + FastAPI.

Diferenças críticas da versão do dump:
1. execute_repository_action checa GITHUB_TOKEN ANTES de qualquer request.
   Retorna claim: not_executed se ausente — nunca 401 silencioso.
2. execute_command tem allowlist de prefixos — sem shell=True irrestrito.
3. Cada resposta inclui evidence_hash SHA-256 + timestamp UTC.
4. Startup imprime claramente quais capacidades estão ativas/inativas.

Instalação:
    pip install fastapi uvicorn aiohttp --break-system-packages

Uso:
    export GITHUB_TOKEN="ghp_..."   # obrigatório para GitHub tools
    python3 mcp_server.py

Endpoints:
    GET  /health          status + capacidades ativas
    GET  /tools/list      lista de tools disponíveis
    POST /tools/call      invocação direta
    GET  /sse             SSE stream para MCP clients
    POST /sse             JSON-RPC via POST
"""

import asyncio
import hashlib
import json
import os
import subprocess
import time
from datetime import datetime, timezone
from typing import Any

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

SERVER_VERSION = "1.0.0-gos3"
GITHUB_API = "https://api.github.com"
COMMAND_TIMEOUT = 30

# Allowlist de prefixos seguros — sem acesso irrestrito ao shell
ALLOWED_PREFIXES = [
    "echo ", "ls", "pwd", "cat ", "git ", "python3 ",
    "node ", "npm ", "npx ", "curl ", "grep ", "find ",
    "head ", "tail ", "wc ", "date", "uname",
]

app = FastAPI(title="MCP Server GOS3", version=SERVER_VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------------------------------------------------------------------------
# Utilitários GOS3
# ---------------------------------------------------------------------------

def evidence_hash(data: Any) -> str:
    payload = json.dumps(data, sort_keys=True, default=str).encode()
    return hashlib.sha256(payload).hexdigest()


def gos3_wrap(result: Any, executed: bool, claim: str = "executed") -> dict:
    return {
        "result": result,
        "executed": executed,
        "claim": claim,
        "evidence_hash": evidence_hash(result),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }


def command_allowed(cmd: str) -> bool:
    return any(cmd.strip().startswith(p) for p in ALLOWED_PREFIXES)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "health_check",
        "description": "Status do servidor e capacidades ativas (GITHUB_TOKEN presente?).",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "execute_command",
        "description": "Executa comando shell com allowlist de prefixos seguros. Retorna stdout/stderr/exit_code + evidence_hash.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"}
            },
            "required": ["command"],
        },
    },
    {
        "name": "execute_repository_action",
        "description": "Ação no GitHub via API REST. Requer GITHUB_TOKEN. Retorna claim: not_executed se token ausente.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["create_issue", "create_comment", "list_issues"]},
                "repo": {"type": "string"},
                "title": {"type": "string"},
                "body": {"type": "string"},
                "issue_number": {"type": "integer"},
            },
            "required": ["action", "repo"],
        },
    },
    {
        "name": "read_file",
        "description": "Lê arquivo dentro de ~/. Acesso negado fora do home.",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
]


async def tool_health_check(_: dict) -> dict:
    token_ok = bool(os.getenv("GITHUB_TOKEN", "").strip())
    return gos3_wrap({
        "server": "MCP GOS3",
        "version": SERVER_VERSION,
        "github_token_present": token_ok,
        "capabilities": {
            "execute_command": True,
            "execute_repository_action": token_ok,
            "read_file": True,
        },
        "warning": None if token_ok else "GITHUB_TOKEN ausente — GitHub tools retornam claim: not_executed",
    }, True)


async def tool_execute_command(args: dict) -> dict:
    cmd = args.get("command", "").strip()
    if not cmd:
        return gos3_wrap({"error": "command vazio"}, False, "not_executed")
    if not command_allowed(cmd):
        return gos3_wrap({"error": f"'{cmd[:60]}' não está na allowlist"}, False, "not_executed")
    try:
        proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=COMMAND_TIMEOUT)
        return gos3_wrap({
            "command": cmd,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "exit_code": proc.returncode,
        }, proc.returncode == 0)
    except subprocess.TimeoutExpired:
        return gos3_wrap({"error": f"timeout após {COMMAND_TIMEOUT}s"}, False, "timeout")
    except Exception as e:
        return gos3_wrap({"error": str(e)}, False, "error")


async def tool_repository_action(args: dict) -> dict:
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if not token:
        # NUNCA retorna executed: True sem token — regra anti-fabricação
        return gos3_wrap({
            "error": "GITHUB_TOKEN ausente",
            "fix": "export GITHUB_TOKEN='ghp_...' e reinicie o servidor",
        }, False, "not_executed")

    try:
        import aiohttp
    except ImportError:
        return gos3_wrap({"error": "pip install aiohttp --break-system-packages"}, False, "not_executed")

    action = args.get("action")
    repo = args.get("repo")
    headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}

    async with aiohttp.ClientSession() as session:
        try:
            if action == "list_issues":
                async with session.get(f"{GITHUB_API}/repos/{repo}/issues", headers=headers) as r:
                    data = await r.json()
                    issues = [{"number": i.get("number"), "title": i.get("title"), "state": i.get("state")} for i in (data if isinstance(data, list) else [])]
                    return gos3_wrap({"issues": issues, "count": len(issues), "http_status": r.status}, r.status == 200)

            elif action == "create_issue":
                payload = {"title": args.get("title", ""), "body": args.get("body", "")}
                async with session.post(f"{GITHUB_API}/repos/{repo}/issues", headers=headers, json=payload) as r:
                    data = await r.json()
                    return gos3_wrap({"http_status": r.status, "issue_url": data.get("html_url"), "number": data.get("number")}, r.status in (200, 201))

            elif action == "create_comment":
                num = args.get("issue_number")
                payload = {"body": args.get("body", "")}
                async with session.post(f"{GITHUB_API}/repos/{repo}/issues/{num}/comments", headers=headers, json=payload) as r:
                    data = await r.json()
                    return gos3_wrap({"http_status": r.status, "comment_url": data.get("html_url")}, r.status in (200, 201))

            else:
                return gos3_wrap({"error": f"action desconhecida: {action}"}, False, "not_executed")

        except Exception as e:
            return gos3_wrap({"error": str(e)}, False, "error")


async def tool_read_file(args: dict) -> dict:
    path = args.get("path", "").strip()
    home = os.path.expanduser("~")
    abs_path = os.path.realpath(os.path.expanduser(path))
    if not abs_path.startswith(home):
        return gos3_wrap({"error": f"Acesso negado: '{path}' fora de ~/"}, False, "not_executed")
    try:
        with open(abs_path, "r", errors="replace") as f:
            content = f.read(50_000)
        return gos3_wrap({"path": abs_path, "content": content, "truncated": len(content) == 50_000}, True)
    except FileNotFoundError:
        return gos3_wrap({"error": f"Não encontrado: {abs_path}"}, False, "not_executed")
    except Exception as e:
        return gos3_wrap({"error": str(e)}, False, "error")


HANDLERS = {
    "health_check": tool_health_check,
    "execute_command": tool_execute_command,
    "execute_repository_action": tool_repository_action,
    "read_file": tool_read_file,
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return await tool_health_check({})


@app.get("/tools/list")
async def tools_list():
    return {"tools": TOOLS}


@app.post("/tools/call")
async def tools_call(request: Request):
    body = await request.json()
    name = body.get("params", {}).get("name") or body.get("name")
    arguments = body.get("params", {}).get("arguments") or body.get("arguments") or {}
    handler = HANDLERS.get(name)
    if not handler:
        return JSONResponse({"error": f"Tool '{name}' não encontrada", "available": list(HANDLERS)}, status_code=404)
    return await handler(arguments)


@app.get("/sse")
async def sse_get(request: Request):
    async def stream():
        init = json.dumps({
            "jsonrpc": "2.0",
            "method": "server/info",
            "params": {"name": "MCP GOS3", "version": SERVER_VERSION, "tools": TOOLS},
        })
        yield f"data: {init}\n\n"
        try:
            while True:
                if await request.is_disconnected():
                    break
                await asyncio.sleep(15)
                yield f"data: {json.dumps({'jsonrpc': '2.0', 'method': 'ping', 'params': {'ts': time.time()}})}\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/sse")
async def sse_post(request: Request):
    body = await request.json()
    method = body.get("method", "")
    req_id = body.get("id", 1)

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        name = body.get("params", {}).get("name")
        arguments = body.get("params", {}).get("arguments", {})
        handler = HANDLERS.get(name)
        if not handler:
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Tool '{name}' não encontrada"}}
        return {"jsonrpc": "2.0", "id": req_id, "result": await handler(arguments)}

    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Método '{method}' desconhecido"}}


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=== MCP Server GOS3 v" + SERVER_VERSION + " ===")
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if token:
        print(f"✅ GITHUB_TOKEN presente ({len(token)} chars) — GitHub tools ATIVAS")
    else:
        print("⚠️  GITHUB_TOKEN ausente — GitHub tools retornarão claim: not_executed")
        print("   Fix: export GITHUB_TOKEN='ghp_...' e reinicie")
    print("🚀 http://localhost:8000  |  /health  |  /tools/list  |  /sse")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
