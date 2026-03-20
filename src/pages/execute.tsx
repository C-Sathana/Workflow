import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { useRoute, useLocation, Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Play, ArrowLeft, ChevronRight, AlertCircle, Info } from "lucide-react";

export default function ExecutePage() {
  const [, params] = useRoute("/workflows/:id/execute");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dryRun, setDryRun] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<any>(`/workflows/${id}`)
      .then(wf => {
        setWorkflow(wf);
        const defaults: Record<string, any> = {};
        const schema = wf.inputSchema || {};
        Object.entries(schema).forEach(([key, def]: [string, any]) => {
          if (def.default !== undefined) defaults[key] = def.default;
          else if (def.type === "number") defaults[key] = 0;
          else if (def.type === "boolean") defaults[key] = false;
          else defaults[key] = "";
        });
        setFormData(defaults);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault();
    setExecuting(true);
    try {
      const res: any = await api.post(`/executions`, {
        workflowId: id,
        inputData: formData,
        dryRun,
      });
      if (dryRun) {
        toast.success("Dry run completed — no real actions were taken");
      } else {
        toast.success("Workflow execution started!");
        setLocation(`/executions/${res.id}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExecuting(false);
    }
  }

  const inputSchema = workflow?.inputSchema || {};
  const schemaEntries = Object.entries(inputSchema) as [string, any][];

  return (
    <AppLayout title={`Execute: ${workflow?.name || "Workflow"}`}>
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
      ) : !workflow ? (
        <div className="text-center text-slate-400 py-16">Workflow not found</div>
      ) : workflow.status !== "active" ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Workflow not active</p>
            <p className="text-sm text-amber-700 mt-1">This workflow is in "{workflow.status}" status. Activate it in the editor before executing.</p>
            <Link href={`/workflows/${id}/edit`}>
              <button className="mt-3 text-sm bg-amber-100 text-amber-800 px-4 py-2 rounded-xl hover:bg-amber-200 transition">
                Go to Editor
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{workflow.name}</h2>
                {workflow.description && <p className="text-sm text-slate-500 mt-0.5">{workflow.description}</p>}
                <p className="text-xs text-slate-400 mt-1">{workflow.steps?.length || 0} steps · v{workflow.version}</p>
              </div>
            </div>

            {/* Workflow steps preview */}
            {workflow.steps?.length > 0 && (
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Workflow Steps</p>
                <div className="flex items-center flex-wrap gap-2">
                  {workflow.steps.map((step: any, i: number) => (
                    <React.Fragment key={step.id}>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${stepTypeColor(step.stepType)}`}>
                        {step.name}
                      </span>
                      {i < workflow.steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleExecute} className="space-y-4">
              {schemaEntries.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-slate-500 text-sm">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  This workflow has no input parameters. Click Run to execute.
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Input Parameters</p>
                  {schemaEntries.map(([key, def]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                        {key.replace(/_/g, " ")}
                        {def.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {def.allowed_values ? (
                        <select
                          value={formData[key] || ""}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                          required={def.required}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm bg-white"
                        >
                          <option value="">Select {key.replace(/_/g, " ")}...</option>
                          {def.allowed_values.map((v: string) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : def.type === "boolean" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={key}
                            checked={!!formData[key]}
                            onChange={e => setFormData({ ...formData, [key]: e.target.checked })}
                            className="w-4 h-4 accent-sky-500"
                          />
                          <label htmlFor={key} className="text-sm text-slate-600">{def.description || key.replace(/_/g, " ")}</label>
                        </div>
                      ) : def.type === "number" ? (
                        <input
                          type="number"
                          value={formData[key] || ""}
                          onChange={e => setFormData({ ...formData, [key]: Number(e.target.value) })}
                          required={def.required}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[key] || ""}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                          required={def.required}
                          placeholder={def.placeholder || `Enter ${key.replace(/_/g, " ")}...`}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Dry run toggle */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-amber-800">Simulation Mode (Dry Run)</p>
                  <p className="text-xs text-amber-600">Preview execution path without performing real actions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDryRun(!dryRun)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${dryRun ? "bg-amber-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${dryRun ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={executing}
                className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  dryRun
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
                    : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sky-200"
                } shadow-lg disabled:opacity-60`}
              >
                {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                {dryRun ? "Run Simulation" : "Execute Workflow"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function stepTypeColor(type: string) {
  const m: Record<string, string> = {
    approval: "bg-violet-50 text-violet-700",
    notification: "bg-sky-50 text-sky-700",
    task: "bg-green-50 text-green-700",
    api_call: "bg-orange-50 text-orange-700",
  };
  return m[type] || "bg-slate-100 text-slate-600";
}
