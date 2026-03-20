import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Workflow, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
          <Workflow className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
        <p className="text-xl font-semibold text-slate-700 mb-2">Page not found</p>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/dashboard">
          <button className="flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-xl hover:bg-sky-600 transition mx-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
