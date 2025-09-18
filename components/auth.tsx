"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthAurora() {
  const prefersReduced = useReducedMotion();
  return (
    <>
      <motion.div
        aria-hidden
        className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-indigo-600 via-fuchsia-500 to-cyan-400"
        animate={prefersReduced ? {} : { y: [0, -18, 0], x: [0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
    </>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-xl">
      <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

export function AuthInput({ id, label, value, placeholder, onChange, type = "text", error }: { id: string; placeholder?: string; label: string; value: string; onChange: (v: string) => void; type?: string; error?: string; }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-white/80">{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}  type={type} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm" />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
