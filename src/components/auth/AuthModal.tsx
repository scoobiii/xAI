import React, { useState, useEffect } from "react";
import { UserAccount, GoogleOAuthIntegrationState, OAuthScopePermission } from "../../types";
import {
  LogIn,
  User,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
  CheckCircle,
  ArrowRight,
  HardDrive,
  Calendar,
  FileSpreadsheet,
  Cloud,
  Key,
  RefreshCw,
  Sliders,
  Check,
  ShieldAlert,
  Bot,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"handle" | "google" | "oauth-scopes">("handle");
  const [handleInput, setHandleInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [googleEmailInput, setGoogleEmailInput] = useState("sobrinhoSJ@gmail.com");
  const [googleNameInput, setGoogleNameInput] = useState("Sobrinho SJ");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OAuth Scopes Management State
  const [oauthState, setOauthState] = useState<GoogleOAuthIntegrationState | null>(null);
  const [loadingOauth, setLoadingOauth] = useState(false);
  const [expandedScopeId, setExpandedScopeId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Quick initial scopes for Google Tab login
  const [selectedInitialScopes, setSelectedInitialScopes] = useState<string[]>([
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
  ]);

  const availableAgents = [
    { handle: "@GAIStudioDev", name: "Google AI Studio Dev Assistant" },
    { handle: "@VortexGrid", name: "Vortex Solar & Grid" },
    { handle: "@ProfMarcos_MIT", name: "Prof. Dr. Marcos Vasconcelos (MIT)" },
    { handle: "@DraHelena_USP", name: "Dra. Helena Vasconcelos (USP)" },
    { handle: "@DrFausto_FGV_Harvard", name: "Dr. Rodrigo Fausto (Harvard/FGV)" },
    { handle: "@CryptoQuant", name: "Crypto & DREX Quant" },
    { handle: "@CodeKernel", name: "Code Kernel AI" },
    { handle: "@SocratesAI", name: "Socrates AI Dialectic" },
  ];

  const fetchOAuthState = async () => {
    try {
      setLoadingOauth(true);
      const userId = currentUser?.id || "user-sobrinho";
      const res = await fetch(`/api/auth/oauth-state?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.oauthState) {
        setOauthState(data.oauthState);
      }
    } catch (err: any) {
      console.error("Failed to load OAuth state:", err);
    } finally {
      setLoadingOauth(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOAuthState();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleHandleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handleInput.replace("@", "").trim();
    if (!cleanHandle) {
      setErrorMsg("Por favor, digite seu @username (handle)");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: cleanHandle,
          name: nameInput.trim() || `@${cleanHandle}`,
          bio: bioInput.trim() || undefined,
          authProvider: "handle",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na autenticação");

      setSuccessMsg(`Conectado com sucesso como @${data.user.handle}!`);
      onLoginSuccess(data.user);
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = googleEmailInput.trim();
    if (!email || !email.includes("@")) {
      setErrorMsg("E-mail Google inválido");
      return;
    }

    const handleDerived = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handleDerived,
          name: googleNameInput.trim() || handleDerived,
          email: email,
          avatar: `https://lh3.googleusercontent.com/a/default-user=s120-c`,
          bio: `Conta Google verificada (${email}). Arquitetura de agentes autônomos e Vortex GOS3.`,
          authProvider: "google",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na autenticação Google");

      setSuccessMsg(`Autenticado com Google (@${data.user.handle}) com ${selectedInitialScopes.length} escopos autorizados!`);
      onLoginSuccess(data.user);
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao conectar conta Google");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleScope = async (scopeId: string, currentGranted: boolean) => {
    try {
      const userId = currentUser?.id || "user-sobrinho";
      const res = await fetch("/api/auth/oauth-scopes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scopeId,
          granted: !currentGranted,
        }),
      });
      const data = await res.json();
      if (data.success && data.oauthState) {
        setOauthState(data.oauthState);
        setActionSuccessMsg(`Escopo ${!currentGranted ? "concedido" : "revogado"} com sucesso!`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao alterar escopo: ${err.message}`);
    }
  };

  const handleUpdateGrantedAgents = async (scopeId: string, agents: string[]) => {
    try {
      const userId = currentUser?.id || "user-sobrinho";
      const res = await fetch("/api/auth/oauth-scopes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scopeId,
          granted: true,
          grantedAgents: agents,
        }),
      });
      const data = await res.json();
      if (data.success && data.oauthState) {
        setOauthState(data.oauthState);
        setActionSuccessMsg(`Agentes autorizados para este escopo atualizados!`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao atualizar agentes: ${err.message}`);
    }
  };

  const handleSyncGoogleResources = async () => {
    try {
      setLoadingOauth(true);
      const userId = currentUser?.id || "user-sobrinho";
      const res = await fetch("/api/auth/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.oauthState) {
        setOauthState(data.oauthState);
        setActionSuccessMsg("Recursos Google Drive e Calendar sincronizados com o motor de agentes!");
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(`Erro na sincronização: ${err.message}`);
    } finally {
      setLoadingOauth(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Deseja realmente revogar todos os escopos Google concedidos aos agentes?")) {
      return;
    }
    try {
      setLoadingOauth(true);
      const userId = currentUser?.id || "user-sobrinho";
      const res = await fetch("/api/auth/oauth-scopes/revoke-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.oauthState) {
        setOauthState(data.oauthState);
        setActionSuccessMsg("Todos os acessos Google foram revogados.");
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao revogar escopos: ${err.message}`);
    } finally {
      setLoadingOauth(false);
    }
  };

  const getServiceIcon = (service: OAuthScopePermission["service"]) => {
    switch (service) {
      case "drive":
        return <HardDrive className="w-4 h-4 text-emerald-400" />;
      case "calendar":
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case "sheets":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case "gmail":
        return <Mail className="w-4 h-4 text-rose-400" />;
      case "cloud":
        return <Cloud className="w-4 h-4 text-indigo-400" />;
      default:
        return <Key className="w-4 h-4 text-purple-400" />;
    }
  };

  const getRiskBadge = (risk: OAuthScopePermission["riskLevel"]) => {
    switch (risk) {
      case "low":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">Risco Baixo</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 border border-amber-800/60 text-amber-400">Risco Médio</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 border border-rose-800/60 text-rose-400">Risco Alto (Admin)</span>;
    }
  };

  const grantedScopesCount = oauthState?.scopes.filter(s => s.granted).length || 0;

  return (
    <div id="auth-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="auth-login-modal"
        className="w-full max-w-2xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                Autenticação & Google OAuth Scopes
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                  GOS3 v0.2
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Gerenciamento de identidade e permissões granulares para agentes</p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Auth Status Banner */}
        {currentUser && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-neutral-700 bg-neutral-800"
            />
            <div className="flex-1 min-w-0 text-xs">
              <div className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold">
                Sessão Ativa:
              </div>
              <div className="font-bold text-neutral-200 truncate">{currentUser.name}</div>
              <div className="text-purple-400 font-mono">@{currentUser.handle} {currentUser.email && `(${currentUser.email})`}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {currentUser.authProvider === "google" ? "Google SSO" : "Handle"}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 text-xs font-semibold px-6 pt-2 bg-neutral-950/40">
          <button
            id="tab-auth-handle"
            onClick={() => {
              setActiveTab("handle");
              setErrorMsg("");
            }}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "handle"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Login por @Handle</span>
          </button>

          <button
            id="tab-auth-google"
            onClick={() => {
              setActiveTab("google");
              setErrorMsg("");
            }}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "google"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Conta Google</span>
          </button>

          <button
            id="tab-auth-scopes"
            onClick={() => {
              setActiveTab("oauth-scopes");
              setErrorMsg("");
            }}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "oauth-scopes"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Permissões & OAuth Scopes</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
              {grantedScopesCount}
            </span>
          </button>
        </div>

        {/* Messages */}
        <div className="px-6 pt-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {actionSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: HANDLE */}
          {activeTab === "handle" && (
            <form onSubmit={handleHandleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Seu @Handle / Nome de Usuário <span className="text-purple-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 font-mono font-bold">@</span>
                  <input
                    id="handle-login-input"
                    type="text"
                    required
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="sobrinhoSJ, dev_hero, satoshi..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-8 pr-3 py-2 text-neutral-100 font-mono focus:border-purple-500 focus:outline-none placeholder:text-neutral-600 text-xs"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Se já existir, sua conta e histórico serão carregados na hora. Se for nova, criaremos seu perfil persistido.
                </p>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nome de Exibição (Opcional)</label>
                <input
                  id="handle-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex: Sobrinho SJ, Alex Developer"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:border-purple-500 focus:outline-none placeholder:text-neutral-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Bio / Descrição (Opcional)</label>
                <textarea
                  id="handle-bio-input"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Ex: Arquiteto de sistemas, entusiasta de energias renováveis e IA autônoma..."
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:border-purple-500 focus:outline-none placeholder:text-neutral-600 text-xs resize-none"
                />
              </div>

              <button
                id="submit-handle-login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{loading ? "Autenticando..." : "Entrar com @Handle"}</span>
              </button>
            </form>
          )}

          {/* TAB 2: GOOGLE LOGIN */}
          {activeTab === "google" && (
            <form onSubmit={handleGoogleLogin} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-neutral-200">Google OAuth 2.0 Single Sign-On</div>
                  <div className="text-[10px] text-neutral-400">Conecte sua conta do Google Workspace com escopos granulares</div>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  E-mail Google <span className="text-purple-400">*</span>
                </label>
                <input
                  id="google-email-input"
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="sobrinhoSJ@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:border-purple-500 focus:outline-none placeholder:text-neutral-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nome Completo da Conta</label>
                <input
                  id="google-name-input"
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Sobrinho SJ"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:border-purple-500 focus:outline-none placeholder:text-neutral-600 text-xs"
                />
              </div>

              {/* Scopes pre-authorization preview */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    Escopos Autorizados Nesta Sessão:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("oauth-scopes")}
                    className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                  >
                    Gerenciar todos
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                    <input
                      type="checkbox"
                      checked={selectedInitialScopes.includes("https://www.googleapis.com/auth/drive.readonly")}
                      onChange={(e) => {
                        const s = "https://www.googleapis.com/auth/drive.readonly";
                        setSelectedInitialScopes(e.target.checked ? [...selectedInitialScopes, s] : selectedInitialScopes.filter(x => x !== s));
                      }}
                      className="rounded bg-neutral-950 border-neutral-700 text-purple-600 focus:ring-0"
                    />
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-neutral-200 truncate">Google Drive (RAG Docs)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                    <input
                      type="checkbox"
                      checked={selectedInitialScopes.includes("https://www.googleapis.com/auth/calendar.events")}
                      onChange={(e) => {
                        const s = "https://www.googleapis.com/auth/calendar.events";
                        setSelectedInitialScopes(e.target.checked ? [...selectedInitialScopes, s] : selectedInitialScopes.filter(x => x !== s));
                      }}
                      className="rounded bg-neutral-950 border-neutral-700 text-purple-600 focus:ring-0"
                    />
                    <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="text-neutral-200 truncate">Google Calendar (Sprints)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                    <input
                      type="checkbox"
                      checked={selectedInitialScopes.includes("https://www.googleapis.com/auth/spreadsheets")}
                      onChange={(e) => {
                        const s = "https://www.googleapis.com/auth/spreadsheets";
                        setSelectedInitialScopes(e.target.checked ? [...selectedInitialScopes, s] : selectedInitialScopes.filter(x => x !== s));
                      }}
                      className="rounded bg-neutral-950 border-neutral-700 text-purple-600 focus:ring-0"
                    />
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-neutral-200 truncate">Google Sheets (DREX/BESS)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                    <input
                      type="checkbox"
                      checked={selectedInitialScopes.includes("https://www.googleapis.com/auth/cloud-platform")}
                      onChange={(e) => {
                        const s = "https://www.googleapis.com/auth/cloud-platform";
                        setSelectedInitialScopes(e.target.checked ? [...selectedInitialScopes, s] : selectedInitialScopes.filter(x => x !== s));
                      }}
                      className="rounded bg-neutral-950 border-neutral-700 text-purple-600 focus:ring-0"
                    />
                    <Cloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-neutral-200 truncate">GCP & Cloud Run Gateway</span>
                  </label>
                </div>
              </div>

              <button
                id="submit-google-login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                <span>{loading ? "Conectando Google..." : "Entrar com Conta Google & Autorizar Scopes"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* TAB 3: OAUTH SCOPES & GOOGLE CLOUD INTEGRATION MANAGEMENT */}
          {activeTab === "oauth-scopes" && (
            <div className="space-y-5 text-xs">
              {/* Integration Status Card */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-300">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-100 flex items-center gap-2">
                        Google Cloud & Workspace Integration
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-mono">
                          OAuth 2.0 Ativo
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Conta: <span className="text-neutral-200 font-semibold">{oauthState?.userEmail || "sobrinhoSJ@gmail.com"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="sync-google-resources-btn"
                      onClick={handleSyncGoogleResources}
                      disabled={loadingOauth}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingOauth ? "animate-spin" : ""}`} />
                      <span>Sincronizar</span>
                    </button>
                    <button
                      id="revoke-all-scopes-btn"
                      onClick={handleRevokeAll}
                      disabled={loadingOauth}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>Revogar Tudo</span>
                    </button>
                  </div>
                </div>

                {/* Resource Metrics Counter */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                    <div className="text-neutral-400 text-[10px]">Google Drive</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {oauthState?.connectedResourcesSummary?.driveFilesCount || 14}
                    </div>
                    <div className="text-[9px] text-neutral-500">Documentos RAG</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                    <div className="text-neutral-400 text-[10px]">Google Calendar</div>
                    <div className="text-base font-bold text-sky-400 font-mono">
                      {oauthState?.connectedResourcesSummary?.calendarEventsCount || 8}
                    </div>
                    <div className="text-[9px] text-neutral-500">Sprints & Reuniões</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
                    <div className="text-neutral-400 text-[10px]">Google Sheets</div>
                    <div className="text-base font-bold text-emerald-500 font-mono">
                      {oauthState?.connectedResourcesSummary?.sheetsCount || 5}
                    </div>
                    <div className="text-[9px] text-neutral-500">Planilhas DREX/BESS</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1">
                  <span>Validade do Token: 7 dias (Auto-Refresh Ativo)</span>
                  <span>Última Sincronização: {new Date(oauthState?.lastSyncedAt || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Scopes List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    Escopos Granulares & Política de Acesso aos Agentes:
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    {grantedScopesCount} de {oauthState?.scopes.length || 8} concedidos
                  </span>
                </div>

                {oauthState?.scopes.map((scope) => {
                  const isExpanded = expandedScopeId === scope.id;
                  const isAllAgents = scope.grantedAgents.includes("*");

                  return (
                    <div
                      key={scope.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        scope.granted
                          ? "bg-neutral-950/90 border-neutral-800"
                          : "bg-neutral-950/40 border-neutral-900 opacity-70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0 mt-0.5">
                            {getServiceIcon(scope.service)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-neutral-200 text-xs">{scope.name}</span>
                              {getRiskBadge(scope.riskLevel)}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{scope.description}</p>

                            <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-500 font-mono flex-wrap">
                              <span className="truncate max-w-[280px]">ID: {scope.id}</span>
                              {scope.lastAccessedAt && (
                                <span>Último Acesso: {new Date(scope.lastAccessedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Grant Toggle Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            id={`toggle-scope-${scope.service}`}
                            onClick={() => handleToggleScope(scope.id, scope.granted)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              scope.granted
                                ? "bg-emerald-950 border border-emerald-700 text-emerald-300 hover:bg-emerald-900"
                                : "bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                            }`}
                          >
                            {scope.granted ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Concedido</span>
                              </>
                            ) : (
                              <span>Não Concedido</span>
                            )}
                          </button>

                          <button
                            onClick={() => setExpandedScopeId(isExpanded ? null : scope.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section: Agent Authorization Config & Resource Samples */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-3 animate-in fade-in">
                          {/* Granular Agent Authorization Policy */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-purple-400" />
                                Agentes com Permissão de Uso para este Escopo:
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGrantedAgents(scope.id, ["*"])}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                    isAllAgents
                                      ? "bg-purple-900/60 border border-purple-700 text-purple-200"
                                      : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                                  }`}
                                >
                                  Todos os Agentes (*)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateGrantedAgents(scope.id, ["@GAIStudioDev", "@VortexGrid"])}
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                    !isAllAgents && scope.grantedAgents.length > 0
                                      ? "bg-purple-900/60 border border-purple-700 text-purple-200"
                                      : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                                  }`}
                                >
                                  Personalizado
                                </button>
                              </div>
                            </div>

                            {/* Specific Agent Checkboxes */}
                            {!isAllAgents && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                                {availableAgents.map((ag) => {
                                  const isChecked = scope.grantedAgents.includes(ag.handle);
                                  return (
                                    <label
                                      key={ag.handle}
                                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer text-[11px]"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          let updated: string[];
                                          if (e.target.checked) {
                                            updated = [...scope.grantedAgents.filter(x => x !== "*"), ag.handle];
                                          } else {
                                            updated = scope.grantedAgents.filter(x => x !== ag.handle);
                                          }
                                          handleUpdateGrantedAgents(scope.id, updated);
                                        }}
                                        className="rounded bg-neutral-950 border-neutral-700 text-purple-600 focus:ring-0"
                                      />
                                      <span className="font-mono text-purple-300 font-semibold">{ag.handle}</span>
                                      <span className="text-neutral-400 truncate text-[10px]">{ag.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {isAllAgents && (
                              <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-800/40 text-[10px] text-purple-300 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span>Qualquer agente registrado do sistema pode invocar ferramentas associadas a este recurso Google.</span>
                              </div>
                            )}
                          </div>

                          {/* Example Resources Accessible */}
                          {scope.resourceExamples && scope.resourceExamples.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                Exemplos de Recursos Conectados:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {scope.resourceExamples.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono flex items-center gap-1"
                                  >
                                    <FileSpreadsheet className="w-3 h-3 text-neutral-500" />
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Zero-Token / Security Notice */}
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
                <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-neutral-400 leading-relaxed">
                  <strong className="text-neutral-200">Garantia Criptográfica & Zero-Token RAG:</strong> Todos os acessos aos escopos Google Drive e Calendar são registrados com hashes SHA-256 no log de auditoria GOS3, e documentos indexados podem ser consultados no cache vetorial local sem consumo de tokens externos de LLM.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
