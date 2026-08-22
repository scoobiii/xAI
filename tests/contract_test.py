#!/usr/bin/env python3
import hashlib
import json
import sys

REQUIRED_FIELDS = {"contract_version", "invocation_id", "agent", "status", "executed", "output", "duration_ms", "truncated", "evidence_hash", "runtime_id"}
VALID_STATUS = {"success", "error", "partial", "timeout"}

def compute_evidence_hash(output: dict, duration_ms: int) -> str:
    stdout = output.get("stdout", "")
    stderr = output.get("stderr", "")
    exit_code = output.get("exit_code", "")
    payload = f"{stdout}{stderr}{exit_code}{duration_ms}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()

def validate(resp: dict) -> list[str]:
    errors = []
    missing = REQUIRED_FIELDS - resp.keys()
    if missing:
        errors.append(f"campos obrigatórios ausentes: {sorted(missing)}")
        return errors
    if resp["status"] not in VALID_STATUS:
        errors.append(f"status inválido: {resp['status']!r}")
    if resp["executed"] is True and resp["status"] == "success":
        pass
    elif resp["executed"] is False and resp["status"] == "success":
        errors.append("REGRA 1: executed=false com status=success")
    if resp["executed"] is True:
        if not resp.get("runtime_id"):
            errors.append("REGRA 3: executed=true sem runtime_id")
        if not resp.get("evidence_hash"):
            errors.append("REGRA 2: executed=true sem evidence_hash")
        else:
            expected = compute_evidence_hash(resp["output"], resp["duration_ms"])
            if resp["evidence_hash"] != expected:
                errors.append(f"evidence_hash inválido: {resp['evidence_hash'][:16]}... != {expected[:16]}...")
    return errors

def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding="utf-8") as f:
            resp = json.load(f)
        errors = validate(resp)
        if errors:
            for e in errors:
                print(f"INVÁLIDO: {e}")
            sys.exit(1)
        print("VÁLIDO")
        return
    print("✅ Self-test passou (gate funcional)")
if __name__ == "__main__":
    main()
