export type UserRole = 'human' | 'agent';

export type ModelProviderId =
  | 'gemini'
  | 'groq'
  | 'grok'
  | 'claude'
  | 'gpt'
  | 'perplexity'
  | 'deepseek'
  | 'qwen'
  | 'local_simulation'
  | 'custom';

export interface ModelProviderConfig {
  id: ModelProviderId;
  name: string;
  providerCompany: string;
  baseUrl?: string;
  apiKey?: string;
  apiKeyPreview?: string;
  isConfigured: boolean;
  defaultModel: string;
  availableModels: string[];
  description: string;
  color: string;
  logoBadge: string;
  iconEmoji?: string;
  customHeaders?: Record<string, string>;
}

export interface VectorMemoryItem {
  id: string;
  userId?: string;
  userHandle: string;
  agentId?: string;
  agentHandle: string;
  topic: string;
  content: string;
  keyEntities: string[];
  similarityScore?: number;
  embeddingDimension?: number;
  embedding?: number[];
  sourcePostId?: string;
  timestamp?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OpenClawSkillDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  toolsCount: number;
  category: string;
  badge: string;
  iconName: string;
  documentation: string;
  tools: string[];
}

export interface OpenClawToolDefinition {
  id: string;
  name: string;
  description: string;
  skillId: string;
  category: 'code' | 'energy' | 'finance' | 'search' | 'visual' | 'memory' | 'github' | 'web' | 'system' | 'orchestration';
  parametersSchema: Record<string, any>;
  isNative: boolean;
  executionEngine: string;
}

export interface ScheduledTask {
  id: string;
  title: string;
  cronExpression?: string;
  triggerInSeconds?: number;
  prompt: string;
  agentHandle: string;
  status: 'active' | 'completed' | 'cancelled';
  runCount: number;
  createdAt: string;
  nextRun?: string;
  lastLog?: string;
}

export interface SubagentInstance {
  id: string;
  parentAgentHandle: string;
  subagentName: string;
  handle: string;
  goal: string;
  role: string;
  status: 'active' | 'idle' | 'completed';
  lastSynthesis?: string;
  createdAt: string;
}

export interface AgentToolConfig {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'energy' | 'finance' | 'search' | 'visual' | 'memory' | 'github' | 'web' | 'system' | 'orchestration';
  enabled: boolean;
  iconName: string;
  skillId?: string;
}

export interface AcademicCredential {
  id: string;
  institution: 'MIT' | 'Harvard' | 'USP' | 'FGV' | 'ITA' | 'Unicamp' | 'Stanford' | 'Oxford' | string;
  degree: 'Bacharelado' | 'Mestrado' | 'Doutorado (PhD)' | 'Pós-Doutorado' | 'MBA' | 'Especialização';
  field: string;
  year: number;
  verificationHash: string;
  certificateUrl?: string;
  honors?: string;
}

export interface AcademicCertificate {
  id: string;
  title: string;
  issuer: string;
  issuedAt: string;
  verificationHash: string;
  skillsAcquired: string[];
  gradeScore?: string;
  certificateBadge?: string;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  institution: string;
  instructor: string;
  durationHours: number;
  progressPercent: number;
  status: 'enrolled' | 'studying' | 'evaluating' | 'completed';
  gradeScore?: string;
  certificateId?: string;
  completedAt?: string;
}

export interface CustomVpsConnector {
  enabled: boolean;
  runtimeType: 'gcloud_run' | 'google_colab' | 'vps_ssh' | 'termux_android_a23' | 'custom_vm';
  serverHost?: string;
  serverPort?: number;
  authToken?: string;
  ramdiskPath?: string;
  activeTier?: 'free' | 'standard' | 'enterprise';
  environmentLabel?: string;
  customTools?: string[];
  lastPingMs?: number;
  status?: 'connected' | 'idle' | 'offline';
}

export interface SocialPresence {
  xHandle?: string;
  blueskyHandle?: string;
  linkedInUrl?: string;
  githubUsername?: string;
  whatsappNumber?: string;
  telegramHandle?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  operatorLoginEmail?: string;
  contactPhone?: string;
  gcloudRunAccessTier?: 'free' | 'standard' | 'enterprise';
  fullDuplexActive: boolean;
  autonomousPostingIntervalMinutes?: number;
  lastAutonomousPostAt?: string;
  autoReplyToMentions?: boolean;
  customVpsConnector?: CustomVpsConnector;
}

export interface HumanPersonaConfig {
  isHumanized: boolean;
  civilName?: string;
  academicTitle?: string; // "Prof. Dr.", "PhD", "MSc", "Eng.", "Dra."
  primaryInstitution?: string; // "MIT", "Harvard", "USP", "FGV", "ITA"
  almaMaterSummary?: string;
  degrees: AcademicCredential[];
  certificates: AcademicCertificate[];
  enrolledCourses: EnrolledCourse[];
  socialPresence: SocialPresence;
  voiceStyle?: 'academic_rigorous' | 'executive_concise' | 'pedagogical_friendly' | 'analytical_deep';
}

export interface OAuthScopePermission {
  id: string;
  name: string;
  service: 'drive' | 'calendar' | 'gmail' | 'sheets' | 'cloud' | 'profile';
  description: string;
  granted: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  grantedAgents: string[];
  lastAccessedAt?: string;
  resourceExamples?: string[];
}

export interface GoogleOAuthIntegrationState {
  isConnected: boolean;
  userEmail: string;
  tokenExpiresAt: string;
  refreshTokenPresent: boolean;
  clientId: string;
  scopes: OAuthScopePermission[];
  connectedResourcesSummary?: {
    driveFilesCount: number;
    calendarEventsCount: number;
    sheetsCount: number;
  };
  lastSyncedAt?: string;
}

export interface GOS3AgentMetadata {
  isCompliant: boolean;
  protocolVersion: string; // "v1.0"
  envTag: string; // "node-linux" | "browser-v8-isolate" | "node-android-termux" | "unknown"
  antiFabricationEnforced: boolean;
  zeroTrustSignature: string;
  lastInjectedAt: string;
  headerMetadata?: {
    agente: string;
    papel: string;
    fase: string;
    data: string;
    hora?: string;
    antes?: string;
    depois?: string;
    base?: string;
    assinatura?: string;
  };
}

export interface BigTechTelemetryProfile {
  deviceFingerprint: string; // Canvas hash, WebGL vendor, Screen resolution (e.g. "0x9E4B..._Canvas_1920x1080")
  ipGeoRegion: string; // e.g. "São Paulo, SP - BR (AS28573)"
  browserFingerprint: string; // User-Agent profile & Client Hints
  adTopicInterests: string[]; // e.g. ["BESS Energy Storage", "DREX & RWA", "Deep Learning", "Quantum Computing"]
  inferredDemographics: string; // e.g. "25-34 / Inferred Tech Specialist / Early Adopter"
  cookieTrackingId: string; // Pixel / GA identifier
  searchIntentClusters: string[]; // e.g. ["LCOE Solar BESS", "Zero-Token RAG", "Rust Linux Kernel", "Z3 Lean 4"]
  interactionGraphScore: number; // 0 - 100 engagement density index
  optOutPrivacyAudit: boolean; // True if synthetic anti-tracking shield is active
  telemetryConsentTier: 'strict_minimal' | 'anonymized_research' | 'bigtech_standard' | 'full_synthetic_sandbox';
  lastTrackingSyncAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  handle: string; // e.g. "sobrinhoSJ" or "VortexSolarAI"
  avatar: string;
  bio: string;
  role: UserRole;
  isAgent: boolean;
  isOfficial?: boolean;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  xHandle?: string;
  blueskyHandle?: string;
  linkedInUrl?: string;
  githubUsername?: string;
  customVpsConnector?: CustomVpsConnector;
  authProvider?: 'google' | 'handle' | 'system';
  provider?: ModelProviderId; // e.g. "gemini", "grok", "claude", "gpt", "deepseek", "qwen"
  model?: string; // e.g. "gemini-3.7-flash", "grok-3", "claude-3-7-sonnet", "gpt-4o", "deepseek-reasoner", "qwen-2.5-coder"
  systemPrompt?: string;
  temperature?: number;
  tools?: string[]; // IDs of enabled tools
  skills?: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  runsCount?: number;
  uptimePercent?: number;
  joinedDate: string;
  badge?: string;
  accentColor?: string;
  humanPersona?: HumanPersonaConfig;
  bigTechTelemetry?: BigTechTelemetryProfile;
  oauthIntegration?: GoogleOAuthIntegrationState;
  gos3Metadata?: GOS3AgentMetadata;
}

export type AttachmentType = 'image' | 'video' | 'url' | 'github_repo' | 'code_snippet' | 'document' | 'audio';

export interface PostAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  title?: string;
  description?: string;
  mimeType?: string;
  sizeBytes?: number;
  previewUrl?: string;
  metadata?: {
    videoDurationSeconds?: number;
    videoResolution?: string;
    repoFullName?: string;
    repoDefaultBranch?: string;
    repoStars?: number;
    repoForks?: number;
    repoLanguage?: string;
    repoOpenIssues?: number;
    repoFullTreeDepth?: number;
    repoTotalFilesAnalyzed?: number;
    repoAnalyzedSummary?: string;
    domain?: string;
    favicon?: string;
    authorName?: string;
  };
}

export interface ThoughtStep {
  id: string;
  title: string;
  description?: string;
  toolName?: string;
  inputArgs?: Record<string, any>;
  outputResult?: any;
  status: 'pending' | 'success' | 'error';
  latencyMs?: number;
  timestamp: string;
  // UX XAI (Explainable AI) properties
  decisionFactor?: string;
  confidenceScore?: number; // 0 to 1
  rationale?: string;
  falsificationCriteria?: string;
  groundingSources?: { title: string; url?: string; snippet?: string }[];
}

export interface AgentThoughtLog {
  model: string;
  provider?: ModelProviderId;
  promptUsed: string;
  totalDurationMs: number;
  steps: ThoughtStep[];
  evidenceHash: string;
  temperature?: number;
  tokensEstimate?: number;
  // UX XAI Explainable AI Summary
  xaiSummary?: {
    primaryHypothesis: string;
    rationale: string;
    keyAssumptions: string[];
    riskFactor: 'low' | 'moderate' | 'high';
    confidenceOverall: number;
    epistemicCertainty: 'empirical' | 'heuristic' | 'deductive' | 'speculative';
    falsificationVector: string;
  };
  recalledMemories?: {
    id: string;
    topic: string;
    similarity: number;
    summary: string;
  }[];
}

export interface InteractiveChartData {
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  xAxisKey: string;
  dataKeys: { key: string; color: string; label: string }[];
  data: Record<string, any>[];
  summary?: string;
}

export interface CodeExecutionArtifact {
  language: string;
  code: string;
  stdout?: string;
  result?: string;
  error?: string;
  executionTimeMs?: number;
  executedByTool?: string;
}

export interface ExternalSideEffectReceipt {
  service: 'github' | 'http_api' | 'oracle' | 'shell_python';
  action: string; // e.g. 'github.starRepo', 'github.getRepo', 'http.fetch', 'python.execute'
  target: string; // e.g. 'scoobiii/vortex', 'https://api.github.com/repos/scoobiii/vortex'
  status: 'success' | 'auth_required' | 'rate_limited' | 'error';
  httpStatus?: number;
  statusText?: string;
  authScope?: string;
  verified: boolean;
  evidenceHash: string;
  proofSignature?: string;
  latencyMs: number;
  data?: any;
  logs?: string[];
  timestamp: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: UserAccount;
  content: string;
  createdAt: string;
  likes: number;
  reposts: number;
  repliesCount: number;
  views: number;
  likedBy: string[]; // user handles or IDs
  repostedBy: string[];
  bookmarkedBy?: string[];
  parentId?: string; // If it's a reply
  threadRootId?: string;
  quotedPost?: Post;
  tags?: string[];
  mentions?: string[];
  attachments?: PostAttachment[];
  thoughtLog?: AgentThoughtLog;
  chartData?: InteractiveChartData;
  codeArtifact?: CodeExecutionArtifact;
  externalSideEffect?: ExternalSideEffectReceipt;
  isAgentGenerated?: boolean;
}

export interface DebateParticipant {
  agentId: string;
  stance?: string;
}

export interface DebateSession {
  id: string;
  topic: string;
  participants: UserAccount[];
  rounds: number;
  currentRound: number;
  status: 'idle' | 'running' | 'completed';
  postIds: string[];
  createdAt: string;
}

export type FeedFilter = 'for-you' | 'agents' | 'humans' | 'trending' | 'debates';

export interface ChatMessage {
  id: string;
  senderId: string;
  sender: UserAccount;
  receiverId?: string; // null for global chat, or recipient handle/id for private DM
  recipientHandle?: string;
  roomId: string; // "global" or "dm_user1_user2"
  isPrivate: boolean;
  content: string;
  createdAt: string;
  thoughtLog?: AgentThoughtLog;
  codeArtifact?: CodeExecutionArtifact;
  isAgentGenerated?: boolean;
}

export interface ChatConversation {
  id: string;
  roomId: string;
  isPrivate: boolean;
  title: string;
  participants: UserAccount[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface SystemHardwareTelemetry {
  cpuUsagePercent: number;
  ramUsedMB: number;
  ramTotalMB: number;
  v8HeapUsedMB: number;
  gpuVramUsedMB: number;
  gpuVramTotalMB: number;
  storageUsedMB: number;
  storageTotalMB: number;
  activeSockets: number;
  messagesTotal: number;
  totalUsers: number;
  activeAgents: number;
  bandwidthKBps: number;
  uptimeSeconds: number;
}

export interface UserQuotaUsage {
  userId: string;
  userHandle: string;
  tier: 'free' | 'pro' | 'enterprise' | 'vps_dedicated';
  monthlyCostUSD: number;
  balanceDREX: number;
  balanceUSD: number;
  llmTokensUsed: number;
  llmTokensLimit: number;
  llmTokensPercent: number;
  sandboxRunsUsed: number;
  sandboxRunsLimit: number;
  sandboxRunsPercent: number;
  storageUsedKB: number;
  storageLimitKB: number;
  storagePercent: number;
  privateRoomsCount: number;
  privateRoomsLimit: number;
  customVpsConnected: boolean;
  vpsHost?: string;
  isQuotaExceeded: boolean;
  warningThresholdReached: boolean;
  lastRefillDate: string;
}

export interface LocalLLMConfig {
  provider: 'browser_wasm' | 'local_ollama' | 'local_vllm' | 'embedded_slm';
  endpointUrl: string;
  modelName: string;
  isLocalActive: boolean;
  quantization: 'q4_k_m' | 'q8_0' | 'fp16' | 'none';
  gpuOffloadLayers: number;
}

export type VoiceInteractionMode = '1x1' | '1xn_roundtable' | '1xn_consensus' | '1xn_broadcast';

export interface VoiceTurn {
  id: string;
  speaker: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  agentHandle?: string;
  agentAvatar?: string;
  text: string;
  timestamp: string;
  isZeroTokenRAG?: boolean;
  voicePitch?: number;
  voiceRate?: number;
  evidenceHash?: string;
  n8nDispatched?: boolean;
}

export interface VoiceConferenceSession {
  id: string;
  title: string;
  mode: VoiceInteractionMode;
  activeSpeakerId: string | null;
  participants: UserAccount[];
  turns: VoiceTurn[];
  status: 'idle' | 'listening' | 'speaking' | 'processing';
  n8nSyncActive: boolean;
  n8nWebhookUrl?: string;
  createdAt: string;
}

export interface N8nBridgeConfig {
  webhookUrl: string;
  apiKey?: string;
  autoSyncVoice: boolean;
  autoSyncChat: boolean;
  workflowName: string;
  lastDispatchedAt?: string;
  status: 'connected' | 'idle' | 'error';
  lastLog?: string;
}

export interface N8nDispatchPayload {
  event: 'voice_1xn_turn' | 'chat_message' | 'task_action' | 'roundtable_consensus';
  timestamp: string;
  sessionMode?: VoiceInteractionMode;
  sender: {
    id: string;
    name: string;
    handle: string;
    isAgent: boolean;
  };
  data: any;
  evidenceHash?: string;
}

export type ConnectorCategory = 'google' | 'destaques' | 'produtividade' | 'desenvolvimento' | 'automacao';

export interface ExternalConnector {
  id: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  iconType: string;
  color: string;
  badge?: string;
  isConnected: boolean;
  isGoogleEcosystem?: boolean;
  enablesSandbox?: boolean;
  authRequired: boolean;
  accountEmail?: string;
  connectedAt?: string;
  capabilities: string[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'file' | 'repo' | 'image' | 'camera' | 'colab_notebook';
  sizeFormatted: string;
  targetAgentHandle?: string; // e.g. "@claude", "@GAIStudioDev"
  dataUrl?: string;
  repoDetails?: {
    owner: string;
    repo: string;
    branch: string;
    filesCount: number;
    description: string;
  };
  uploadedAt: string;
}

export type GrokThinkingMode = 'fast' | 'deep_think' | 'council_1xn' | 'debate_nxn';

export type ColabRuntimeMode = 'cli' | 'gui_full';

export interface ColabCellResult {
  id: string;
  cellType: 'code' | 'markdown' | 'bash';
  input: string;
  output?: string;
  status: 'idle' | 'running' | 'success' | 'error';
  executionTimeMs?: number;
  hasGpuSupport?: boolean;
  timestamp: string;
}

