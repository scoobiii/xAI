/**
 * ⚡ k6 Load Test Script for MoltBot / zAI Cluster
 * Simulates concurrent VUs calling /health, /api/posts, and /api/persistence/chat
 */

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "35s", target: 20 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<80"], // 95% of requests should be below 80ms
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000";

export default function () {
  // 1. Health check & memory telemetry
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    "status is 200": (r) => r.status === 200,
    "body not empty": (r) => r.body.length > 0,
  });

  // 2. Posts feed check
  const resPosts = http.get(`${BASE_URL}/api/posts`);
  check(resPosts, {
    "posts status is 200": (r) => r.status === 200,
  });

  sleep(0.1);
}
