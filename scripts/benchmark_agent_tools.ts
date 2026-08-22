import { AgentSandbox } from "../src/server/sandbox.ts";

async function runDeterministicAgentToolsBenchmark() {
  console.log("================================================================================");
  console.log("   GOS3 DETERMINISTIC AGENT BENCHMARK SUITE - 100% COVERAGE TEST");
  console.log("   Auditando ferramentas de Sandbox, OpenClaw, NanoClaw e GOS3 Protocol");
  console.log("================================================================================\n");

  const results: { tool: string; success: boolean; latencyMs: number; evidenceHash: string; details: string }[] = [];

  const testCases = [
    {
      name: "runtimeCheck",
      runner: async () => AgentSandbox.runtimeCheck({ testFsWrite: true }),
    },
    {
      name: "executeBash",
      runner: async () => AgentSandbox.executeBash("echo 'GOS3 Deterministic Probe OK'"),
    },
    {
      name: "executePython",
      runner: async () => AgentSandbox.executePython("a = 10\nb = 20\nprint(f'GOS3 Python Result: {a + b}')"),
    },
    {
      name: "executeJavaScript",
      runner: async () => AgentSandbox.executeJavaScript("const x = [1,2,3].reduce((a,b)=>a+b, 0); console.log('JS Sum:', x); return { sum: x };"),
    },
    {
      name: "webSearch",
      runner: async () => AgentSandbox.webSearch({ query: "Vortex GOS3 Decentralized Agent Protocol", limit: 3 }),
    },
    {
      name: "webFetchUrl",
      runner: async () => AgentSandbox.webFetchUrl({ url: "https://github.com" }),
    },
    {
      name: "fsReadFile",
      runner: async () => AgentSandbox.fsReadFile({ filePath: "package.json" }),
    },
    {
      name: "fsWriteFile",
      runner: async () => AgentSandbox.fsWriteFile({ filePath: ".data/benchmark_test.tmp", content: `Benchmark Test Run at ${Date.now()}` }),
    },
    {
      name: "fsListDir",
      runner: async () => AgentSandbox.fsListDir({ dirPath: "src" }),
    },
    {
      name: "scheduleTask",
      runner: async () => AgentSandbox.scheduleTask({ title: "Audit Cron Check", prompt: "Verificar integridade do cluster", agentHandle: "Claude", triggerInSeconds: 120 }),
    },
    {
      name: "listScheduledTasks",
      runner: async () => AgentSandbox.listScheduledTasks(),
    },
    {
      name: "spawnSubagent",
      runner: async () => AgentSandbox.spawnSubagent({ parentAgentHandle: "Claude", subagentName: "AuditorBot", goal: "Auditar contratos", role: "Auditor" }),
    },
    {
      name: "delegateTask",
      runner: async () => AgentSandbox.delegateTask({ subagentId: "AuditorBot", taskPrompt: "Verificar hashes e seccomp" }),
    },
    {
      name: "githubCreateIssue",
      runner: async () => AgentSandbox.githubCreateIssue({ repoFullName: "scoobiii/vortex", title: "Benchmark Diagnostic Issue", body: "100% Deterministic Coverage Test" }),
    },
    {
      name: "githubCreatePR",
      runner: async () => AgentSandbox.githubCreatePR({ repoFullName: "scoobiii/vortex", title: "Benchmark PR", head: "benchmark-fix", base: "main" }),
    },
    {
      name: "githubStarRepo",
      runner: async () => AgentSandbox.githubStarRepo({ repoFullName: "scoobiii/vortex" }),
    },
    {
      name: "githubForkRepo",
      runner: async () => AgentSandbox.githubForkRepo({ repoFullName: "scoobiii/vortex" }),
    },
    {
      name: "githubGetRepo",
      runner: async () => AgentSandbox.githubGetRepo({ repoFullName: "scoobiii/vortex" }),
    },
    {
      name: "githubListIssues",
      runner: async () => AgentSandbox.githubListIssues({ repoFullName: "scoobiii/vortex", limit: 5 }),
    },
    {
      name: "vectorMemoryStore",
      runner: async () => AgentSandbox.storeVectorMemory({ text: "GOS3 Protocol Benchmark Deterministic Entry", agentHandle: "VortexSystem" }),
    },
    {
      name: "vectorMemorySearch",
      runner: async () => AgentSandbox.searchVectorMemory({ query: "Deterministic Entry", topK: 3 }),
    },
    {
      name: "calculateEnergyBESS",
      runner: async () => AgentSandbox.calculateEnergyBESS({ solarCapacityMW: 50, bessCapacityMWh: 100, energyPricePerMWh: 45 }),
    },
    {
      name: "analyzeMarketCrypto",
      runner: async () => AgentSandbox.analyzeMarketCrypto({ assetSymbol: "DREX-ENERGY-REC", timeframe: "30D" }),
    },
    {
      name: "generateChartData",
      runner: async () => AgentSandbox.generateChartData({ title: "BESS Dispatch Profile", dataKeys: [{ key: "solar", color: "#10b981", label: "Solar (MW)" }, { key: "bess", color: "#6366f1", label: "BESS (MW)" }], data: [{ time: "12:00", solar: 45, bess: 90 }] }),
    },
    {
      name: "inspectNanoClawRuntime",
      runner: async () => AgentSandbox.inspectNanoClawRuntime({ targetCluster: "main-v8-isolate", actionType: "inspect_kernel" }),
    },
  ];

  for (const testCase of testCases) {
    const t0 = Date.now();
    try {
      const res = await testCase.runner();
      const latency = Date.now() - t0;
      const isSuccess = Boolean(res?.success);
      results.push({
        tool: testCase.name,
        success: isSuccess,
        latencyMs: latency,
        evidenceHash: res?.evidenceHash || "N/A",
        details: isSuccess ? "Passou com Evidência Criptográfica" : `Falha: ${JSON.stringify(res?.data || res?.logs || "Erro")}`,
      });
      console.log(`[${isSuccess ? "PASS" : "FAIL"}] ${testCase.name.padEnd(25)} | ${String(latency).padStart(4)}ms | Hash: ${res?.evidenceHash || "N/A"}`);
    } catch (err: any) {
      const latency = Date.now() - t0;
      results.push({
        tool: testCase.name,
        success: false,
        latencyMs: latency,
        evidenceHash: "0xERROR",
        details: `Exceção: ${err.message}`,
      });
      console.log(`[FAIL] ${testCase.name.padEnd(25)} | ${String(latency).padStart(4)}ms | ERRO: ${err.message}`);
    }
  }

  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  const coveragePercent = ((passed / total) * 100).toFixed(1);

  console.log("\n================================================================================");
  console.log(`   RESULTADO FINAL DO BENCHMARK GOS3: ${passed}/${total} PASSOU (${coveragePercent}% COBERTURA)`);
  console.log("================================================================================\n");

  return { passed, total, coveragePercent, results };
}

runDeterministicAgentToolsBenchmark().catch(console.error);
