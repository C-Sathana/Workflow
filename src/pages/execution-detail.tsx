import React, { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { useRoute, Link } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeft,
  RefreshCw, StopCircle, Loader2, Play, ChevronRight
} from "lucide-react";

export default function ExecutionDetailPage() {
  const [, params] = useRoute("/executions/:id");
  const id = params?.id;
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef<any>(null);

  async function load() {
    try {
      const res: any = await api.get(`/executions/${id}`);
      setExecution(res);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    load();
    intervalRef.current = setInterval(() => {
      if (["running", "pending", "waiting_approval"].includes(execution?.status)) {
        load();
      }
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  useEffect(() => {
    if (execution && !["running", "pending", "waiting_approval"].includes(execution.status)) {
      clearInterval(intervalRef.current);
    }
  }, [execution?.status]);

  async function handleCancel() {
    if (!confirm("Cancel this execution?")) return;
    setCancelling(true);
    try {
      await api.post(`/executions/${id}/cancel`, {});
      toast.success("Execution cancelled");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  }

  const logs: any[] = execution?.logs || [];

  return (
    <AppLayout
      title="Execution Detail"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          {execution && ["running", "waiting_approval"].includes(execution.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-xl hover:bg-red-100 transition"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
              Cancel
            </button>
          )}
        </div>
      }
    >
      <div className="mb-4">
        <Link href="/executions">
          <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Executions
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !execution ? (
        <div className="text-center text-slate-400 py-16">Execution not found</div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <StatusIcon status={execution.status} />
                  <span className={`text-sm font-medium px-3 py-1 rounded-xl capitalize ${statusBadge(execution.status)}`}>
                    {execution.status?.replace("_", " ")}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">{execution.workflowName || "Execution"}</h2>
                <p className="text-sm text-slate-400 font-mono mt-1">{execution.id}</p>
              </div>
              <div className="text-right text-sm text-slate-500 space-y-1">
                <p>Started: <span className="text-slate-700 font-medium">{format(new Date(execution.createdAt), "MMM d, yyyy h:mm a")}</span></p>
                <p>Updated: <span className="text-slate-700 font-medium">{format(new Date(execution.updatedAt), "MMM d, yyyy h:mm a")}</span></p>
              </div>
            </div>

            {execution.inputData && Object.keys(execution.inputData).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Input Data</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(execution.inputData).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 capitalize">{k.replace("_", " ")}</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Execution Log Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Execution Timeline</h3>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No log entries yet</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log: any, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <LogDot type={log.type} />
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2" />}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{log.message || log.event || "Step"}</p>
                        {log.timestamp && (
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {format(new Date(log.timestamp), "h:mm:ss a")}
                          </span>
                        )}
                      </div>
                      {log.stepName && <p className="text-xs text-slate-500 mt-0.5">Step: {log.stepName}</p>}
                      {log.details && (
                        <pre className="mt-2 text-xs bg-slate-50 rounded-lg p-2 text-slate-600 overflow-x-auto">
                          {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                ))}
                {["running", "waiting_approval"].includes(execution.status) && (
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Approvals for this execution */}
          {execution.status === "waiting_approval" && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="font-semibold text-violet-800">Awaiting Approval</p>
                  <p className="text-sm text-violet-600 mt-0.5">
                    This execution is paused, waiting for an approver. <Link href="/approvals"><span className="underline cursor-pointer">Go to Approvals</span></Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
  if (status === "failed") return <XCircle className="w-6 h-6 text-red-500" />;
  if (status === "running") return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
  return <Clock className="w-6 h-6 text-amber-500" />;
}

function LogDot({ type }: { type: string }) {
  const colors: Record<string, string> = {
    start: "bg-sky-500", complete: "bg-green-500", error: "bg-red-500",
    approval: "bg-violet-500", info: "bg-slate-400", step_started: "bg-blue-400",
    step_completed: "bg-green-400",
  };
  return <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${colors[type] || "bg-slate-300"}`} />;
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
