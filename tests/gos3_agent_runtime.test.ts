import crypto from "node:crypto";
import { AgentSandbox } from "../src/server/sandbox.ts";

/**
 * GOS3 behavioral gate: execute the real repository sandbox/tool surface.
 * This is deliberately not a grep/static contract test.
 */

type ProbeResult = {
  toolName: string;
  success: boolean;
  evidenceHash: string;
  executionTimeMs: number;
};

function assertProbe(name: string, result: ProbeResult): void {
  if (!result || result.success !== true) {
    throw new Error(`${name}: runtime/tool execution did not succeed`);
  }
  if (!result.toolName) {
    throw new Error(`${name}: missing toolName in execution receipt`);
  }
  if (!/^0x[0-9a-f]+$/i.test(result.evidenceHash || "")) {
    throw new Error(`${name}: missing/invalid evidenceHash`);
  }
  if (!Number.isFinite(result.executionTimeMs) || result.executionTimeMs < 0) {
    throw new Error(`${name}: invalid executionTimeMs`);
  }
}

async function main(): Promise<void> {
  const executionId = crypto.randomUUID();
  const probes: Array<[string, () => unknown | Promise<unknown>]> = [
    ["sandbox.runtime", () => AgentSandbox.runtimeCheck({ testFsWrite: true })],
    ["sandbox.javascript", () => AgentSandbox.executeJavaScript("console.log('GOS3_RUNTIME_OK'); return 2 + 3;")],
    ["sandbox.python", () => AgentSandbox.executePythonSim("print('GOS3_PYTHON_OK')")],
    ["tool.energy_bess", () => AgentSandbox.calculateEnergyBESS({ solarCapacityMW: 1, bessCapacityMWh: 2, energyPricePerMWh: 45 })],
  ];

  const receipts: ProbeResult[] = [];
  for (const [name, runner] of probes) {
    const result = await runner() as ProbeResult;
    assertProbe(name, result);
    receipts.push(result);
    console.log(`PASS: ${name} | ${result.toolName} | ${result.executionTimeMs}ms | ${result.evidenceHash}`);
  }

  const evidenceId = `0x${crypto.createHash("sha256").update(JSON.stringify(receipts)).digest("hex")}`;
  console.log(`GOS3_EXECUTION_ID=${executionId}`);
  console.log(`GOS3_EVIDENCE_ID=${evidenceId}`);
  console.log(`PASS: behavioral sandbox/tool gate ${receipts.length}/${receipts.length}`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
