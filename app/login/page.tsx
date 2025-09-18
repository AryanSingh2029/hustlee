"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { AuthAurora, AuthCard, AuthInput, validateEmail } from "../../components/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!email) next.email = "Email is required";
    else if (!validateEmail(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrors({ password: error.message });
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-16 bg-[linear-gradient(180deg,#0a0b12,40%,#0e0f16)] text-gray-100">
      <AuthAurora />
      <AuthCard title="Welcome back" subtitle="Log in to continue your hustle">
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthInput id="email" label="Email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
          <div>
            <label className="text-sm text-white/80">Password</label>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm"
            />
            {errors.password && <p className="text-xs text-rose-400">{errors.password}</p>}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} type="submit" className="w-full rounded-xl px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white">
            Log in
          </motion.button>
        </form>
      </AuthCard>
    </div>
  );
}
