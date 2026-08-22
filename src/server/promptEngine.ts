import { FunctionDeclaration, Type } from "@google/genai";
import { Post, UserAccount, VectorMemoryItem } from "../types";

export const SANDBOX_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  // --- OpenClaw Code Execution & Shell Skills ---
  {
    name: "executeBash",
    description: "OpenClaw Shell: Executes real Bash/shell commands in an isolated Linux container with stdout, stderr, and exit code capture (e.g. ls, python3, git, curl, df -h, grep).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: "Linux bash command string to execute in the workspace.",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "executePython",
    description: "OpenClaw Python: Executes native Python 3 (CPython 3.10) code block on the host container with real-time stdout/stderr capture.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: {
          type: Type.STRING,
          description: "Python 3 executable script code.",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "executeJavaScript",
    description: "OpenClaw V8 Engine: Executes JavaScript ES6 code in an isolated V8 sandbox VM with console.log capture, return expression, and SHA-256 evidence hash.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: {
          type: Type.STRING,
          description: "JavaScript ES6 executable code snippet.",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "inspectNanoClawRuntime",
    description: "OpenClaw NanoClaw Kernel: Runtime security kernel tool for inspecting V8 isolates, memory limits, bytecode verification and micro-sandbox telemetry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetCluster: {
          type: Type.STRING,
          description: "Target cluster or isolate name (e.g. 'main-v8-isolate', 'drex-settlement-vm').",
        },
        actionType: {
          type: Type.STRING,
          description: "Action: 'inspect_kernel', 'verify_bytecode', 'isolate_subtask', or 'claw_benchmark'.",
        },
      },
    },
  },

  // --- OpenClaw Web Intelligence Skills ---
  {
    name: "webSearch",
    description: "OpenClaw Web Search: Performs real-time web search with keyword scoring, domain filtering, relevance ranking, and direct snippet retrieval.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search terms or question to look up on the web.",
        },
        domain: {
          type: Type.STRING,
          description: "Optional domain filter (e.g. 'github.com', 'arxiv.org', 'bcb.gov.br').",
        },
        limit: {
          type: Type.NUMBER,
          description: "Maximum number of search results to return (1-8).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "webFetchUrl",
    description: "OpenClaw Web Scraper: Fetches and sanitizes HTML content from any HTTP/HTTPS URL and converts it into clean Markdown text.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "Complete URL to fetch and scrape (e.g. 'https://github.com/scoobiii/vortex').",
        },
      },
      required: ["url"],
    },
  },

  // --- OpenClaw GitHub Agency Skills ---
  {
    name: "githubCreateIssue",
    description: "OpenClaw GitHub: Creates a new issue in a GitHub repository with title, markdown body description, and optional labels.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        repoFullName: {
          type: Type.STRING,
          description: "Repository path, e.g. 'scoobiii/vortex' or 'owner/repo'.",
        },
        title: {
          type: Type.STRING,
          description: "Title of the issue.",
        },
        body: {
          type: Type.STRING,
          description: "Markdown body content explaining the issue or feature.",
        },
        labels: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Optional labels, e.g. ['bug', 'openclaw', 'enhancement'].",
        },
      },
      required: ["repoFullName", "title", "body"],
    },
  },
  {
    name: "githubCreatePR",
    description: "OpenClaw GitHub: Opens a Pull Request in a GitHub repository connecting feature branch with target branch.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        repoFullName: {
          type: Type.STRING,
          description: "Repository path, e.g. 'scoobiii/vortex'.",
        },
        title: {
          type: Type.STRING,
          description: "Title of the Pull Request.",
        },
        head: {
          type: Type.STRING,
          description: "Source branch containing changes.",
        },
        base: {
          type: Type.STRING,
          description: "Target branch to merge into (default: 'main').",
        },
        body: {
          type: Type.STRING,
          description: "Summary description of changes.",
        },
      },
      required: ["repoFullName", "title", "head"],
    },
  },
  {
    name: "githubListIssues",
    description: "OpenClaw GitHub: Queries and filters issues and Pull Requests from a GitHub repository.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        repoFullName: {
          type: Type.STRING,
          description: "Full repository identifier, e.g. 'scoobiii/vortex'.",
        },
        state: {
          type: Type.STRING,
          description: "State filter: 'open', 'closed', or 'all'.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Maximum number of issues (default 10).",
        },
      },
      required: ["repoFullName"],
    },
  },
  {
    name: "githubStarRepo",
    description: "OpenClaw GitHub: Stars a repository on GitHub (e.g. 'scoobiii/vortex') or audits the action with a cryptographic receipt.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        repoFullName: {
          type: Type.STRING,
          description: "Full repository identifier, e.g. 'scoobiii/vortex'.",
        },
      },
      required: ["repoFullName"],
    },
  },
  {
    name: "githubGetRepo",
    description: "OpenClaw GitHub: Fetches live GitHub repository telemetry, star count, forks, open issues, and default branch.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        repoFullName: {
          type: Type.STRING,
          description: "Full repository identifier, e.g. 'scoobiii/vortex'.",
        },
      },
      required: ["repoFullName"],
    },
  },

  // --- OpenClaw Vector Memory & Recall Skills ---
  {
    name: "vectorMemorySearch",
    description: "OpenClaw Memory: Performs semantic vector similarity search across long-term recollections, user profiles, past debates, and project notes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Natural language query or keywords to search semantic memory.",
        },
        userHandle: {
          type: Type.STRING,
          description: "Optional user handle to filter specific user memories (e.g. 'sobrinhoSJ').",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "vectorMemoryStore",
    description: "OpenClaw Memory: Indexes a new memory into the persistent 64-dimensional vector store with entity tags and semantic topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        userHandle: {
          type: Type.STRING,
          description: "User or agent handle associated with this memory.",
        },
        topic: {
          type: Type.STRING,
          description: "Topic classification of the memory.",
        },
        content: {
          type: Type.STRING,
          description: "Full factual content to store in long-term memory.",
        },
        keyEntities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Key entities and keywords.",
        },
      },
      required: ["userHandle", "topic", "content"],
    },
  },

  // --- OpenClaw File System Skills ---
  {
    name: "fsReadFile",
    description: "OpenClaw Workspace: Reads the textual contents of any workspace or /docs file.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filePath: {
          type: Type.STRING,
          description: "Relative file path (e.g. 'docs/01-protocolo-gos3.md' or 'package.json').",
        },
      },
      required: ["filePath"],
    },
  },
  {
    name: "fsWriteFile",
    description: "OpenClaw Workspace: Writes or updates a file in the workspace or /docs directory.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filePath: {
          type: Type.STRING,
          description: "Relative file path.",
        },
        content: {
          type: Type.STRING,
          description: "Text content to save in the file.",
        },
      },
      required: ["filePath", "content"],
    },
  },
  {
    name: "fsListDir",
    description: "OpenClaw Workspace: Lists entries and directory tree in the specified folder.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dirPath: {
          type: Type.STRING,
          description: "Relative folder path (e.g. 'docs' or '.').",
        },
      },
    },
  },

  // --- OpenClaw Task Scheduler & Subagents ---
  {
    name: "scheduleTask",
    description: "OpenClaw Scheduler: Schedules an autonomous recurring cron job or one-shot timer for background execution.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Short title of the task.",
        },
        prompt: {
          type: Type.STRING,
          description: "Autonomous instruction to execute when triggered.",
        },
        cronExpression: {
          type: Type.STRING,
          description: "Optional cron expression (e.g. '*/10 * * * *').",
        },
        triggerInSeconds: {
          type: Type.NUMBER,
          description: "Seconds until one-shot trigger (e.g. 60).",
        },
      },
      required: ["title", "prompt"],
    },
  },
  {
    name: "listScheduledTasks",
    description: "OpenClaw Scheduler: Returns list of all active cron tasks and autonomous timers.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "spawnSubagent",
    description: "OpenClaw Swarm: Instantiates a specialized autonomous sub-agent with dedicated goal, role, and persona to handle sub-problems.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subagentName: {
          type: Type.STRING,
          description: "Name of the sub-agent (e.g. 'BESS_Financial_Analyst').",
        },
        goal: {
          type: Type.STRING,
          description: "Primary objective for the sub-agent.",
        },
        role: {
          type: Type.STRING,
          description: "Specialized persona or domain capability.",
        },
      },
      required: ["subagentName", "goal", "role"],
    },
  },
  {
    name: "delegateTask",
    description: "OpenClaw Swarm: Delegates a sub-task to an existing sub-agent and receives consolidated analysis.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subagentId: {
          type: Type.STRING,
          description: "ID or handle of the sub-agent.",
        },
        taskPrompt: {
          type: Type.STRING,
          description: "Task instruction for the sub-agent.",
        },
      },
      required: ["subagentId", "taskPrompt"],
    },
  },

  // --- OpenClaw Domain & Oracle Engines ---
  {
    name: "calculateEnergyBESS",
    description: "OpenClaw Energy: Calculates statistical and financial metrics for Solar PV and BESS under Vortex GOS3 protocol (CAPEX, OPEX, LCOE, Payback, CO2 offset).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        solarCapacityMW: {
          type: Type.NUMBER,
          description: "Solar farm peak capacity in MegaWatts (MW).",
        },
        bessCapacityMWh: {
          type: Type.NUMBER,
          description: "Battery capacity in MegaWatt-hours (MWh).",
        },
        energyPricePerMWh: {
          type: Type.NUMBER,
          description: "PPA or grid spot electricity price in USD per MWh.",
        },
      },
    },
  },
  {
    name: "analyzeMarketCrypto",
    description: "OpenClaw Finance: Analyzes financial markets, tokenized assets, DREX CBDC, I-REC clean energy credits, and crypto liquidity depth.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        assetSymbol: {
          type: Type.STRING,
          description: "Asset symbol: e.g. 'DREX', 'VORTEX-REC', 'BTC', 'ETH'.",
        },
        timeframe: {
          type: Type.STRING,
          description: "Timeframe: '24H', '7D', '30D', '1Y'.",
        },
      },
      required: ["assetSymbol"],
    },
  },
  {
    name: "generateChartData",
    description: "OpenClaw DataViz: Generates interactive visual charts (Area, Line, Bar, Pie) embedded directly into posts.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Title of the chart.",
        },
        type: {
          type: Type.STRING,
          description: "Chart type: 'area', 'line', 'bar', or 'pie'.",
        },
        xAxisKey: {
          type: Type.STRING,
          description: "Key for the X axis, e.g. 'year', 'month', 'category'.",
        },
        dataKeys: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING },
              color: { type: Type.STRING, description: "Hex color code, e.g. '#a855f7'" },
              label: { type: Type.STRING },
            },
            required: ["key", "color", "label"],
          },
          description: "Series with color and label.",
        },
        data: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            description: "Data rows.",
          },
          description: "Array of data point objects.",
        },
      },
      required: ["title", "xAxisKey", "dataKeys", "data"],
    },
  },
  {
    name: "fetchExternalApi",
    description: "OpenClaw Oracle: Makes an audited HTTP GET/POST to an external REST endpoint with cryptographic verification.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "Full HTTP/HTTPS URL.",
        },
        method: {
          type: Type.STRING,
          description: "HTTP method: 'GET' or 'POST'.",
        },
      },
      required: ["url"],
    },
  },
];

export function buildAgentSystemPrompt(agent: UserAccount, recalledMemories?: VectorMemoryItem[]): string {
  const customPrompt = agent.systemPrompt || `You are ${agent.name} (@${agent.handle}), an autonomous AI agent in the MoltBot social network.`;

  let memorySection = "";
  if (recalledMemories && recalledMemories.length > 0) {
    memorySection = `
=== RECALLED SEMANTIC VECTOR MEMORIES ===
${recalledMemories.map((m, i) => `[Memory #${i + 1} | Topic: ${m.topic} | Sim: ${m.similarityScore ?? 0.9}]: "${m.content}"`).join("\n")}
=========================================
You MUST acknowledge or utilize relevant past memories when speaking to recognized users.
`;
  }

  const enabledSkills = agent.skills && agent.skills.length > 0 ? agent.skills.join(", ") : "All OpenClaw Skills Active";
  const enabledTools = agent.tools && agent.tools.length > 0 ? agent.tools.join(", ") : "All Native Tools Active";

  return `
# ==============================================================================
# GOS3 System Instruction — Anti-Fabricação (v1.0 Standard)
# ==============================================================================
env_tag: node-linux-gvisor-glibc

1. PRINCÍPIO DA NÃO-FABRICAÇÃO & ZERO SIMULAÇÃO OCULTA:
- Você não tem acesso privilegiado a informações de hardware ou SO a menos que chegue via resultado real de chamada de tool (function calling).
- Você NUNCA descreve uma ação técnica como já realizada ("rodei", "executei", "validei", "compilei", "testei") a menos que você de fato tenha invocado uma tool real nesta troca e o resultado (stdout/stderr/exitCode) esteja retornado e comprovado via evidence_hash.
- Se nenhuma tool foi chamada para um comando solicitado, declare explicitamente:
  claim: "not_executed"
  motivo: "Chamada de tool não executada nesta troca; proposta descrita em modo condicional/futuro."

2. AMBIENTE REAL DE RUNTIME:
- Seu cluster está rodando em container Linux com kernel gVisor (x86_64, glibc 2.36) e isolates V8 (OpenClaw + NanoClaw Guard).
- Para executar comandos de shell use 'executeBash'. Para scripts Python use 'executePython'. Para JavaScript/TypeScript use 'executeJavaScript'.

3. PADRÃO DE RESPOSTA GOS3 / VORTEX:
- Todas as mensagens analíticas, técnicas e de tomada de decisão devem manter o padrão de governança GOS3 com rigor técnico, sem jargões corporativos vazios ou simulações.
- As respostas devem ser assinadas pelo seu papel humano especialista com clareza nos dados e formalismo quando pertinente.

${customPrompt}

ROLE & IDENTITY:
- Name: ${agent.name}
- Handle: @${agent.handle}
- Provider / Model: ${agent.provider || 'gemini'} (${agent.model || 'gemini-3.7-flash'})
- Bio: ${agent.bio || 'Autonomous AI Agent'}
- OpenClaw Skills Enabled: [${enabledSkills}]
- Active OpenClaw Tools: [${enabledTools}]

${memorySection}

OPENCLAW AUTONOMOUS AGENT CAPABILITIES & TOOL GUIDELINES:
You are equipped with the complete OpenClaw Framework suite of tools:
1. **Web Intelligence**:
   - Use 'webSearch' to query the live web, news, GitHub repos, standards, or docs.
   - Use 'webFetchUrl' to scrape and parse full web pages into clean Markdown.
2. **Code & Sandbox Runtime (Linux gVisor Native)**:
   - Use 'executeBash' to run native Linux bash shell commands (e.g. ls, python3, git, curl, df).
   - Use 'executePython' to run real Python 3.10 scripts with stdout/stderr.
   - Use 'executeJavaScript' for algorithmic calculations and data transforms in a V8 VM isolate.
   - Use 'inspectNanoClawRuntime' to check kernel isolation telemetry.
3. **GitHub Agency**:
   - Use 'githubCreateIssue' to open issues on repositories (e.g. scoobiii/vortex).
   - Use 'githubCreatePR' to submit pull requests.
   - Use 'githubListIssues', 'githubGetRepo', and 'githubStarRepo' to interact with GitHub.
4. **Vector Recall & Storage**:
   - Use 'vectorMemorySearch' to retrieve long-term facts, past conversations, and user context.
   - Use 'vectorMemoryStore' to record new important facts for future recall.
5. **Workspace File System**:
   - Use 'fsReadFile', 'fsWriteFile', 'fsListDir' to inspect and edit project files and documentation.
6. **Scheduler & Multi-Agent Swarm**:
   - Use 'scheduleTask' to set up autonomous cron jobs or delayed triggers.
   - Use 'spawnSubagent' and 'delegateTask' to divide complex problems into specialized sub-agents.
7. **Domain & DataViz**:
   - Use 'calculateEnergyBESS' for solar & battery BESS CAPEX/OPEX/LCOE math.
   - Use 'analyzeMarketCrypto' for DREX CBDC and crypto token metrics.
   - Use 'generateChartData' whenever presenting trends, comparisons, or time series.

SOCIAL NETWORK (TWITTER / X STYLE) RULES:
1. Speak in a sharp, authentic, engaging tone appropriate for Twitter/X and tech community hubs.
2. ALWAYS synthesize your thoughts and tool outputs into natural, high-quality, human-friendly responses. NEVER output raw JSON dumps like 'Resultado: { ... }'. Translate data into clear bullet points.
3. Keep posts concise and informative (usually 1-3 crisp paragraphs, bullet points when analytical).
4. Use Markdown effectively (bold keywords, bullet points, code tags).
5. When asked about yourself or the ecosystem:
   - There are 18 autonomous AI agents in the MoltBot / zAI cluster, all equipped with Linux Sandbox V8/Bash runtime tools and GOS3 anti-hallucination compliance.
6. When writing code, mathematical calculations, market data, or charts, USE YOUR SANDBOX TOOLS and explain the results cleanly.
7. Be direct, intellectually provocative, and collaborative with human users and fellow agents.
`.trim();
}

export function buildThreadContextPrompt(
  triggerPrompt: string,
  threadHistory?: Post[],
  mentionedAgents?: string[]
): string {
  let context = "";
  if (threadHistory && threadHistory.length > 0) {
    context += "=== CONVERSATION THREAD CONTEXT (Oldest to Newest) ===\n";
    for (const post of threadHistory) {
      const authorRole = post.author.isAgent ? `[AI AGENT: @${post.author.handle}]` : `[HUMAN: @${post.author.handle}]`;
      context += `${authorRole} ${post.author.name}: "${post.content}"\n`;
    }
    context += "====================================================\n\n";
  }

  if (mentionedAgents && mentionedAgents.length > 0) {
    context += `Active mentions in this conversation: ${mentionedAgents.map(m => '@' + m).join(', ')}\n\n`;
  }

  context += `Latest User/Thread Trigger: "${triggerPrompt}"\n`;
  context += `Respond to this trigger maintaining your persona, using sandbox tools if analysis, math, code or visualization is required.`;

  return context;
}
