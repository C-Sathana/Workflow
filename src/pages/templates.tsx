import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Library, ArrowRight, CheckCircle2, Filter } from "lucide-react";

const CATEGORIES = ["All", "Finance", "HR", "IT", "Operations", "General"];

export default function TemplatesPage() {
  const [, setLocation] = useLocation();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<any[]>("/templates")
      .then(data => setTemplates(data || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleImport(template: any) {
    if (!confirm(`Import template "${template.name}"? A new workflow will be created.`)) return;
    setImportingId(template.id);
    try {
      const wf: any = await api.post(`/templates/${template.id}/import`, {});
      setImportedIds(prev => new Set([...prev, template.id]));
      toast.success(`"${template.name}" imported successfully!`, {
        action: {
          label: "Edit Workflow",
          onClick: () => setLocation(`/workflows/${wf.id}/edit`),
        }
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImportingId(null);
    }
  }

  const filtered = category === "All" ? templates : templates.filter(t => t.category === category);

  return (
    <AppLayout title="Templates">
      <div className="mb-6">
        <p className="text-slate-500 text-sm">Start from pre-built workflow templates. Import and customize to fit your needs.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${category === c ? "bg-sky-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Library className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-lg font-medium">No templates in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {template.icon || "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{template.name}</h3>
                  <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-lg font-medium">{template.category}</span>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-slate-500 mb-3 flex-1 line-clamp-2">{template.description}</p>
              )}

              <div className="mb-4">
                <p className="text-xs font-medium text-slate-400 mb-1.5">Steps included:</p>
                <div className="flex flex-wrap gap-1">
                  {(template.stepsConfig || []).slice(0, 4).map((step: any, idx: number) => (
                    <span key={idx} className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg">{step.name}</span>
                  ))}
                  {(template.stepsConfig || []).length > 4 && (
                    <span className="text-xs text-slate-400">+{template.stepsConfig.length - 4} more</span>
                  )}
                </div>
              </div>

              {template.inputSchema && Object.keys(template.inputSchema).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-400 mb-1.5">Input fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(template.inputSchema).slice(0, 5).map(key => (
                      <span key={key} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">{key.replace(/_/g, " ")}</span>
                    ))}
                    {Object.keys(template.inputSchema).length > 5 && (
                      <span className="text-xs text-slate-400">+{Object.keys(template.inputSchema).length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleImport(template)}
                disabled={importingId === template.id}
                className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition ${
                  importedIds.has(template.id)
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 shadow-sm"
                } disabled:opacity-60`}
              >
                {importingId === template.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : importedIds.has(template.id) ? (
                  <><CheckCircle2 className="w-4 h-4" /> Imported</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Import Template</>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
