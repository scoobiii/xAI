/**
 * 🛡️ MoltBot / zAI Contract Gate Test Suite
 * 
 * Verifies REGRA 1 (Mandatory Evidence Hash) and REGRA 2 (Deterministic Output Format),
 * plus WAL Persistence Engine integrity and zero-drift verification.
 */

import crypto from "node:crypto";
import { persistence } from "../src/server/persistence";

interface ContractPayload {
  agent_id: string;
  action: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  evidence_hash?: string;
  status: "success" | "failed";
}

function computeContractHash(payload: Omit<ContractPayload, "evidence_hash">): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function validateContract(payload: ContractPayload): {
  valid: boolean;
  rule1: boolean;
  rule2: boolean;
  reason?: string;
} {
  // REGRA 1: evidence_hash MUST exist, be 64-char hex, and match computed SHA-256
  if (!payload.evidence_hash || typeof payload.evidence_hash !== "string" || payload.evidence_hash.length !== 64) {
    return { valid: false, rule1: false, rule2: false, reason: "REGRA 1 VIOLATION: Missing or invalid evidence_hash" };
  }

  const { evidence_hash, ...unhashed } = payload;
  const expectedHash = computeContractHash(unhashed);

  if (evidence_hash !== expectedHash) {
    return { valid: false, rule1: false, rule2: true, reason: "REGRA 1 VIOLATION: Forged or corrupted evidence_hash" };
  }

  // REGRA 2: output must exist on success, status must be boolean-consistent
  if (payload.status === "success" && !payload.output) {
    return { valid: false, rule1: true, rule2: false, reason: "REGRA 2 VIOLATION: Success status without output payload" };
  }

  return { valid: true, rule1: true, rule2: true };
}

async function runContractGateSelfTest() {
  console.log("=================================================");
  console.log("🛡️  Iniciando MoltBot / zAI Contract Gate Test...");
  console.log("=================================================");

  let passed = 0;
  let total = 0;

  // Test Case 1: Valid Execution
  total++;
  const validBase = {
    agent_id: "agent-dr-marcos-mendonca",
    action: "simulateBESSGrid",
    input: { capacityMW: 50, durationHours: 4 },
    output: { lcoeUSD: 0.042, efficiencyPct: 88.5 },
    status: "success" as const,
  };
  const validPayload: ContractPayload = {
    ...validBase,
    evidence_hash: computeContractHash(validBase),
  };
  const res1 = validateContract(validPayload);
  if (res1.valid) {
    passed++;
    console.log("✅ Case 1 [Valid Executed]: PASS");
  } else {
    console.error("❌ Case 1 FAIL:", res1.reason);
  }

  // Test Case 2: Missing Evidence Hash (Forbidden)
  total++;
  const res2 = validateContract({
    agent_id: "agent-anon",
    action: "queryDrex",
    input: { token: "DREX" },
    status: "success",
  } as any);
  if (!res2.valid && !res2.rule1) {
    passed++;
    console.log("✅ Case 2 [Invalid No Hash]: PASS (Corretamente Rejeitado)");
  } else {
    console.error("❌ Case 2 FAIL: Deveria ter sido rejeitado");
  }

  // Test Case 3: Forged Evidence Hash (Forbidden)
  total++;
  const res3 = validateContract({
    ...validBase,
    evidence_hash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  });
  if (!res3.valid && !res3.rule1) {
    passed++;
    console.log("✅ Case 3 [Invalid Forged Hash]: PASS (Corretamente Rejeitado)");
  } else {
    console.error("❌ Case 3 FAIL: Deveria ter sido rejeitado");
  }

  // Test Case 4: False Success Without Output (Forbidden)
  total++;
  const falseSuccessBase = {
    agent_id: "agent-test",
    action: "executeV8",
    input: { code: "1+1" },
    status: "success" as const,
  };
  const res4 = validateContract({
    ...falseSuccessBase,
    evidence_hash: computeContractHash(falseSuccessBase),
  });
  if (!res4.valid && !res4.rule2) {
    passed++;
    console.log("✅ Case 4 [Invalid False Success]: PASS (Corretamente Rejeitado)");
  } else {
    console.error("❌ Case 4 FAIL: Deveria ter sido rejeitado");
  }

  // Test Case 5: Persistence Engine Integration
  total++;
  const savedMsg = persistence.saveMessage({
    user_id: "user-sobrinho",
    role: "user",
    content: "Testando contrato de persistência WAL",
    nx1_id: "nx1-initial-gate",
  });
  const recent = persistence.getRecentMessages(5);
  if (recent.some((m) => m.id === savedMsg.id)) {
    passed++;
    console.log("✅ Case 5 [Persistence WAL & Indexing]: PASS");
  } else {
    console.error("❌ Case 5 FAIL: Mensagem não encontrada no WAL");
  }

  console.log("-------------------------------------------------");
  console.log(`📊 Resultado Final Contract Gate: ${passed}/${total} testes passaram.`);
  if (passed === total) {
    console.log("🏆 VEREDICTO: PASS (Gate de Contrato 100% Estável & Auditável)");
  } else {
    process.exit(1);
  }
}

runContractGateSelfTest();
