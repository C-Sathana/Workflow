import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Play, CheckCircle2, XCircle, Clock, AlertCircle, Filter,
  ChevronRight, RefreshCw, Loader2, RotateCcw
} from "lucide-react";

const STATUSES = ["all", "running", "completed", "failed", "waiting_approval", "cancelled"];

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      const res: any = await api.get(`/executions?${params}`);
      setExecutions(res.executions || res || []);
      setTotal(res.total || (res.executions?.length) || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, page]);

  return (
    <AppLayout
      title="Executions"
      actions={
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${status === s ? "bg-sky-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : executions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Play className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-lg font-medium">No executions found</p>
          <p className="text-sm mt-1">Run a workflow to see its executions here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Workflow</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Started</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Last Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {executions.map((exec: any, i) => (
                <motion.tr
                  key={exec.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50 transition"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{exec.workflowName || "Execution"}</p>
                    <p className="text-xs text-slate-400 font-mono">{exec.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg w-fit capitalize ${statusBadge(exec.status)}`}>
                      <StatusDot status={exec.status} />
                      {exec.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-500">
                    {format(new Date(exec.createdAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                    {format(new Date(exec.updatedAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/executions/${exec.id}`}>
                      <button className="text-sky-500 hover:text-sky-700 transition">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Showing {executions.length} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={executions.length < 20} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-500", running: "bg-blue-500", failed: "bg-red-500",
    pending: "bg-amber-500", waiting_approval: "bg-violet-500", cancelled: "bg-slate-400"
  };
  const isRunning = status === "running";
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status] || "bg-slate-400"} ${isRunning ? "animate-pulse" : ""}`} />
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    running: "bg-blue-50 text-blue-700",
    failed: "bg-red-50 text-red-700",
    pending: "bg-amber-50 text-amber-700",
    waiting_approval: "bg-violet-50 text-violet-700",
    cancelled: "bg-slate-100 text-slate-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}
