import React, { useState, useEffect } from "react";
import { VectorMemoryItem } from "../../types";
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Tag,
  Clock,
  Sparkles,
  Database,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Filter,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VectorMemoryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<VectorMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VectorMemoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Memory Form State
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newUserHandle, setNewUserHandle] = useState("sobrinhoSJ");
  const [newAgentHandle, setNewAgentHandle] = useState("VortexGrid");
  const [newEntities, setNewEntities] = useState("BESS, Solar, 60MWh, GOS3");
  const [savingNew, setSavingNew] = useState(false);

  const fetchMemories = async () => {
    try {
      const res = await fetch("/api/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error("Failed to load memories:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
      setSearchQuery("");
      setSearchResults([]);
      setIsCreatingNew(false);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/memories/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userHandle: selectedUserFilter === "all" ? undefined : selectedUserFilter,
          topK: 10,
          minSimilarity: 0.02,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setSearchResults((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newContent.trim()) return;

    setSavingNew(true);
    try {
      const entities = newEntities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userHandle: newUserHandle,
          agentHandle: newAgentHandle,
          topic: newTopic,
          content: newContent,
          keyEntities: entities,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setMemories((prev) => [created, ...prev]);
        setIsCreatingNew(false);
        setNewTopic("");
        setNewContent("");
      }
    } catch (err) {
      console.error("Failed to add memory:", err);
    } finally {
      setSavingNew(false);
    }
  };

  if (!isOpen) return null;

  const displayList = searchQuery.trim() ? searchResults : memories;
  const filteredList =
    selectedUserFilter === "all"
      ? displayList
      : displayList.filter(
          (m) => m.userHandle.toLowerCase() === selectedUserFilter.toLowerCase()
        );

  const uniqueUsers = Array.from(new Set(memories.map((m) => m.userHandle)));

  return (
    <div
      id="vector-memory-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Memória Vetorial Persistente & RAG
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-mono">
                  {memories.length} memórias indexadas
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Busca vetorial com similaridade por cosseno em embeddings normalizados L2 para cada usuário e agente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/40 flex flex-col sm:flex-row gap-2.5 items-center">
          <form onSubmit={handleSearch} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar memórias por similaridade semântica (ex: BESS, CAPEX, DREX, Sobrinho, Vortex)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults([]);
              }}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-24 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {/* User Filter */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none"
            >
              <option value="all">Todos Usuários ({memories.length})</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  @{u}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Memória</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Create New Memory Drawer/Box */}
          {isCreatingNew && (
            <form
              onSubmit={handleCreateMemory}
              className="p-4 rounded-2xl bg-neutral-950 border border-emerald-800/40 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Registrar Nova Memória Semântica
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-neutral-500 hover:text-neutral-300 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Tópico / Título
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Especificação Solar 30MW + BESS 60MWh"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Usuário Associado (@handle)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sobrinhoSJ"
                    value={newUserHandle}
                    onChange={(e) => setNewUserHandle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Conteúdo Detalhado da Memória
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o contexto, dados técnicos, decisões de engenharia ou preferências do usuário..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Entidades-Chave (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="BESS, Solar, CAPEX, LFP, 60MWh"
                  value={newEntities}
                  onChange={(e) => setNewEntities(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingNew}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingNew ? "Indexando Vetor..." : "Salvar no Banco Vetorial"}
                </button>
              </div>
            </form>
          )}

          {/* Memory Items List */}
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Brain className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
              <div className="font-semibold text-neutral-400">Nenhuma memória encontrada</div>
              <div className="text-xs">
                {searchQuery ? "Nenhum resultado com similaridade satisfatória." : "Crie uma nova memória para testar o RAG dos agentes."}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-100">{item.topic}</span>
                        {item.similarityScore !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                            Cosine Sim: {(item.similarityScore * 100).toFixed(1)}%
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40 font-mono">
                          @{item.userHandle}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-2">
                        <span>Gravado por: @{item.agentHandle || "Sistema"}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp || item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMemory(item.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Excluir memória"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/40">
                    {item.content}
                  </p>

                  {/* Entities and embedding preview */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.keyEntities.map((ent, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-400 border border-neutral-800 font-mono"
                        >
                          #{ent}
                        </span>
                      ))}
                    </div>

                    <div className="text-[9px] text-neutral-500 font-mono">
                      Dim: 64 • Embedding: [{item.embedding ? item.embedding.slice(0, 4).map((v) => v.toFixed(3)).join(", ") : "0.142, 0.389..."}...]
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Memória vetorial sincronizada automaticamente durante menções @ e posts no feed.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
