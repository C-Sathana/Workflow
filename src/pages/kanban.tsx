import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { RefreshCw, Clock, CheckCircle2, XCircle, Play, AlertCircle, ChevronRight } from "lucide-react";

const COLUMNS = [
  { key: "pending", label: "Pending", color: "amber", icon: Clock },
  { key: "running", label: "In Progress", color: "blue", icon: Play },
  { key: "waiting_approval", label: "Awaiting Approval", color: "violet", icon: AlertCircle },
  { key: "completed", label: "Completed", color: "green", icon: CheckCircle2 },
  { key: "failed", label: "Failed", color: "red", icon: XCircle },
];

const COLUMN_STYLES: Record<string, string> = {
  amber: "bg-amber-50 border-amber-200",
  blue: "bg-blue-50 border-blue-200",
  violet: "bg-violet-50 border-violet-200",
  green: "bg-green-50 border-green-200",
  red: "bg-red-50 border-red-200",
};
const HEADER_STYLES: Record<string, string> = {
  amber: "text-amber-700 bg-amber-100",
  blue: "text-blue-700 bg-blue-100",
  violet: "text-violet-700 bg-violet-100",
  green: "text-green-700 bg-green-100",
  red: "text-red-700 bg-red-100",
};
const CARD_BADGE_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  running: "bg-blue-50 text-blue-700",
  waiting_approval: "bg-violet-50 text-violet-700",
  completed: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function KanbanPage() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res: any = await api.get("/executions?limit=100");
      setExecutions(res.executions || res || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function getExecsByStatus(status: string) {
    return executions.filter(e => e.status === status);
  }

  return (
    <AppLayout
      title="Kanban Board"
      actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
          {COLUMNS.map(col => {
            const items = getExecsByStatus(col.key);
            return (
              <div key={col.key} className="flex-shrink-0 w-72">
                <div className={`rounded-2xl border ${COLUMN_STYLES[col.color]} flex flex-col h-full min-h-64`}>
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${HEADER_STYLES[col.color]}`}>
                    <div className="flex items-center gap-2">
                      <col.icon className="w-4 h-4" />
                      <span className="font-semibold text-sm">{col.label}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-white/60 rounded-lg">{items.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(70vh - 60px)" }}>
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                        <p className="text-sm">No items</p>
                      </div>
                    ) : (
                      items.map((exec, i) => (
                        <motion.div
                          key={exec.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Link href={`/executions/${exec.id}`}>
                            <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm font-semibold text-slate-800 line-clamp-2">{exec.workflowName || "Execution"}</p>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition flex-shrink-0 mt-0.5" />
                              </div>
                              <p className="text-xs text-slate-400 font-mono mb-2">{exec.id.slice(0, 8)}…</p>
                              {exec.inputData && Object.keys(exec.inputData).length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {Object.entries(exec.inputData).slice(0, 2).map(([k, v]) => (
                                    <span key={k} className="text-xs bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-md">
                                      {k}: {String(v).slice(0, 15)}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(exec.createdAt), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
