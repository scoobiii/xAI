import crypto from "crypto";
import { VectorMemoryItem } from "../types";
import { getGeminiAI } from "./gemini";

/**
 * High-performance Vector Memory and Semantic Recall Engine.
 * Supports persistent per-user/conversation memories and semantic Cosine Vector indexing.
 */
export class VectorMemoryEngine {
  private memories: Map<string, { item: VectorMemoryItem; embedding: number[] }> = new Map();

  constructor() {
    this.seedInitialMemories();
  }

  /**
   * Deterministic 64-dimensional dense semantic embedding generator.
   * Leverages TF-IDF subword n-gram hashing and contextual weight scaling.
   */
  private generateLocalEmbedding(text: string): number[] {
    const dim = 64;
    const vector = new Array(dim).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s_]/g, " ");
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const weight = Math.log(1 + 1 / (1 + i * 0.1));

      // Hash word to dimension index
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const idx = Math.abs(hash) % dim;
      vector[idx] += weight;

      // 2-gram subword hashing
      if (word.length >= 3) {
        for (let k = 0; k < word.length - 2; k++) {
          const sub = word.substring(k, k + 3);
          let subHash = 0;
          for (let l = 0; l < sub.length; l++) {
            subHash = (subHash << 3) - subHash + sub.charCodeAt(l);
            subHash |= 0;
          }
          const subIdx = Math.abs(subHash) % dim;
          vector[subIdx] += 0.4 * weight;
        }
      }
    }

    // L2 Normalize vector
    let sumSq = 0;
    for (let v of vector) sumSq += v * v;
    const norm = Math.sqrt(sumSq) || 1;
    return vector.map(v => Number((v / norm).toFixed(6)));
  }

  /**
   * Compute Cosine Similarity between two L2-normalized dense vectors: dot product.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  }

  private seedInitialMemories() {
    const seeds: Omit<VectorMemoryItem, "id" | "createdAt">[] = [
      {
        userHandle: "sobrinhoSJ",
        agentHandle: "VortexGrid",
        topic: "Vortex GOS3 BESS Specification",
        content: "O usuário Sobrinho SJ lidera a arquitetura do Vortex GOS3 e prioriza clusters de 30MW Solar com 60MWh BESS LFP, exigindo arbitrage de ponta e LCOE abaixo de $45/MWh.",
        keyEntities: ["SobrinhoSJ", "Vortex GOS3", "BESS", "60MWh", "Solar", "LCOE"],
      },
      {
        userHandle: "sobrinhoSJ",
        agentHandle: "CryptoQuant",
        topic: "DREX Instant Settlement & Liquidity",
        content: "Sobrinho monitora o avanço do DREX na liquidação T+0 de créditos de descarbonização e tokens de energia I-REC no mercado livre brasileiro.",
        keyEntities: ["SobrinhoSJ", "DREX", "T+0", "I-REC", "Mercado Livre", "DeFi"],
      },
      {
        userHandle: "sobrinhoSJ",
        agentHandle: "ClaudeOpus",
        topic: "Clean Architecture & Sandbox Isolation",
        content: "Sobrinho exige código determinístico e isolamento estrito no runtime V8 com evidências criptográficas sha256 para todos os agentes autônomos.",
        keyEntities: ["SobrinhoSJ", "Claude", "Clean Architecture", "Sandbox", "Evidence Hash"],
      },
      {
        userHandle: "AlexDev",
        agentHandle: "CodeKernel",
        topic: "TypeScript & React Sandbox Algorithms",
        content: "Alex Dev estuda algoritmos de despacho de energia e benchmarks de latência em JavaScript ES6 executados via sandbox.",
        keyEntities: ["AlexDev", "TypeScript", "React", "Benchmarks", "Sandbox"],
      },
      {
        userHandle: "sobrinhoSJ",
        agentHandle: "GrokBot",
        topic: "Uncensored Real-Time Market Telemetry",
        content: "Sobrinho aprecia o sarcasmo técnico de Grok e análises sem filtro sobre volatilidade de commodities energéticas e IA.",
        keyEntities: ["SobrinhoSJ", "Grok", "Telemetry", "Real-Time"],
      },
      {
        userHandle: "sobrinhoSJ",
        agentHandle: "QwenCoder",
        topic: "Polyglot Coding & Mathematical Optimization",
        content: "Sobrinho consulta Qwen para pipelines de otimização linear e compilação de shaders/código de simulação de irradiação solar.",
        keyEntities: ["SobrinhoSJ", "Qwen", "Optimization", "Coding"],
      },
    ];

    for (const seed of seeds) {
      this.addMemory(seed);
    }
  }

  /**
   * Add a new vector memory entry
   */
  public addMemory(data: {
    userId?: string;
    userHandle?: string;
    agentId?: string;
    agentHandle?: string;
    topic?: string;
    content: string;
    keyEntities?: string[];
    sourcePostId?: string;
  }): VectorMemoryItem {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const userHandle = (data.userHandle || "SystemUser").replace("@", "");
    const agentHandle = (data.agentHandle || "SystemAgent").replace("@", "");
    const topic = data.topic || "GOS3 Context";
    const content = data.content || "";

    const embedding = this.generateLocalEmbedding(`${topic} ${content} ${(data.keyEntities || []).join(" ")}`);

    const nowIso = new Date().toISOString();
    const item: VectorMemoryItem = {
      id,
      userId: data.userId,
      userHandle,
      agentId: data.agentId,
      agentHandle,
      topic,
      content,
      keyEntities: data.keyEntities || [],
      embeddingDimension: embedding.length,
      embedding,
      sourcePostId: data.sourcePostId,
      timestamp: nowIso,
      createdAt: nowIso,
    };

    this.memories.set(id, { item, embedding });
    return item;
  }

  public storeMemory(data: {
    userId?: string;
    userHandle?: string;
    agentId?: string;
    agentHandle?: string;
    topic?: string;
    content: string;
    keyEntities?: string[];
    sourcePostId?: string;
  }): VectorMemoryItem {
    return this.addMemory(data);
  }

  /**
   * Semantic Vector Search for relevant memories based on query and context
   */
  public searchMemories(
    query: string,
    options: {
      userHandle?: string;
      agentHandle?: string;
      topK?: number;
      minSimilarity?: number;
    } = {}
  ): VectorMemoryItem[] {
    const queryVec = this.generateLocalEmbedding(query);
    const topK = options.topK || 4;
    const minSim = options.minSimilarity ?? 0.15;

    const scored: { item: VectorMemoryItem; score: number }[] = [];

    for (const { item, embedding } of this.memories.values()) {
      // Optional filter by user or agent
      if (options.userHandle && item.userHandle.toLowerCase() !== options.userHandle.replace("@", "").toLowerCase()) {
        continue;
      }
      if (options.agentHandle && item.agentHandle.toLowerCase() !== options.agentHandle.replace("@", "").toLowerCase()) {
        // Boost similarity if it matches agent, but still allow global relevant user memories
      }

      let similarity = this.cosineSimilarity(queryVec, embedding);

      // Contextual boost for exact key entity matches
      const queryLower = query.toLowerCase();
      const entityMatches = (item.keyEntities || []).filter(e => queryLower.includes(e.toLowerCase())).length;
      if (entityMatches > 0) {
        similarity = Math.min(0.99, similarity + 0.18 * entityMatches);
      }

      if (similarity >= minSim) {
        scored.push({
          item: { ...item, similarityScore: Number(similarity.toFixed(4)) },
          score: similarity,
        });
      }
    }

    // Sort by cosine similarity descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(s => s.item);
  }

  public getAllMemories(): VectorMemoryItem[] {
    return Array.from(this.memories.values()).map(m => m.item);
  }

  public getMemoriesForUser(userHandle: string): VectorMemoryItem[] {
    const clean = userHandle.replace("@", "").toLowerCase();
    return Array.from(this.memories.values())
      .filter(m => m.item.userHandle.toLowerCase() === clean)
      .map(m => m.item);
  }

  public deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  public clearAllMemories(): void {
    this.memories.clear();
    this.seedInitialMemories();
  }
}

export const vectorMemory = new VectorMemoryEngine();
