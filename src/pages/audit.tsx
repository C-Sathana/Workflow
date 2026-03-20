import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FileText, RefreshCw, Download, Filter, Clock, User, Activity } from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const res: any = await api.get("/executions?limit=100");
      const execs = res.executions || res || [];
      const auditEntries = execs.flatMap((exec: any) =>
        (exec.logs || []).map((log: any) => ({
          ...log,
          executionId: exec.id,
          workflowName: exec.workflowName,
        }))
      );
      setLogs(auditEntries.sort((a: any, b: any) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function downloadCSV() {
    const headers = ["Timestamp", "Workflow", "Event", "Message", "Execution ID"];
    const rows = logs.map(l => [
      l.timestamp ? format(new Date(l.timestamp), "yyyy-MM-dd HH:mm:ss") : "",
      l.workflowName || "",
      l.type || l.event || "",
      l.message || "",
      l.executionId || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  }

  const EVENT_COLORS: Record<string, string> = {
    start: "bg-sky-100 text-sky-700",
    step_started: "bg-blue-100 text-blue-700",
    step_completed: "bg-green-100 text-green-700",
    complete: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
    approval: "bg-violet-100 text-violet-700",
    info: "bg-slate-100 text-slate-600",
  };

  return (
    <AppLayout
      title="Audit Log"
      actions={
        <div className="flex gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-xl hover:bg-slate-200 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <FileText className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-lg font-medium">No audit events yet</p>
          <p className="text-sm mt-1">Execute a workflow to generate audit logs</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">{logs.length} events</span>
          </div>
          <div className="divide-y divide-slate-50">
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className="flex-shrink-0 w-36 text-xs text-slate-400 pt-0.5">
                  {log.timestamp ? format(new Date(log.timestamp), "MMM d, h:mm:ss a") : "—"}
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${EVENT_COLORS[log.type || log.event] || "bg-slate-100 text-slate-500"}`}>
                    {(log.type || log.event || "info").replace("_", " ")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{log.message || "—"}</p>
                  {log.workflowName && <p className="text-xs text-slate-400 mt-0.5">Workflow: {log.workflowName}</p>}
                  {log.stepName && <p className="text-xs text-slate-400">Step: {log.stepName}</p>}
                </div>
                <div className="flex-shrink-0 text-xs text-slate-300 font-mono">{log.executionId?.slice(0, 8)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
