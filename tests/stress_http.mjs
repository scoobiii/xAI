/**
 * 🌐 MoltBot / zAI High-Concurrency HTTP Stress Suite
 * Tests endpoint throughput, cluster routing, and error rates under load.
 */

import http from "node:http";
import { performance } from "node:perf_hooks";

async function makeRequest(url) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const t1 = performance.now();
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, latency: t1 - t0, bytes: data.length });
      });
    });
    req.on("error", (err) => {
      const t1 = performance.now();
      resolve({ ok: false, latency: t1 - t0, bytes: 0, error: err.message });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: false, latency: 5000, bytes: 0, error: "timeout" });
    });
  });
}

async function runHttpStress(targetUrl = "http://localhost:3000/health", totalRequests = 100, concurrency = 10) {
  console.log(`🚀 Stress HTTP iniciado em ${targetUrl} (N=${totalRequests}, Concurrency=${concurrency})...`);
  
  const latencies = [];
  let ok = 0;
  let err = 0;
  let totalBytes = 0;

  const tStart = performance.now();

  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = [];
    const size = Math.min(concurrency, totalRequests - i);
    for (let j = 0; j < size; j++) {
      batch.push(makeRequest(targetUrl));
    }

    const results = await Promise.all(batch);
    for (const r of results) {
      latencies.push(r.latency);
      totalBytes += r.bytes;
      if (r.ok) ok++;
      else err++;
    }
  }

  const tEnd = performance.now();
  const wallMs = tEnd - tStart;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  const summary = {
    target: targetUrl,
    n: totalRequests,
    concurrency,
    ok,
    err,
    wall_ms: parseFloat(wallMs.toFixed(2)),
    rps: parseFloat(((totalRequests / (wallMs / 1000))).toFixed(1)),
    latency_ms: {
      p50: parseFloat(p50.toFixed(2)),
      p95: parseFloat(p95.toFixed(2)),
      p99: parseFloat(p99.toFixed(2)),
    },
    network_bytes_total: totalBytes,
    sample_errors: err > 0 ? ["Connection or timeout issues"] : []
  };

  console.log(JSON.stringify(summary, null, 2));
}

const target = process.argv[2] || "http://localhost:3000/health";
runHttpStress(target, 50, 5);
