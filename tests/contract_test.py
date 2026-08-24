#!/usr/bin/env python3
"""
🛡️ MoltBot / zAI Python Contract Validator — GOS3 v0.1 & ADR-003
Verifies:
- REGRA 1: SHA-256 Evidence Hash (64 hex)
- REGRA 2: Deterministic Output & Status Consistency
- REGRA 3 (ADR-003): Mandatory `runtime_id` (64 hex) identifying instance
- Contract Envelope v0.1 compliance
"""

import json
import hashlib
import sys

def compute_hash(payload: dict) -> str:
    unhashed = {k: v for k, v in payload.items() if k != "evidence_hash"}
    canonical = json.dumps(unhashed, sort_keys=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

def validate(payload: dict) -> tuple[bool, str]:
    if not isinstance(payload, dict):
        return False, "Payload must be a JSON object"
    
    # 1. evidence_hash verification
    if "evidence_hash" not in payload:
        return False, "REGRA 1: Missing evidence_hash"
    
    if not isinstance(payload["evidence_hash"], str) or len(payload["evidence_hash"]) != 64:
        return False, f"REGRA 1: Invalid evidence_hash format (expected 64-char hex, got {len(payload.get('evidence_hash', ''))})"

    expected = compute_hash(payload)
    if payload["evidence_hash"] != expected:
        return False, f"REGRA 1: Forged hash. Expected {expected}, got {payload['evidence_hash']}"
    
    # 2. runtime_id verification (ADR-003)
    if "runtime_id" not in payload:
        return False, "ADR-003: Missing runtime_id"
    
    if not isinstance(payload["runtime_id"], str) or len(payload["runtime_id"]) != 64:
        return False, f"ADR-003: Invalid runtime_id format (expected 64-char hex, got {len(payload.get('runtime_id', ''))})"

    # 3. Output payload consistency
    if payload.get("status") == "success" and "output" not in payload:
        return False, "REGRA 2: Success missing output payload"
    
    return True, "PASS"

def main():
    print("=================================================")
    print("🐍 MoltBot / zAI Python Contract Gate Test (v0.1 + ADR-003)")
    print("=================================================")
    
    valid_base = {
        "agent": "agent-vortex-grid",
        "action": "executeRealPython",
        "input": {"code": "print(123456)"},
        "output": {"stdout": "123456\n", "exit_code": 0},
        "status": "success",
        "duration_ms": 42,
        "contract_version": "v0.1",
        "invocation_id": "inv-123456-abc",
        "truncated": False,
        "runtime_id": hashlib.sha256(b"GOS3-RUNTIME:cloud-run:sandbox:linux:x64:1").hexdigest(),
    }
    
    valid_with_hash = dict(valid_base)
    valid_with_hash["evidence_hash"] = compute_hash(valid_base)
    
    # Case 1: Valid
    ok, msg = validate(valid_with_hash)
    assert ok, f"Expected PASS, got {msg}"
    print("✅ Case 1 [Valid Python Hash & runtime_id]: PASS")
    
    # Case 2: Missing hash
    ok_no_hash, _ = validate(valid_base)
    assert not ok_no_hash, "Should reject missing hash"
    print("✅ Case 2 [Rejection on missing hash]: PASS")
    
    # Case 3: Forged hash
    forged = dict(valid_with_hash)
    forged["evidence_hash"] = "deadbeef" * 8
    ok_forged, _ = validate(forged)
    assert not ok_forged, "Should reject forged hash"
    print("✅ Case 3 [Rejection on forged hash]: PASS")
    
    # Case 4: Missing runtime_id
    no_runtime = dict(valid_with_hash)
    del no_runtime["runtime_id"]
    no_runtime["evidence_hash"] = compute_hash(no_runtime)
    ok_no_runtime, msg_runtime = validate(no_runtime)
    assert not ok_no_runtime, "Should reject missing runtime_id"
    print("✅ Case 4 [Rejection on missing runtime_id (ADR-003)]: PASS")
    
    print("-------------------------------------------------")
    print("🏆 PYTHON CONTRACT GATE: ALL 4/4 TESTS PASSED")

if __name__ == "__main__":
    main()
