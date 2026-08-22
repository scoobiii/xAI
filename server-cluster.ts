/**
 * 🚀 MoltBot / zAI Cluster Load Balancer & Master Process
 * 
 * Optimized for low-RAM arm64 Termux, Cloud Run, and lightweight containers.
 * Features:
 * - Native Node.js cluster socket distribution across CPU cores
 * - Automatic respawn & crash recovery (Zero-downtime)
 * - Low-memory tuning (RSS monitoring & aggressive garbage collection)
 * - Integrated Persistence Engine (WAL SQLite / Atomic JSONL)
 * - Built-in health & observability metrics (/health, /api/cluster/metrics)
 */

import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";

const PORT = 3000;
const MAX_WORKERS = Math.min(2, Math.max(1, os.cpus().length || 2));
const MEMORY_LIMIT_MB = 450; // Guard against Termux OOM

if (cluster.isPrimary) {
  console.log(`=======================================================`);
  console.log(`⚡ MoltBot / zAI Cluster Master PID: ${process.pid}`);
  console.log(`🖥️  CPUs Available: ${os.cpus().length} | Provisioning: ${MAX_WORKERS} workers`);
  console.log(`🛡️  Memory Limit per Worker: ${MEMORY_LIMIT_MB}MB | Target Port: ${PORT}`);
  console.log(`=======================================================`);

  const workers = new Map<number, { pid: number; startedAt: number; restarts: number }>();

  for (let i = 0; i < MAX_WORKERS; i++) {
    const worker = cluster.fork({ WORKER_INDEX: i.toString() });
    if (worker.process.pid) {
      workers.set(worker.process.pid, {
        pid: worker.process.pid,
        startedAt: Date.now(),
        restarts: 0,
      });
    }
  }

  cluster.on("online", (worker) => {
    console.log(`✅ Worker [PID: ${worker.process.pid}] online and serving traffic.`);
  });

  cluster.on("exit", (worker, code, signal) => {
    const pid = worker.process.pid;
    console.warn(`⚠️ Worker [PID: ${pid}] died (code: ${code}, signal: ${signal}). Respawning...`);
    
    const prev = pid ? workers.get(pid) : undefined;
    const restarts = (prev?.restarts || 0) + 1;

    setTimeout(() => {
      const newWorker = cluster.fork();
      if (newWorker.process.pid) {
        workers.set(newWorker.process.pid, {
          pid: newWorker.process.pid,
          startedAt: Date.now(),
          restarts,
        });
      }
    }, 1000);
  });

  // Master monitoring loop (Memory watchdog)
  setInterval(() => {
    for (const id in cluster.workers) {
      const w = cluster.workers[id];
      if (w && w.isConnected()) {
        w.send({ type: "CHECK_HEALTH" });
      }
    }
  }, 15000);

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`\n🛑 Master received ${signal}. Gracefully stopping all workers...`);
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill("SIGTERM");
    }
    setTimeout(() => process.exit(0), 2000);
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
} else {
  // Worker process: Boot the server engine
  runWorkerServer();
}

async function runWorkerServer() {
  const { default: express } = await import("express");
  const { createServer: createViteServer } = await import("vite");
  const path = await import("node:path");
  const { persistence } = await import("./src/server/persistence");
  const { storage } = await import("./src/server/storage");
  const { AgentRunner } = await import("./src/server/agentRunner");

  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // Worker memory health monitor
  process.on("message", (msg: any) => {
    if (msg?.type === "CHECK_HEALTH") {
      const mem = process.memoryUsage();
      const rssMb = mem.rss / (1024 * 1024);
      if (rssMb > MEMORY_LIMIT_MB && (global as any).gc) {
        console.warn(`[Worker ${process.pid}] High RSS (${rssMb.toFixed(1)}MB) → Triggering GC`);
        (global as any).gc();
      }
    }
  });

  // --- Health & Observability Metrics ---
  app.get("/health", (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: "ok",
      worker_pid: process.pid,
      uptime_seconds: Math.floor(process.uptime()),
      memory: {
        rss_mb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
        heap_used_mb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
        heap_total_mb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
      },
      db_stats: persistence.getStats(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/cluster/metrics", (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      success: true,
      cluster: {
        worker_pid: process.pid,
        workers_total: MAX_WORKERS,
        arch: os.arch(),
        platform: os.platform(),
        cpus: os.cpus().length,
        loadavg: os.loadavg(),
      },
      process: {
        rss_mb: (mem.rss / (1024 * 1024)).toFixed(2),
        heap_used_mb: (mem.heapUsed / (1024 * 1024)).toFixed(2),
        uptime_seconds: Math.floor(process.uptime()),
      },
      persistence: persistence.getStats(),
    });
  });

  // --- Global Chat + nx1 Persistence Endpoints ---
  app.get("/api/persistence/chat", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? parseInt(req.query.before as string) : undefined;
    const messages = persistence.getRecentMessages(limit, before);
    res.json({ success: true, count: messages.length, messages });
  });

  app.post("/api/persistence/chat", (req, res) => {
    try {
      const { user_id, user_handle, role, content, nx1_id, meta } = req.body;
      if (!content || !user_id) {
        return res.status(400).json({ error: "content and user_id are required" });
      }
      const saved = persistence.saveMessage({
        user_id,
        user_handle,
        role: role || "user",
        content,
        nx1_id,
        meta,
      });
      res.status(201).json({ success: true, message: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/persistence/nx1", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 30;
    const records = persistence.getRecentNx1Records(limit);
    res.json({ success: true, count: records.length, records });
  });

  app.post("/api/persistence/nx1", (req, res) => {
    try {
      const { agent_id, prompt, status, latency_ms, output, tool_calls, metrics } = req.body;
      const record = persistence.saveNx1Execution({
        agent_id: agent_id || "agent-nx1-core",
        prompt: prompt || "Execute analysis",
        status: status || "success",
        latency_ms: latency_ms || 1,
        output,
        tool_calls,
        metrics: { ...metrics, worker_pid: process.pid },
      });
      res.status(201).json({ success: true, record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/persistence/stats", (_req, res) => {
    res.json(persistence.getStats());
  });

  // --- Core API Routes Proxy from Storage ---
  app.get("/api/posts", (_req, res) => {
    res.json(storage.getPosts());
  });

  app.get("/api/agents", (_req, res) => {
    res.json(storage.getAgents());
  });

  app.get("/api/users", (_req, res) => {
    res.json(storage.getUsers());
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Worker PID: ${process.pid}] Listening on http://0.0.0.0:${PORT}`);
  });
}
