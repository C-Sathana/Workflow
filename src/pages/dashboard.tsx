import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Workflow, Play, CheckSquare, TrendingUp, Clock, AlertCircle,
  ArrowUpRight, CheckCircle2, XCircle, RotateCcw, ChevronRight
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  running: "#3b82f6",
  pending: "#f59e0b",
  failed: "#ef4444",
  cancelled: "#94a3b8",
  waiting_approval: "#8b5cf6",
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("/analytics/dashboard").then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCards = analytics ? [
    { label: "Total Workflows", value: analytics.totalWorkflows ?? 0, icon: Workflow, color: "sky", change: "+12%" },
    { label: "Total Executions", value: analytics.totalExecutions ?? 0, icon: Play, color: "indigo", change: "+8%" },
    { label: "Pending Approvals", value: analytics.pendingApprovals ?? 0, icon: CheckSquare, color: "amber", change: "-3%" },
    { label: "Success Rate", value: `${Math.round((analytics.successRate ?? 0) * 100)}%`, icon: TrendingUp, color: "green", change: "+2%" },
  ] : [];

  const statusData = analytics?.executionsByStatus
    ? Object.entries(analytics.executionsByStatus).map(([name, value]) => ({ name, value }))
    : [];

  const execTrend = analytics?.recentExecutions?.slice(0, 7).map((e: any, i: number) => ({
    day: `Day ${i + 1}`,
    executions: 1,
  })) || [];

  const colorMap: Record<string, string> = { sky: "from-sky-400 to-sky-600", indigo: "from-indigo-400 to-indigo-600", amber: "from-amber-400 to-amber-600", green: "from-green-400 to-green-600" };

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${colorMap[card.color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
                <span className={`ml-auto text-xs font-medium ${card.change.startsWith("+") ? "text-green-600" : "text-red-500"}`}>
                  {card.change}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Execution trend */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Execution Trends</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={execTrend}>
                  <defs>
                    <linearGradient id="exec-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="executions" stroke="#38bdf8" fill="url(#exec-grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Execution Status</h3>
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {statusData.map((entry: any, i: number) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, name: any) => [v, name]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {statusData.map((d: any) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name] || "#94a3b8" }} />
                        <span className="text-xs text-slate-600 capitalize">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <Play className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No executions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Executions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Recent Executions</h3>
              <Link href="/executions">
                <span className="text-sm text-sky-600 hover:underline flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></span>
              </Link>
            </div>
            {analytics?.recentExecutions?.length > 0 ? (
              <div className="space-y-2">
                {analytics.recentExecutions.slice(0, 5).map((exec: any) => (
                  <Link key={exec.id} href={`/executions/${exec.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition">
                      <StatusIcon status={exec.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{exec.workflowName || "Execution"}</p>
                        <p className="text-xs text-slate-400">{new Date(exec.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium capitalize ${statusBadge(exec.status)}`}>{exec.status?.replace("_", " ")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No executions yet. <Link href="/workflows"><span className="text-sky-500 hover:underline">Create a workflow</span></Link> to get started.</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/workflows">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow">
                <Workflow className="w-6 h-6 mb-3 opacity-80" />
                <p className="font-semibold">Manage Workflows</p>
                <p className="text-xs opacity-70 mt-1">Create, edit and publish workflows</p>
              </div>
            </Link>
            <Link href="/approvals">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow">
                <CheckSquare className="w-6 h-6 mb-3 opacity-80" />
                <p className="font-semibold">Approval Inbox</p>
                <p className="text-xs opacity-70 mt-1">
                  {analytics?.pendingApprovals > 0 ? `${analytics.pendingApprovals} items awaiting review` : "No pending approvals"}
                </p>
              </div>
            </Link>
            <Link href="/templates">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow">
                <ArrowUpRight className="w-6 h-6 mb-3 opacity-80" />
                <p className="font-semibold">Browse Templates</p>
                <p className="text-xs opacity-70 mt-1">Start from pre-built workflow templates</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
  if (status === "failed") return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
  if (status === "running") return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />;
  return <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />;
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
