import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api, Workflow } from "@/lib/api";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Search, Trash2, Edit, Play, ChevronRight,
  Workflow as WorkflowIcon, Clock, GitBranch,
  Loader2, Sparkles, X, Check, ArrowRight
} from "lucide-react";

const STATUS_OPTIONS = ["all", "draft", "active", "inactive"];

interface AiPreviewStep {
  name: string; stepType: string; order: number; rules?: any[];
}

export default function WorkflowsPage() {
  const [, setLocation] = useLocation();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiSaving, setAiSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      const res: any = await api.get(`/workflows?${params}`);
      setWorkflows(res.workflows || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, status]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const wf: any = await api.post("/workflows", { name: newName, description: newDesc, status: "draft" });
      toast.success("Workflow created!");
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setLocation(`/workflows/${wf.id}/edit`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow? All steps and rules will be removed.")) return;
    setDeletingId(id);
    try {
      await api.del(`/workflows/${id}`);
      toast.success("Workflow deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiPreview(null);
    try {
      const res: any = await api.post("/ai/generate-workflow", { prompt: aiPrompt, save: false });
      setAiPreview(res.preview);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleAiSave() {
    setAiSaving(true);
    try {
      const res: any = await api.post("/ai/generate-workflow", { prompt: aiPrompt, save: true });
      toast.success(`Workflow "${res.workflowName}" created with ${res.stepCount} steps!`);
      setShowAI(false);
      setAiPrompt("");
      setAiPreview(null);
      setLocation(`/workflows/${res.workflowId}/edit`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiSaving(false);
    }
  }

  return (
    <AppLayout
      title="Workflows"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Generate with AI
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Workflow
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition capitalize ${status === s ? "bg-sky-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <WorkflowIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-lg font-medium">No workflows found</p>
          <p className="text-sm mt-1">Create manually or <button onClick={() => setShowAI(true)} className="text-violet-500 hover:underline">generate with AI</button></p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowCreate(true)} className="bg-sky-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-sky-600 transition">
              Create Manually
            </button>
            <button onClick={() => setShowAI(true)} className="bg-violet-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-violet-600 transition flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map((wf, i) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <WorkflowIcon className="w-5 h-5 text-sky-600" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium capitalize ${statusBadge(wf.status)}`}>{wf.status}</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 truncate">{wf.name}</h3>
              {wf.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{wf.description}</p>}
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 mt-auto">
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {wf.stepCount || 0} steps</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> v{wf.version}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/workflows/${wf.id}/edit`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </Link>
                {wf.status === "active" && (
                  <Link href={`/workflows/${wf.id}/execute`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium rounded-xl transition">
                      <Play className="w-3.5 h-3.5" /> Run
                    </button>
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(wf.id)}
                  disabled={deletingId === wf.id}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"
                >
                  {deletingId === wf.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Workflow</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Workflow name *</label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Expense Approval"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating || !newName.trim()} className="flex-1 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 transition">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create & Edit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generation modal */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget && !aiGenerating && !aiSaving) { setShowAI(false); setAiPreview(null); setAiPrompt(""); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">AI Workflow Generator</h2>
                      <p className="text-xs text-slate-500">Describe your process in plain language</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowAI(false); setAiPreview(null); setAiPrompt(""); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Describe your workflow</label>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Create an expense approval workflow where amounts above $1000 require both manager and finance team approval, and amounts below $1000 just need manager approval. Send email notification when approved."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm resize-none"
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-slate-400 w-full">Quick examples:</p>
                  {[
                    "Employee leave request with manager and HR approval",
                    "Software access request needing IT team approval",
                    "Customer onboarding with verification steps"
                  ].map(ex => (
                    <button
                      key={ex}
                      onClick={() => setAiPrompt(ex)}
                      className="text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || aiGenerating}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-600 hover:to-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating workflow...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate Preview</>
                  )}
                </button>

                {/* AI Preview */}
                <AnimatePresence>
                  {aiPreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Preview Generated
                          </h3>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-medium">
                            {aiPreview.steps?.length || 0} steps
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <p className="font-semibold text-slate-800">{aiPreview.name}</p>
                          {aiPreview.description && <p className="text-sm text-slate-500 mt-1">{aiPreview.description}</p>}
                        </div>

                        {/* Steps preview */}
                        <div className="space-y-2 mb-4">
                          {(aiPreview.steps || []).map((step: AiPreviewStep, i: number) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center gap-3"
                            >
                              <div className="flex items-center gap-2 text-slate-400 text-xs w-6 justify-center">{i + 1}</div>
                              <div className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${stepTypeColor(step.stepType)}`}>
                                {step.stepType}
                              </div>
                              <span className="text-sm text-slate-700 font-medium">{step.name}</span>
                              {step.rules?.length ? (
                                <span className="text-xs text-slate-400 ml-auto">{step.rules.length} rules</span>
                              ) : null}
                              {i < (aiPreview.steps?.length || 0) - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-300 ml-1" />
                              )}
                            </motion.div>
                          ))}
                        </div>

                        {/* Input schema preview */}
                        {aiPreview.inputSchema && Object.keys(aiPreview.inputSchema).length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 mb-2">Input fields:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.keys(aiPreview.inputSchema).map(k => (
                                <span key={k} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">{k.replace(/_/g, " ")}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => setAiPreview(null)}
                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm transition"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={handleAiSave}
                            disabled={aiSaving}
                            className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-600 hover:to-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {aiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save & Edit Workflow
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    draft: "bg-slate-100 text-slate-600",
    inactive: "bg-red-50 text-red-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

function stepTypeColor(type: string) {
  const m: Record<string, string> = {
    approval: "bg-violet-50 text-violet-700 border-violet-200",
    notification: "bg-sky-50 text-sky-700 border-sky-200",
    task: "bg-green-50 text-green-700 border-green-200",
    api_call: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return m[type] || "bg-slate-100 text-slate-600 border-slate-200";
}
