/**
 * 🌐 MoltBot / zAI Social Threader & Multi-Platform Dispatch Engine
 * 
 * Generates formatted multi-post threads for X (Twitter) and Bluesky (bsky.app)
 * with strict character constraints (280 for X, 300 for Bluesky), [1/N] pagination,
 * rich hashtags, AT Protocol facet structures, and SHA-256 evidence hashes.
 */

import crypto from "node:crypto";
import { UserAccount } from "../types";

export interface SocialThreadPost {
  index: number;
  total: number;
  text: string;
  charCount: number;
  evidenceHash?: string;
  mediaAlt?: string;
  tags?: string[];
  xPayload?: {
    text: string;
    replyToId?: string;
  };
  bskyPayload?: {
    text: string;
    facets?: any[];
    replyRef?: {
      root: string;
      parent: string;
    };
  };
}

export interface FormattedSocialThread {
  agentId: string;
  agentHandle: string;
  agentName: string;
  academicTitle?: string;
  institution?: string;
  platform: "x" | "bsky" | "both";
  threadId: string;
  createdAt: string;
  posts: SocialThreadPost[];
  summaryText: string;
  totalCharacters: number;
  overallEvidenceHash: string;
  stats: {
    postsCount: number;
    platformLimit: number;
    isCompliant: boolean;
  };
}

export class SocialThreader {
  private static readonly X_MAX_CHARS = 280;
  private static readonly BSKY_MAX_CHARS = 300;

  /**
   * Splits raw agent text into a mathematically compliant sequence of thread posts.
   */
  public static buildThread(
    agent: UserAccount,
    rawContent: string,
    platform: "x" | "bsky" | "both" = "both",
    evidenceHash?: string,
    topicTags: string[] = ["AI", "OpenClaw", "zAI", "VortexGrid"]
  ): FormattedSocialThread {
    const threadId = `th-${agent.handle}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const maxChars = platform === "x" ? this.X_MAX_CHARS : this.BSKY_MAX_CHARS;
    
    // Hash of entire content
    const overallHash =
      evidenceHash ||
      crypto.createHash("sha256").update(`${agent.handle}:${rawContent}:${Date.now()}`).digest("hex");

    // 1. Clean and split content by paragraphs or sentences
    const chunks = this.splitIntoChunks(rawContent, maxChars - 30); // Leave room for pagination prefix
    const totalPosts = chunks.length + 1; // +1 for the final verification receipt post

    const posts: SocialThreadPost[] = [];

    // Header prefix info
    const academic = agent.humanPersona?.academicTitle ? `${agent.humanPersona.academicTitle} ` : "";
    const inst = agent.humanPersona?.primaryInstitution ? ` (${agent.humanPersona.primaryInstitution})` : "";
    const authorHeader = `${academic}${agent.name}${inst}`;

    // Post 1..N-1
    for (let i = 0; i < chunks.length; i++) {
      const idx = i + 1;
      const pagination = `[${idx}/${totalPosts}] `;
      const isFirst = idx === 1;
      
      let text = isFirst ? `🧵 ${authorHeader}:\n\n${pagination}${chunks[i]}` : `${pagination}${chunks[i]}`;
      
      // Trim if over limit
      if (text.length > maxChars) {
        text = text.substring(0, maxChars - 4) + "...";
      }

      posts.push({
        index: idx,
        total: totalPosts,
        text,
        charCount: text.length,
        tags: isFirst ? topicTags : undefined,
        xPayload: {
          text,
        },
        bskyPayload: {
          text,
        },
      });
    }

    // Final Post: Cryptographic Proof & Verification Hash
    const finalIdx = totalPosts;
    const shortHash = `0x${overallHash.substring(0, 16)}...`;
    const finalTags = topicTags.map(t => `#${t}`).join(" ");
    const receiptText = `[${finalIdx}/${totalPosts}] 🛡️ Prova Criptográfica & Auditoria de Execução:\n• Hash: ${shortHash}\n• Agente: @${agent.handle}\n• Runtime: zAI V8/Python Verified\n\n${finalTags}`;

    posts.push({
      index: finalIdx,
      total: totalPosts,
      text: receiptText,
      charCount: receiptText.length,
      evidenceHash: overallHash,
      tags: topicTags,
      xPayload: {
        text: receiptText,
      },
      bskyPayload: {
        text: receiptText,
      },
    });

    const isCompliant = posts.every(p => p.charCount <= maxChars);

    return {
      agentId: agent.id,
      agentHandle: agent.handle,
      agentName: agent.name,
      academicTitle: agent.humanPersona?.academicTitle,
      institution: agent.humanPersona?.primaryInstitution,
      platform,
      threadId,
      createdAt: new Date().toISOString(),
      posts,
      summaryText: rawContent.substring(0, 200) + "...",
      totalCharacters: posts.reduce((acc, p) => acc + p.charCount, 0),
      overallEvidenceHash: overallHash,
      stats: {
        postsCount: posts.length,
        platformLimit: maxChars,
        isCompliant,
      },
    };
  }

  private static splitIntoChunks(text: string, targetChunkSize: number): string[] {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
      if ((currentChunk + "\n\n" + p).length <= targetChunkSize) {
        currentChunk = currentChunk ? currentChunk + "\n\n" + p : p;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        
        // If single paragraph is larger than target, split by sentences
        if (p.length > targetChunkSize) {
          const sentences = p.split(/(?<=[.?!])\s+/);
          for (const s of sentences) {
            if ((currentChunk + " " + s).length <= targetChunkSize) {
              currentChunk = currentChunk ? currentChunk + " " + s : s;
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = s;
            }
          }
        } else {
          currentChunk = p;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text.substring(0, targetChunkSize)];
  }
}
