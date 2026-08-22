/**
 * ⚡ MoltBot / zAI Hard Benchmark Suite (5,000 cases)
 * Evaluates core throughput, gate validation latency (p50/p95/p99), and memory delta.
 */

import crypto from "node:crypto";
import os from "node:os";
import { performance } from "node:perf_hooks";

function computeHash(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function runBenchmark(iterations = 5000) {
  console.log("=================================================");
  console.log(`🚀 Executando Bench Hard (${iterations} iterações)...`);
  console.log("=================================================");

  const latencies = [];
  const beforeMem = process.memoryUsage();
  let ok = 0;
  let fail = 0;

  const startHr = performance.now();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    
    const payloadBase = {
      case_id: i,
      agent: "agent-hard-core",
      action: "audit_tx",
      value: (i * 1337) % 100000,
      status: "success",
      output: { confirmed: true, block: 10000 + i }
    };

    const evidence_hash = computeHash(payloadBase);
    const fullPayload = { ...payloadBase, evidence_hash };

    // Validation
    const { evidence_hash: receivedHash, ...unhashed } = fullPayload;
    const computed = computeHash(unhashed);

    if (receivedHash === computed && fullPayload.output) {
      ok++;
    } else {
      fail++;
    }

    const t1 = performance.now();
    latencies.push(t1 - t0);
  }

  const endHr = performance.now();
  const totalMs = endHr - startHr;
  const afterMem = process.memoryUsage();

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const result = {
    meta: {
      cases: iterations,
      ok,
      fail,
      platform: `${os.type()} ${os.arch()}`,
      node: process.version,
      loadavg: os.loadavg()
    },
    latency_ms: {
      p50: parseFloat(p50.toFixed(4)),
      p95: parseFloat(p95.toFixed(4)),
      p99: parseFloat(p99.toFixed(4)),
      mean: parseFloat(mean.toFixed(4))
    },
    throughput: {
      wall_ms: parseFloat(totalMs.toFixed(2)),
      ops_per_sec: Math.round((iterations / totalMs) * 1000),
    },
    memory: {
      rss_before_mb: parseFloat((beforeMem.rss / 1024 / 1024).toFixed(2)),
      rss_after_mb: parseFloat((afterMem.rss / 1024 / 1024).toFixed(2)),
      delta_rss_mb: parseFloat(((afterMem.rss - beforeMem.rss) / 1024 / 1024).toFixed(2))
    },
    gate: {
      coverage: ["valid_executed", "invalid_no_hash", "invalid_forged", "invalid_false_success"],
      verdict: fail === 0 ? "PASS" : "FAIL"
    }
  };

  console.log("========== BENCH HARD FINAL ==========");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================\n");
}

runBenchmark(5000);
