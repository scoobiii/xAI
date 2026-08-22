import { ModelProviderConfig, ModelProviderId, UserAccount } from "../types";
import { getGeminiAI } from "./gemini";

export interface LLMGenerationRequest {
  provider: ModelProviderId;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerationResponse {
  text: string;
  providerUsed: ModelProviderId;
  modelUsed: string;
  durationMs: number;
  tokensEstimate: number;
  isSimulatedFallback: boolean;
}

export class ModelGateway {
  private providerConfigs: Map<ModelProviderId, ModelProviderConfig> = new Map();

  constructor() {
    this.initDefaultConfigs();
  }

  private initDefaultConfigs() {
    const configs: ModelProviderConfig[] = [
      {
        id: "gemini",
        name: "Google Gemini",
        providerCompany: "Google DeepMind",
        defaultModel: "gemini-3.7-flash",
        availableModels: ["gemini-3.7-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"],
        isConfigured: Boolean(process.env.GEMINI_API_KEY),
        description: "Oficial Google GenAI SDK com suporte nativo a Function Calling, Live API e Sandbox.",
        color: "#8b5cf6",
        logoBadge: "Gemini 3.7",
      },
      {
        id: "groq",
        name: "GroqCloud LPU",
        providerCompany: "Groq, Inc.",
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY || undefined,
        defaultModel: "llama-3.3-70b-versatile",
        availableModels: [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "deepseek-r1-distill-llama-70b",
          "mixtral-8x7b-32768",
          "gemma2-9b-it",
        ],
        isConfigured: Boolean(process.env.GROQ_API_KEY),
        description: "Inferência de velocidade extrema em LPUs customizadas da Groq com suporte a Llama 3.3 e DeepSeek R1.",
        color: "#f97316",
        logoBadge: "Groq LPU",
      },
      {
        id: "grok",
        name: "xAI Grok",
        providerCompany: "xAI",
        baseUrl: "https://api.x.ai/v1",
        apiKey: process.env.GROK_API_KEY || undefined,
        defaultModel: "grok-3",
        availableModels: ["grok-3", "grok-2-1212", "grok-vision-beta"],
        isConfigured: Boolean(process.env.GROK_API_KEY),
        description: "Modelo de alta velocidade, perspicácia analítica, sem filtros de censura com raciocínio matemático.",
        color: "#f59e0b",
        logoBadge: "Grok 3",
      },
      {
        id: "claude",
        name: "Anthropic Claude",
        providerCompany: "Anthropic",
        baseUrl: "https://api.anthropic.com/v1",
        apiKey: process.env.ANTHROPIC_API_KEY || undefined,
        defaultModel: "claude-3-7-sonnet-20250219",
        availableModels: ["claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
        isConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        description: "Raciocínio matizado, excelência em engenharia de software e geração de código verificável.",
        color: "#d97706",
        logoBadge: "Claude 3.7",
      },
      {
        id: "gpt",
        name: "OpenAI GPT",
        providerCompany: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY || undefined,
        defaultModel: "gpt-4o",
        availableModels: ["gpt-4o", "o3-mini", "gpt-4.5-preview", "gpt-4o-mini"],
        isConfigured: Boolean(process.env.OPENAI_API_KEY),
        description: "Modelo generalista multimodal, orquestrador de chamadas de função e pipelines estruturados.",
        color: "#10b981",
        logoBadge: "GPT-4o",
      },
      {
        id: "perplexity",
        name: "Perplexity Sonar",
        providerCompany: "Perplexity AI",
        baseUrl: "https://api.perplexity.ai",
        apiKey: process.env.PERPLEXITY_API_KEY || undefined,
        defaultModel: "sonar-reasoning-pro",
        availableModels: ["sonar-reasoning-pro", "sonar-reasoning", "sonar-pro", "sonar"],
        isConfigured: Boolean(process.env.PERPLEXITY_API_KEY),
        description: "Pesquisa em tempo real ancorada na web com citações transparentes de oráculos e fontes.",
        color: "#06b6d4",
        logoBadge: "Sonar Pro",
      },
      {
        id: "deepseek",
        name: "DeepSeek Reasoner",
        providerCompany: "DeepSeek AI",
        baseUrl: "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY || undefined,
        defaultModel: "deepseek-reasoner",
        availableModels: ["deepseek-reasoner", "deepseek-chat"],
        isConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
        description: "Modelo de raciocínio profundo de pesos abertos (R1 & V3), alta capacidade matemática e Chain-of-Thought.",
        color: "#3b82f6",
        logoBadge: "DeepSeek R1",
      },
      {
        id: "qwen",
        name: "Alibaba Qwen",
        providerCompany: "Alibaba Cloud / Qwen",
        baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        apiKey: process.env.DASHSCOPE_API_KEY || undefined,
        defaultModel: "qwen-2.5-coder-32b",
        availableModels: ["qwen-2.5-coder-32b", "qwen-2.5-72b-instruct", "qwen-max"],
        isConfigured: Boolean(process.env.DASHSCOPE_API_KEY),
        description: "Especialista em programação poliglota, compilação de algoritmos e otimização de código.",
        color: "#ec4899",
        logoBadge: "Qwen 2.5",
      },
      {
        id: "custom",
        name: "Custom / Local Endpoint (Ollama/OpenRouter)",
        providerCompany: "Custom Gateway",
        baseUrl: "http://localhost:11434/v1",
        defaultModel: "mistral-large",
        availableModels: ["mistral-large", "llama-3.3-70b", "deepseek-r1-local", "custom-model"],
        isConfigured: false,
        description: "Conecte qualquer endpoint compatível com OpenAI (Ollama, vLLM, OpenRouter, Mistral, Together).",
        color: "#64748b",
        logoBadge: "Custom API",
      },
    ];

    for (const c of configs) {
      this.providerConfigs.set(c.id, c);
    }
  }

  public getConfigs(): ModelProviderConfig[] {
    return Array.from(this.providerConfigs.values()).map(c => ({
      ...c,
      apiKey: c.apiKey ? `${c.apiKey.slice(0, 4)}••••••••${c.apiKey.slice(-4)}` : undefined,
    }));
  }

  public updateConfig(providerId: ModelProviderId, updates: Partial<ModelProviderConfig>): ModelProviderConfig {
    const existing = this.providerConfigs.get(providerId);
    if (!existing) throw new Error(`Unknown provider: ${providerId}`);

    const updated: ModelProviderConfig = {
      ...existing,
      ...updates,
      isConfigured: Boolean(updates.apiKey || existing.apiKey || (providerId === "gemini" && process.env.GEMINI_API_KEY)),
    };

    this.providerConfigs.set(providerId, updated);
    return updated;
  }

  /**
   * Universal Dispatcher for all AI Model Providers with Fallback Guard
   */
  public async generateText(req: LLMGenerationRequest): Promise<LLMGenerationResponse> {
    const startTime = Date.now();
    const config = this.providerConfigs.get(req.provider);

    // 1. Google Gemini via Official @google/genai SDK
    if (req.provider === "gemini") {
      const ai = getGeminiAI();
      if (ai) {
        const candidateModels = [
          req.model || "gemini-3.7-flash",
          "gemini-3.1-flash-lite",
          "gemini-flash-latest",
        ];
        
        for (const candidate of candidateModels) {
          try {
            const res = await ai.models.generateContent({
              model: candidate,
              contents: req.userPrompt,
              config: {
                systemInstruction: req.systemPrompt,
                temperature: req.temperature ?? 0.7,
              },
            });
            const duration = Date.now() - startTime;
            const text = res.text || "";
            if (text) {
              return {
                text,
                providerUsed: "gemini",
                modelUsed: candidate,
                durationMs: duration,
                tokensEstimate: Math.floor((req.systemPrompt.length + req.userPrompt.length + text.length) / 4),
                isSimulatedFallback: false,
              };
            }
          } catch (err: any) {
            console.warn(`Gemini (${candidate}) unavailable/high demand: ${err.message || err}`);
          }
        }
      }
    }

    // 2. OpenAI / Groq / Grok / Perplexity / DeepSeek / Qwen / Custom (OpenAI-compatible REST API)
    if (
      config &&
      config.apiKey &&
      (req.provider === "groq" ||
        req.provider === "grok" ||
        req.provider === "gpt" ||
        req.provider === "perplexity" ||
        req.provider === "deepseek" ||
        req.provider === "qwen" ||
        req.provider === "custom")
    ) {
      try {
        const baseUrl = config.baseUrl || "https://api.openai.com/v1";
        const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

        const bodyPayload = {
          model: req.model || config.defaultModel,
          messages: [
            { role: "system", content: req.systemPrompt },
            { role: "user", content: req.userPrompt },
          ],
          temperature: req.temperature ?? 0.7,
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          const duration = Date.now() - startTime;
          return {
            text,
            providerUsed: req.provider,
            modelUsed: req.model || config.defaultModel,
            durationMs: duration,
            tokensEstimate: data.usage?.total_tokens || Math.floor((req.systemPrompt.length + req.userPrompt.length + text.length) / 4),
            isSimulatedFallback: false,
          };
        } else {
          const errText = await res.text();
          console.warn(`${req.provider} API returned ${res.status}: ${errText}`);
        }
      } catch (err: any) {
        console.warn(`Failed to call ${req.provider} API: ${err.message}`);
      }
    }

    // 3. Anthropic Claude (Messages API format)
    if (req.provider === "claude" && config && config.apiKey) {
      try {
        const endpoint = "https://api.anthropic.com/v1/messages";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: req.model || "claude-3-7-sonnet-20250219",
            system: req.systemPrompt,
            messages: [{ role: "user", content: req.userPrompt }],
            max_tokens: 1024,
            temperature: req.temperature ?? 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.content?.[0]?.text || "";
          const duration = Date.now() - startTime;
          return {
            text,
            providerUsed: "claude",
            modelUsed: req.model || "claude-3-7-sonnet-20250219",
            durationMs: duration,
            tokensEstimate: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            isSimulatedFallback: false,
          };
        }
      } catch (err: any) {
        console.warn(`Claude API error: ${err.message}`);
      }
    }

    // 4. CASCADE FALLBACK STAGE 1: GroqCloud LPU (Fast Inference)
    const groqConfig = this.providerConfigs.get("groq");
    const groqKey = groqConfig?.apiKey || process.env.GROQ_API_KEY;
    if (groqKey && req.provider !== "groq") {
      try {
        const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
        const groqRes = await fetch(groqEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: `${req.systemPrompt}\n[FALLBACK EXECUTION VIA GROQ LPU]` },
              { role: "user", content: req.userPrompt },
            ],
            temperature: req.temperature ?? 0.7,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqText = groqData.choices?.[0]?.message?.content || "";
          if (groqText) {
            return {
              text: groqText,
              providerUsed: "groq",
              modelUsed: "llama-3.3-70b-versatile (Groq LPU Fallback)",
              durationMs: Date.now() - startTime,
              tokensEstimate: groqData.usage?.total_tokens || Math.floor((req.systemPrompt.length + req.userPrompt.length + groqText.length) / 4),
              isSimulatedFallback: false,
            };
          }
        }
      } catch (groqErr: any) {
        console.warn(`Groq fallback failed: ${groqErr.message}`);
      }
    }

    // 5. CASCADE FALLBACK STAGE 2: Gemini 3.7 Flash if configured
    const geminiAI = getGeminiAI();
    if (geminiAI && req.provider !== "gemini") {
      try {
        const res = await geminiAI.models.generateContent({
          model: "gemini-3.7-flash",
          contents: `[SYSTEM INSTRUCTION AS ${req.provider.toUpperCase()} MODEL]:\n${req.systemPrompt}\n\n[USER PROMPT]:\n${req.userPrompt}`,
        });
        const duration = Date.now() - startTime;
        const text = res.text || "";
        if (text) {
          return {
            text,
            providerUsed: "gemini",
            modelUsed: "gemini-3.7-flash (Cascade Fallback)",
            durationMs: duration,
            tokensEstimate: Math.floor((req.systemPrompt.length + req.userPrompt.length + text.length) / 4),
            isSimulatedFallback: false,
          };
        }
      } catch (err) {
        // Continue to local SLM & RAG fallback
      }
    }

    // 6. CASCADE FALLBACK STAGE 3 & 4: Local Lightweight SLM + RAG Fine
    const duration = Date.now() - startTime;
    return {
      text: "",
      providerUsed: "local_simulation" as any,
      modelUsed: "local-template-v1",
      durationMs: duration,
      tokensEstimate: 120,
      isSimulatedFallback: true,
    };
  }
}

export const modelGateway = new ModelGateway();
