import React from 'react';
import { ExecutionStatus } from '@workspace/api-client-react';

export function StatusBadge({ status, pulse = false }: { status: string, pulse?: boolean }) {
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  let pulseColor = "bg-slate-400";
  
  switch(status.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'success':
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      pulseColor = "bg-emerald-500";
      break;
    case 'failed':
    case 'rejected':
    case 'error':
      colorClass = "bg-rose-50 text-rose-700 border-rose-200";
      pulseColor = "bg-rose-500";
      break;
    case 'in_progress':
    case 'running':
    case 'active':
      colorClass = "bg-sky-50 text-sky-700 border-sky-200";
      pulseColor = "bg-sky-500";
      break;
    case 'canceled':
    case 'archived':
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      pulseColor = "bg-amber-500";
      break;
    case 'pending':
    case 'draft':
      colorClass = "bg-slate-100 text-slate-600 border-slate-200";
      pulseColor = "bg-slate-400";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {pulse && (status === 'in_progress' || status === 'running') && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`}></span>
        </span>
      )}
      {!pulse && <span className={`w-1.5 h-1.5 rounded-full ${pulseColor}`} />}
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}
