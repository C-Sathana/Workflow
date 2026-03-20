import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Workflow, Play, CheckSquare, BarChart3,
  FileText, Kanban, Library, LogOut, ChevronLeft, ChevronRight,
  User, Bell, Settings, Menu, X
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Workflows", icon: Workflow, path: "/workflows" },
  { label: "Templates", icon: Library, path: "/templates" },
  { label: "Executions", icon: Play, path: "/executions" },
  { label: "Approvals", icon: CheckSquare, path: "/approvals" },
  { label: "Kanban", icon: Kanban, path: "/kanban" },
  { label: "Audit Log", icon: FileText, path: "/audit" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  function isActive(path: string) {
    const full = `${base}${path}`;
    return location === full || location === path;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
        className={`
          hidden lg:flex flex-col bg-white border-r border-slate-200 shadow-sm overflow-hidden z-20
        `}
      >
        <SidebarContent collapsed={collapsed} isActive={isActive} logout={logout} user={user} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-6 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow hover:bg-slate-50 z-30"
          style={{ left: collapsed ? 60 : 228 }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronLeft className="w-3 h-3 text-slate-500" />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 shadow-xl z-40 flex flex-col lg:hidden"
          >
            <SidebarContent collapsed={false} isActive={isActive} logout={logout} user={user} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.email?.split("@")[0]}</span>
              <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-medium capitalize">{user?.role}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ collapsed, isActive, logout, user }: any) {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  return (
    <>
      <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-100 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Workflow className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-slate-900 truncate">FlowForge</span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                  ${active
                    ? "bg-sky-50 text-sky-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-sky-600" : ""}`} />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                {!collapsed && active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-sky-500 rounded-full" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 border-t border-slate-100 pt-2">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );
}
