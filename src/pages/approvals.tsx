import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import { api, Approval } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, MessageSquare, Inbox,
  Loader2, Clock, AlertCircle, ThumbsUp, ThumbsDown
} from "lucide-react";

const TABS = ["pending", "approved", "rejected"];

export default function ApprovalsPage() {
  const [tab, setTab] = useState("pending");
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res: any = await api.get(`/approvals?status=${tab}&limit=50`);
      setApprovals(res.approvals || res || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      await api.post(`/approvals/${id}/approve`, { comment });
      toast.success("Request approved successfully");
      setCommentId(null);
      setComment("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionId(id);
    try {
      await api.post(`/approvals/${id}/reject`, { comment });
      toast.success("Request rejected");
      setCommentId(null);
      setComment("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <AppLayout title="Approval Inbox">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Inbox className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-lg font-medium">No {tab} approvals</p>
          <p className="text-sm mt-1">
            {tab === "pending" ? "You're all caught up!" : `No ${tab} requests found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval: any, i) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    approval.status === "approved" ? "bg-green-50" : approval.status === "rejected" ? "bg-red-50" : "bg-amber-50"
                  }`}>
                    {approval.status === "approved" ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                     approval.status === "rejected" ? <XCircle className="w-5 h-5 text-red-600" /> :
                     <Clock className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">
                      {approval.stepName || "Approval Request"}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Workflow: <span className="font-medium text-slate-700">{approval.workflowName || approval.executionId?.slice(0, 8)}</span>
                    </p>
                    {approval.requestedBy && (
                      <p className="text-xs text-slate-400 mt-0.5">Requested by: {approval.requestedBy}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(approval.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {approval.comment && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                        {approval.comment}
                      </div>
                    )}
                  </div>
                </div>

                {approval.status === "pending" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {commentId === approval.id ? (
                      <div className="flex flex-col gap-2 w-56">
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(approval.id)}
                            disabled={actionId === approval.id}
                            className="flex-1 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            {actionId === approval.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(approval.id)}
                            disabled={actionId === approval.id}
                            className="flex-1 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            {actionId === approval.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3" />}
                            Reject
                          </button>
                          <button onClick={() => { setCommentId(null); setComment(""); }} className="py-1.5 px-2 border border-slate-200 text-slate-500 text-xs rounded-lg hover:bg-slate-50 transition">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setCommentId(approval.id); setComment(""); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-xl hover:bg-green-100 transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => { setCommentId(approval.id); setComment(""); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-xl hover:bg-red-100 transition"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
