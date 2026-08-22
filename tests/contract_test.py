#!/usr/bin/env python3
"""
🛡️ MoltBot / zAI Python Contract Validator
Verifies Contract Compliance (REGRA 1: SHA-256 Evidence Hash, REGRA 2: Output Consistency).
"""

import json
import hashlib
import sys

def compute_hash(payload: dict) -> str:
    unhashed = {k: v for k, v in payload.items() if k != "evidence_hash"}
    canonical = json.dumps(unhashed, sort_keys=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

def validate(payload: dict) -> tuple[bool, str]:
    if "evidence_hash" not in payload:
        return False, "REGRA 1: Missing evidence_hash"
    
    expected = compute_hash(payload)
    if payload["evidence_hash"] != expected:
        return False, f"REGRA 1: Forged hash. Expected {expected}, got {payload['evidence_hash']}"
    
    if payload.get("status") == "success" and "output" not in payload:
        return False, "REGRA 2: Success missing output payload"
    
    return True, "PASS"

def main():
    print("=================================================")
    print("🐍 MoltBot / zAI Python Contract Gate Test")
    print("=================================================")
    
    cases = [
        # Valid execution
        {
            "agent_id": "dra-helena-usp",
            "action": "calcBESS",
            "input": {"mw": 100},
            "output": {"cost": 450000},
            "status": "success"
        },
        # Valid with hash
        None
    ]
    
    valid_base = cases[0]
    valid_with_hash = dict(valid_base)
    valid_with_hash["evidence_hash"] = compute_hash(valid_base)
    
    ok, msg = validate(valid_with_hash)
    assert ok, f"Expected PASS, got {msg}"
    print("✅ Case 1 [Valid Python Hash]: PASS")
    
    # Missing hash
    ok_no_hash, _ = validate(valid_base)
    assert not ok_no_hash, "Should reject missing hash"
    print("✅ Case 2 [Rejection on missing hash]: PASS")
    
    # Forged hash
    forged = dict(valid_with_hash)
    forged["evidence_hash"] = "deadbeef" * 8
    ok_forged, _ = validate(forged)
    assert not ok_forged, "Should reject forged hash"
    print("✅ Case 3 [Rejection on forged hash]: PASS")
    
    print("-------------------------------------------------")
    print("🏆 PYTHON CONTRACT GATE: ALL 3/3 TESTS PASSED")

if __name__ == "__main__":
    main()
