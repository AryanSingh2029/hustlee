"use client";
import { supabase } from "../../lib/supabaseClient";
import { motion, useReducedMotion } from "framer-motion";
import { useState, type FormEvent } from "react";

// --- Inline Aurora Background ---
function AuthAurora() {
  const prefersReduced = useReducedMotion();
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-indigo-600 via-fuchsia-500 to-cyan-400"
        animate={prefersReduced ? {} : { y: [0, -18, 0], x: [0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-300"
        animate={prefersReduced ? {} : { y: [0, 16, 0], x: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

// --- Inline Card ---
function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-xl"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-white/70">{subtitle}</p> : null}
      </div>
      {children}
    </motion.div>
  );
}

// --- Inline Input ---
function AuthInput({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-white/80">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/70"
      />
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

// --- Signup Preview Page ---
export default function SignupPreview() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string; agree?: string }>({});

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate() {
    const next: typeof errors = {};
    if (!name) next.name = "Name is required";
    if (!email) next.email = "Email is required";
    else if (!isEmail(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    else if (password.length < 8) next.password = "Must be at least 8 characters";
    if (confirm !== password) next.confirm = "Passwords do not match";
    if (!agree) next.agree = "Please accept the Terms";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
  e.preventDefault();
  if (!validate()) return;

  try {
    // Step 1: Supabase Auth Signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: name }, // optional, attaches metadata
      },
    });

    if (error) {
      console.error(error.message);
      setErrors({ email: error.message });
      return;
    }

    // Step 2: Save profile info in "profiles" table
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username: name,
        email: email,
      });
    }

    // Step 3: Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (err: any) {
    console.error("Unexpected error:", err.message);
    setErrors({ email: "Something went wrong. Please try again." });
  }
}


  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-16 bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(900px_500px_at_110%_10%,rgba(236,72,153,0.14),transparent),linear-gradient(180deg,#0a0b12,40%,#0e0f16)] text-gray-100">
      <AuthAurora />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
        <a href="/" className="hover:text-white">← Back to Hustle</a>
      </div>

      <AuthCard title="Create your account" subtitle="Join Hustle and make the next 21 days count">
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthInput id="name" label="Name" value={name} onChange={setName} placeholder="Your name" error={errors.name} />
          <AuthInput id="email" label="Email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-white/80">Password</label>
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-xs text-white/70 hover:text-white">
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? "text" : "password"}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/70"
              />
              {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm" className="text-sm text-white/80">Confirm password</label>
              <input
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type={showPwd ? "text" : "password"}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/70"
              />
              {errors.confirm && <p className="mt-1 text-xs text-rose-400">{errors.confirm}</p>}
            </div>
          </div>

          <label className="mt-1 inline-flex items-center gap-2 text-sm select-none">
            <input checked={agree} onChange={(e) => setAgree(e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-white/20" />
            I agree to the <a className="underline hover:no-underline" href="#">Terms</a> and <a className="underline hover:no-underline" href="#">Privacy</a>
          </label>
          {errors.agree && <p className="-mt-1 text-xs text-rose-400">{errors.agree}</p>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            type="submit"
            className="w-full rounded-xl px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)]"
          >
            Create account
          </motion.button>

          <div className="text-xs text-white/60 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-white hover:underline">Log in</a>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
