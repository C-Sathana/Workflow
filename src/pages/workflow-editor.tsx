import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { useRoute, useLocation, Link } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  ArrowLeft, Play, Settings, GitBranch, CheckCircle2, AlertCircle,
  Loader2, Edit2, Check, X, PlusCircle, ArrowRight, Sparkles
} from "lucide-react";

const STEP_TYPES = ["approval", "notification", "task", "api_call", "condition"];
const STEP_TYPE_COLORS: Record<string, string> = {
  approval: "violet", notification: "sky", task: "green", api_call: "orange", condition: "amber"
};
const STEP_TYPE_LABELS: Record<string, string> = {
  approval: "Approval", notification: "Notification", task: "Task", api_call: "API Call", condition: "Condition"
};

export default function WorkflowEditorPage() {
  const [, params] = useRoute("/workflows/:id/edit");
  const id = params?.id;
  const [, setLocation] = useLocation();

  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [wfStatus, setWfStatus] = useState("draft");
  const [editingName, setEditingName] = useState(false);

  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [addingStep, setAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({ name: "", stepType: "approval" });
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);

  // Input schema editor
  const [schemaFields, setSchemaFields] = useState<{ key: string; type: string; required: boolean }[]>([]);
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);

  // AI rule generation
  const [aiRuleTarget, setAiRuleTarget] = useState<{ stepId: string; ruleId: string } | null>(null);
  const [aiRuleDesc, setAiRuleDesc] = useState("");
  const [aiRuleLoading, setAiRuleLoading] = useState(false);
  const [ruleInputRefs, setRuleInputRefs] = useState<Record<string, HTMLInputElement | null>>({});

  async function generateAiRule(stepId: string, ruleId: string) {
    if (!aiRuleDesc.trim()) return;
    setAiRuleLoading(true);
    try {
      const availableFields = schemaFields.map(f => f.key);
      const res: any = await api.post("/ai/generate-rule", { description: aiRuleDesc, availableFields });
      await updateRule(stepId, ruleId, { condition: res.expression });
      const ref = ruleInputRefs[ruleId];
      if (ref) ref.value = res.expression;
      toast.success("Rule generated!");
      setAiRuleTarget(null);
      setAiRuleDesc("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiRuleLoading(false);
    }
  }

  async function loadWorkflow() {
    if (!id) return;
    try {
      const wf: any = await api.get(`/workflows/${id}`);
      setWorkflow(wf);
      setWfName(wf.name);
      setWfDesc(wf.description || "");
      setWfStatus(wf.status);
      setSteps(wf.steps || []);

      const schema = wf.inputSchema || {};
      setSchemaFields(Object.entries(schema).map(([key, def]: [string, any]) => ({
        key,
        type: def.type || "string",
        required: def.required || false,
      })));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWorkflow(); }, [id]);

  async function saveWorkflow() {
    setSaving(true);
    try {
      const inputSchema = schemaFields.reduce((acc, f) => {
        if (f.key.trim()) acc[f.key.trim()] = { type: f.type, required: f.required };
        return acc;
      }, {} as Record<string, any>);

      await api.put(`/workflows/${id}`, {
        name: wfName,
        description: wfDesc,
        status: wfStatus,
        startStepId: steps[0]?.id || null,
        inputSchema,
      });
      toast.success("Workflow saved!");
      setEditingName(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addStep() {
    if (!newStep.name.trim()) { toast.error("Step name is required"); return; }
    try {
      const step: any = await api.post(`/workflows/${id}/steps`, {
        name: newStep.name,
        stepType: newStep.stepType,
        order: steps.length + 1,
        metadata: {},
      });
      setSteps(prev => [...prev, { ...step, rules: [] }]);
      setNewStep({ name: "", stepType: "approval" });
      setAddingStep(false);
      setExpandedStep(step.id);
      toast.success("Step added");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteStep(stepId: string) {
    if (!confirm("Delete this step and all its rules?")) return;
    setDeletingStepId(stepId);
    try {
      await api.del(`/steps/${stepId}`);
      setSteps(prev => prev.filter(s => s.id !== stepId));
      toast.success("Step deleted");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingStepId(null);
    }
  }

  async function updateStepMeta(stepId: string, updates: any) {
    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) return;
      const updated: any = await api.put(`/steps/${stepId}`, {
        name: updates.name ?? step.name,
        stepType: updates.stepType ?? step.stepType,
        metadata: updates.metadata ?? step.metadata,
        order: step.order,
      });
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updated, rules: s.rules } : s));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function addRule(stepId: string) {
    try {
      const step = steps.find(s => s.id === stepId);
      const existingRules = step?.rules || [];
      const rule: any = await api.post(`/steps/${stepId}/rules`, {
        condition: "DEFAULT",
        nextStepId: null,
        priority: existingRules.length + 1,
      });
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, rules: [...(s.rules || []), rule] } : s));
      toast.success("Rule added");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function updateRule(stepId: string, ruleId: string, updates: any) {
    try {
      const step = steps.find(s => s.id === stepId);
      const rule = step?.rules?.find((r: any) => r.id === ruleId);
      await api.put(`/rules/${ruleId}`, {
        condition: updates.condition ?? rule?.condition,
        nextStepId: updates.nextStepId ?? rule?.nextStepId,
        priority: updates.priority ?? rule?.priority,
      });
      setSteps(prev => prev.map(s =>
        s.id === stepId ? {
          ...s,
          rules: s.rules.map((r: any) => r.id === ruleId ? { ...r, ...updates } : r)
        } : s
      ));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteRule(stepId: string, ruleId: string) {
    try {
      await api.del(`/rules/${ruleId}`);
      setSteps(prev => prev.map(s =>
        s.id === stepId ? { ...s, rules: s.rules.filter((r: any) => r.id !== ruleId) } : s
      ));
      toast.success("Rule deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const colorMap: Record<string, string> = {
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <AppLayout
      title={editingName ? "" : wfName || "Workflow Editor"}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={wfStatus}
            onChange={e => setWfStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          {wfStatus === "active" && (
            <Link href={`/workflows/${id}/execute`}>
              <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm">
                <Play className="w-4 h-4" /> Run
              </button>
            </Link>
          )}
        </div>
      }
    >
      <div className="mb-4">
        <Link href="/workflows">
          <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Workflows
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Steps */}
          <div className="xl:col-span-2 space-y-4">
            {/* Workflow metadata */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700">Workflow Settings</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input
                    value={wfName}
                    onChange={e => setWfName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <textarea
                    value={wfDesc}
                    onChange={e => setWfDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Input Schema Editor */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => setShowSchemaEditor(!showSchemaEditor)}
                className="w-full flex items-center justify-between p-5"
              >
                <div className="flex items-center gap-3">
                  <GitBranch className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700">Input Schema ({schemaFields.length} fields)</span>
                </div>
                {showSchemaEditor ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <AnimatePresence>
                {showSchemaEditor && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-2">
                      {schemaFields.map((field, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={field.key}
                            onChange={e => {
                              const updated = [...schemaFields];
                              updated[i] = { ...field, key: e.target.value };
                              setSchemaFields(updated);
                            }}
                            placeholder="field_name"
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                          <select
                            value={field.type}
                            onChange={e => {
                              const updated = [...schemaFields];
                              updated[i] = { ...field, type: e.target.value };
                              setSchemaFields(updated);
                            }}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                          >
                            <option value="string">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => {
                                const updated = [...schemaFields];
                                updated[i] = { ...field, required: e.target.checked };
                                setSchemaFields(updated);
                              }}
                              className="accent-sky-500"
                            /> Req
                          </label>
                          <button onClick={() => setSchemaFields(prev => prev.filter((_, j) => j !== i))}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setSchemaFields(prev => [...prev, { key: "", type: "string", required: false }])}
                        className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 pt-1"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Field
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Play className="w-4 h-4 text-slate-400" />
                  Steps ({steps.length})
                </h3>
                <button
                  onClick={() => setAddingStep(true)}
                  className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>

              {steps.length === 0 && !addingStep && (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <GitBranch className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-medium">No steps yet</p>
                  <p className="text-sm mt-1">Add your first step to define the workflow</p>
                  <button onClick={() => setAddingStep(true)} className="mt-4 px-4 py-2 bg-sky-500 text-white text-sm rounded-xl hover:bg-sky-600 transition">
                    Add First Step
                  </button>
                </div>
              )}

              {steps.map((step, idx) => {
                const color = STEP_TYPE_COLORS[step.stepType] || "sky";
                const colorClass = colorMap[color] || colorMap["sky"];
                const isExpanded = expandedStep === step.id;
                return (
                  <motion.div
                    key={step.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-xs font-bold w-5 text-center text-slate-400">{idx + 1}</span>
                      </div>
                      <div className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${colorClass}`}>
                        {STEP_TYPE_LABELS[step.stepType] || step.stepType}
                      </div>
                      <span className="font-medium text-slate-800 flex-1 truncate">{step.name}</span>
                      <span className="text-xs text-slate-400">{step.rules?.length || 0} rules</span>
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteStep(step.id)}
                        disabled={deletingStepId === step.id}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"
                      >
                        {deletingStepId === step.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4">
                            {/* Step settings */}
                            <div className="grid grid-cols-2 gap-3 pt-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Step Name</label>
                                <input
                                  defaultValue={step.name}
                                  onBlur={e => updateStepMeta(step.id, { name: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Step Type</label>
                                <select
                                  value={step.stepType}
                                  onChange={e => {
                                    setSteps(prev => prev.map(s => s.id === step.id ? { ...s, stepType: e.target.value } : s));
                                    updateStepMeta(step.id, { stepType: e.target.value });
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                >
                                  {STEP_TYPES.map(t => <option key={t} value={t}>{STEP_TYPE_LABELS[t]}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* Metadata by type */}
                            {step.stepType === "approval" && (
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Assignee Email</label>
                                <input
                                  defaultValue={step.metadata?.assignee_email || ""}
                                  onBlur={e => updateStepMeta(step.id, { metadata: { ...step.metadata, assignee_email: e.target.value } })}
                                  placeholder="approver@company.com"
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                              </div>
                            )}
                            {step.stepType === "notification" && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Channel</label>
                                  <select
                                    defaultValue={step.metadata?.notification_channel || "email"}
                                    onBlur={e => updateStepMeta(step.id, { metadata: { ...step.metadata, notification_channel: e.target.value } })}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                  >
                                    <option value="email">Email</option>
                                    <option value="slack">Slack</option>
                                    <option value="webhook">Webhook</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Template</label>
                                  <input
                                    defaultValue={step.metadata?.template || ""}
                                    onBlur={e => updateStepMeta(step.id, { metadata: { ...step.metadata, template: e.target.value } })}
                                    placeholder="Message template..."
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                  />
                                </div>
                              </div>
                            )}
                            {step.stepType === "api_call" && (
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Method</label>
                                  <select
                                    defaultValue={step.metadata?.method || "GET"}
                                    onBlur={e => updateStepMeta(step.id, { metadata: { ...step.metadata, method: e.target.value } })}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                  >
                                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => <option key={m}>{m}</option>)}
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-slate-500 mb-1">URL</label>
                                  <input
                                    defaultValue={step.metadata?.url || ""}
                                    onBlur={e => updateStepMeta(step.id, { metadata: { ...step.metadata, url: e.target.value } })}
                                    placeholder="https://api.example.com/endpoint"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Rules */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Routing Rules</label>
                                <button onClick={() => addRule(step.id)} className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium">
                                  <Plus className="w-3 h-3" /> Add Rule
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(step.rules || []).map((rule: any) => (
                                  <div key={rule.id} className="space-y-1.5">
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                                      <span className="text-xs text-slate-400 w-8 text-center flex-shrink-0">if</span>
                                      <input
                                        ref={el => { ruleInputRefs[rule.id] = el; }}
                                        defaultValue={rule.condition}
                                        onBlur={e => updateRule(step.id, rule.id, { condition: e.target.value })}
                                        placeholder="e.g. amount > 1000 OR DEFAULT"
                                        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
                                      />
                                      <button
                                        onClick={() => {
                                          if (aiRuleTarget?.ruleId === rule.id) {
                                            setAiRuleTarget(null);
                                            setAiRuleDesc("");
                                          } else {
                                            setAiRuleTarget({ stepId: step.id, ruleId: rule.id });
                                            setAiRuleDesc("");
                                          }
                                        }}
                                        title="Generate with AI"
                                        className={`p-1.5 rounded-lg transition flex-shrink-0 ${aiRuleTarget?.ruleId === rule.id ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-violet-50 hover:text-violet-500"}`}
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </button>
                                      <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                      <select
                                        value={rule.nextStepId || ""}
                                        onChange={e => updateRule(step.id, rule.id, { nextStepId: e.target.value || null })}
                                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 max-w-28"
                                      >
                                        <option value="">End workflow</option>
                                        {steps.filter(s => s.id !== step.id).map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                      </select>
                                      <button onClick={() => deleteRule(step.id, rule.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {/* AI rule prompt */}
                                    <AnimatePresence>
                                      {aiRuleTarget?.ruleId === rule.id && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl p-2.5">
                                            <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                                            <input
                                              autoFocus
                                              value={aiRuleDesc}
                                              onChange={e => setAiRuleDesc(e.target.value)}
                                              onKeyDown={e => { if (e.key === "Enter") generateAiRule(step.id, rule.id); if (e.key === "Escape") { setAiRuleTarget(null); setAiRuleDesc(""); } }}
                                              placeholder="Describe the condition, e.g. 'if amount is over 1000 and country is US'"
                                              className="flex-1 px-2 py-1 text-xs border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                            />
                                            <button
                                              onClick={() => generateAiRule(step.id, rule.id)}
                                              disabled={!aiRuleDesc.trim() || aiRuleLoading}
                                              className="px-3 py-1 bg-violet-500 text-white text-xs rounded-lg hover:bg-violet-600 disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0 transition"
                                            >
                                              {aiRuleLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                              Generate
                                            </button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                                {(step.rules || []).length === 0 && (
                                  <p className="text-xs text-slate-400 italic text-center py-2">No rules — workflow ends after this step</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Add step form */}
              <AnimatePresence>
                {addingStep && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="bg-sky-50 border border-sky-200 rounded-2xl p-4"
                  >
                    <h4 className="text-sm font-medium text-slate-700 mb-3">New Step</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        value={newStep.name}
                        onChange={e => setNewStep(p => ({ ...p, name: e.target.value }))}
                        placeholder="Step name..."
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") addStep(); if (e.key === "Escape") setAddingStep(false); }}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                      <select
                        value={newStep.stepType}
                        onChange={e => setNewStep(p => ({ ...p, stepType: e.target.value }))}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        {STEP_TYPES.map(t => <option key={t} value={t}>{STEP_TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addStep} className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white text-sm rounded-xl hover:bg-sky-600 transition">
                        <Check className="w-4 h-4" /> Add
                      </button>
                      <button onClick={() => setAddingStep(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Visual flow */}
          <div className="hidden xl:block">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />
                Flow Preview
              </h3>
              {steps.length === 0 ? (
                <div className="text-center py-8 text-slate-300">
                  <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Add steps to see flow</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, i) => {
                    const color = STEP_TYPE_COLORS[step.stepType] || "sky";
                    const colorClass = colorMap[color] || colorMap["sky"];
                    return (
                      <React.Fragment key={step.id}>
                        <div className={`rounded-xl border p-3 cursor-pointer transition-all ${colorClass} ${expandedStep === step.id ? "ring-2 ring-offset-1 ring-sky-400" : ""}`}
                          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}>
                          <p className="text-xs font-semibold">{i + 1}. {step.name}</p>
                          <p className="text-xs opacity-60 mt-0.5 capitalize">{step.stepType}</p>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex justify-center">
                            <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                  <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center mt-2">
                    <p className="text-xs text-slate-400">End</p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</p>
                <select
                  value={wfStatus}
                  onChange={e => setWfStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button onClick={saveWorkflow} disabled={saving} className="w-full mt-2 py-2 bg-sky-500 text-white text-sm font-medium rounded-xl hover:bg-sky-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
