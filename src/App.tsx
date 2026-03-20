import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import WorkflowsPage from "@/pages/workflows";
import WorkflowEditorPage from "@/pages/workflow-editor";
import ExecutePage from "@/pages/execute";
import ExecutionDetailPage from "@/pages/execution-detail";
import ExecutionsListPage from "@/pages/executions-list";
import ApprovalsPage from "@/pages/approvals";
import TemplatesPage from "@/pages/templates";
import KanbanPage from "@/pages/kanban";
import AuditPage from "@/pages/audit";
import NotFoundPage from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

const P = (Component: React.ComponentType) => () => <ProtectedRoute><Component /></ProtectedRoute>;

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={P(DashboardPage)} />
      <Route path="/dashboard" component={P(DashboardPage)} />
      <Route path="/workflows" component={P(WorkflowsPage)} />
      <Route path="/workflows/new" component={P(WorkflowEditorPage)} />
      <Route path="/workflows/:id/edit" component={P(WorkflowEditorPage)} />
      <Route path="/workflows/:id/execute" component={P(ExecutePage)} />
      <Route path="/executions" component={P(ExecutionsListPage)} />
      <Route path="/executions/:id" component={P(ExecutionDetailPage)} />
      <Route path="/approvals" component={P(ApprovalsPage)} />
      <Route path="/templates" component={P(TemplatesPage)} />
      <Route path="/kanban" component={P(KanbanPage)} />
      <Route path="/audit" component={P(AuditPage)} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <AppRoutes />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
