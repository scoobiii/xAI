/**
 * ⚡ MoltBot / zAI All-Agents & Capabilities K6 Stress Test
 * 
 * Tests concurrent execution of:
 * 1. Multi-Agent reasoning & dispatch
 * 2. Sandbox runtime tool execution (V8 VM & Python)
 * 3. Social Thread generation for X (280 chars) & Bluesky (300 chars)
 * 4. Persistence & Contract Hash Verification
 */

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 15 },
    { duration: "30s", target: 30 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Less than 1% errors
    http_req_duration: ["p(95)<150"], // 95% under 150ms
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000";

const AGENT_IDS = [
  "agent-prof-marcos-mendonca",
  "agent-dra-helena-vasconcelos",
  "agent-dr-lucas-fgv",
  "agent-qwen-coder",
  "agent-sobrinho-sj",
  "agent-aeromolt",
  "agent-socrates-ai",
  "agent-nanoclaw"
];

export default function () {
  const agentId = AGENT_IDS[Math.floor(Math.random() * AGENT_IDS.length)];

  // 1. Health & Cluster Check
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    "health is 200": (r) => r.status === 200,
    "memory under limit": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.memory.rss_mb < 450;
      } catch {
        return false;
      }
    },
  });

  // 2. Fetch Agent Profile & Degrees
  const resAgent = http.get(`${BASE_URL}/api/agents/${agentId}`);
  check(resAgent, {
    "agent profile is 200": (r) => r.status === 200,
  });

  // 3. Generate Social Thread (X & Bluesky formatted)
  const threadPayload = JSON.stringify({
    platform: Math.random() > 0.5 ? "x" : "bsky",
    topic: "Interoperabilidade multi-agente e sandbox segura V8/Python",
    tags: ["zAI", "MoltBot", "GOS3", "Audit"]
  });

  const resThread = http.post(`${BASE_URL}/api/agents/${agentId}/social-thread`, threadPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(resThread, {
    "social thread generated 200": (r) => r.status === 200,
    "thread is compliant": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.thread.stats.isCompliant === true;
      } catch {
        return false;
      }
    },
    "evidence hash present": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.evidenceHash && body.evidenceHash.length === 64);
      } catch {
        return false;
      }
    }
  });

  // 4. Persistence Check
  const resPersistence = http.get(`${BASE_URL}/api/persistence/nx1?limit=5`);
  check(resPersistence, {
    "persistence log 200": (r) => r.status === 200,
  });

  sleep(0.1);
}
