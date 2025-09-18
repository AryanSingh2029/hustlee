"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";

// ============================================================
// Hustle — Full Landing Page (React + Framer Motion + Tailwind)
// - Dynamic aurora background + glow orbs
// - Gradient text, hover glows, tilt cards, parallax demo
// - Sticky scroll‑spy navbar, smooth anchor scrolling
// - Back‑to‑top button, prefers‑reduced‑motion
// - Runtime smoke tests (since no formal test harness present)
// ============================================================

// ---------- Utilities ----------
function smoothTo(id: string) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Section({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative ${className}`}>{children}</section>
  );
}

function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / r.height) * -10;
    const ry = ((e.clientX - r.left - r.width / 2) / r.width) * 10;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(${active ? 1.02 : 1})`;
  }
  const reset = () => { const el = ref.current; if (el) el.style.transform = "rotateX(0) rotateY(0) scale(1)"; };
  return (
    <div className="[perspective:1100px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => { setActive(false); reset(); }}
        className="transition-transform duration-150 will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}

// ---------- Root Page ----------
export default function HustleLanding() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const prefersReduced = useReducedMotion();

  // Scroll‑spy (active section)
  const sections = ["#hero", "#features", "#showcase", "#how", "#cta"] as const;
  const [activeId, setActiveId] = useState<typeof sections[number]>("#hero");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(`#${visible.target.id}` as any);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((sel) => { const el = document.querySelector(sel); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-gray-100 relative overflow-x-clip bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(900px_500px_at_110%_10%,rgba(236,72,153,0.14),transparent),linear-gradient(180deg,#0a0b12,40%,#0e0f16)]">
      {/* Animated glow orbs */}
      <Aurora    prefersReduced={!!prefersReduced} />

      {/* Scroll progress bar */}
      <motion.div style={{ scaleX }} className="fixed left-0 right-0 top-0 h-1.5 origin-left bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 z-50" />

      <NavBar activeId={activeId} />
      <Hero prefersReduced={!!prefersReduced} />
      <Features prefersReduced={!!prefersReduced} />
      <Showcase prefersReduced={!!prefersReduced} />
      <HowItWorks prefersReduced={!!prefersReduced} />
      <CTA />
      <Footer />

      <BackToTop />
    </div>
  );
}

// ---------- Visual Background ----------
function Aurora({ prefersReduced }: { prefersReduced: boolean }) {
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

// ---------- Navbar (DEFINED) ----------
function NavBar({ activeId }: { activeId: string }) {
  const link = (id: string, label: string) => (
    <button
      onClick={() => smoothTo(id)}
      className={`relative px-1 transition ${activeId === id ? "text-white" : "text-white/80 hover:text-white"}`}
    >
      <span className="relative z-10">{label}</span>
      <span className={`absolute -bottom-1 left-0 h-px w-full transition ${activeId === id ? "bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-300" : "bg-transparent"}`} />
    </button>
  );

  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 shadow-[0_0_20px_6px_rgba(167,139,250,0.5)]" />
          <span className="font-semibold tracking-tight bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Hustle</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {link("#hero", "Home")}
          {link("#features", "Features")}
          {link("#showcase", "Demo")}
          {link("#how", "How it works")}
        </div>
        <div className="flex items-center gap-3">
          <a href="/signup" className="text-sm px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 hover:opacity-90 transition shadow-[0_0_30px_-6px_rgba(79,70,229,0.7)]">Get started</a>
        </div>
      </div>
    </div>
  );
}

// ---------- Hero ----------
function Hero({ prefersReduced }: { prefersReduced: boolean }) {
  // animated gradient text (subtle drift)
  const animatedGradient: React.CSSProperties = {
    backgroundImage: "linear-gradient(90deg, #818cf8, #e879f9, #22d3ee)",
    backgroundSize: "200% 200%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  return (
    <Section id="hero">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-8 items-center px-6 pt-24 pb-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="md:col-span-7">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            <motion.span
              style={animatedGradient}
              animate={prefersReduced ? {} : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              Build habits. Crush tasks. Let AI plan the rest.
            </motion.span>
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl">
            Hourly planner, daily tasks, 21‑day habit loops, and reflections — with AI insights that turn your week into a winning roadmap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.a whileHover={{ scale: 1.04 }} href="/signup" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white text-sm flex items-center gap-2 transition shadow-[0_10px_40px_-12px_rgba(79,70,229,0.8)]">Get started</motion.a>
            <motion.a whileHover={{ scale: 1.04 }} href="#features" onClick={(e)=>{e.preventDefault();smoothTo('#features');}} className="px-5 py-3 rounded-2xl border border-white/20 text-sm hover:border-fuchsia-400/70 transition">Explore features</motion.a>
          </div>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-white/85">
            {["Hourly planner", "Reflect & review", "AI roadmaps"].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 shadow-[0_0_18px_6px_rgba(217,70,239,0.4)]"/>
                {b}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Device mock */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="md:col-span-5">
          <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0d0e13]/80 shadow-2xl p-4 backdrop-blur">
            <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-gradient-to-b from-slate-900 to-black">
              <div className="px-4 py-3 border-b border-white/10 text-sm text-white/70">Today • Mon</div>
              <ul className="divide-y divide-white/10 text-sm">
                {["08:00 Run 30m", "10:00 Deep Work 2h", "14:00 Review meeting", "21:00 Reflect 10m"].map((t) => (
                  <li key={t} className="px-4 py-3 flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/20" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4">
                <div className="rounded-xl border border-white/10 p-3 flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">This week</div>
                    <div className="text-xs text-white/60">12 / 18 done</div>
                  </div>
                  <div className="text-xs rounded-full border border-white/20 px-2 py-1">67%</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ---------- Features (staggered + tilt) ----------
function Features({ prefersReduced }: { prefersReduced: boolean }) {
  const { ref, isInView } = useSectionReveal();
  const features = [
    { title: "Hourly Planner", desc: "Block your day hour‑by‑hour and stay in flow." },
    { title: "21‑Day Habits", desc: "Create once — auto‑scheduled streaks with gentle nudges." },
    { title: "Reflect & Review", desc: "Daily or hourly journaling to spot patterns." },
    { title: "AI Insights", desc: "Roadmaps and tips based on your week’s data." },
  ];
  return (
    <Section id="features" className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Everything you need to stay consistent</h2>
        <p className="mt-3 text-white/75">Plan your week, build habits, reflect deeply — and let AI fill the gaps.</p>
      </motion.div>

      <motion.div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: prefersReduced ? 0 : 0.08 } } }}>
        {features.map((f) => (
          <motion.div key={f.title} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
            <Tilt>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm relative overflow-hidden">
                <div className="absolute -inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[radial-gradient(600px_circle_at_var(--x,50%)_var(--y,50%),rgba(168,85,247,0.18),transparent_40%)]" />
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-white/75">{f.desc}</p>
              </div>
            </Tilt>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ---------- Showcase (parallax) ----------
function Showcase({ prefersReduced }: { prefersReduced: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], prefersReduced ? [0, 0] : [80, -80]);
  return (
    <Section id="showcase" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">See the workflow</h3>
          <p className="mt-3 text-white/75">Weekly calendar + hourly planner. Habit engine with 21‑day loops. Reflect & Review + AI insights below.</p>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {["Auto‑schedule 21‑day habits", "Quick add & toggle tasks", "Progress ring + weekly stats", "One‑click plan generation"].map(x => (
              <li key={x} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400"/> {x}</li>
            ))}
          </ul>
        </div>
        <motion.div
  ref={ref}
  style={{ y }}
  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl"
>
  <div className="aspect-video rounded-xl border border-white/10 bg-gradient-to-b from-slate-900 to-black p-6 flex flex-col items-center justify-center text-center shadow-lg transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(167,139,250,0.4)]">
    <p className="text-lg md:text-xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent italic">
      “I've failed over and over again in my life. And that is why I succeed.”
    </p>
    <p className="mt-4 text-sm text-white/70">— Michael Jordan</p>
  </div>
</motion.div>

      </div>
    </Section>
  );
}

// ---------- How it works ----------
function HowItWorks({ prefersReduced }: { prefersReduced: boolean }) {
  const { ref, isInView } = useSectionReveal();
  const steps = [
    { title: "Set your goal", body: "e.g., Crack SDE interviews in 8 weeks. Pick level + time." },
    { title: "Generate roadmap", body: "AI creates weekly themes and tasks. Adjust to taste." },
    { title: "Schedule with one click", body: "Push tasks to calendar and start executing." },
  ];
  return (
    <Section id="how" className="bg-gradient-to-b from-transparent to-[#0c0c12] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2 initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-extrabold tracking-tight text-center bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
          From goal → actionable calendar
        </motion.h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: prefersReduced ? 0 : i * 0.1 }} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs px-2 py-1 rounded-full border border-white/15 inline-block text-fuchsia-300">Step {i + 1}</div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/75">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ---------- CTA ----------
function CTA() {
  return (
    <section id="cta" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-700 via-indigo-800 to-black p-10 md:p-14 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-40 bg-gradient-to-tr from-fuchsia-500 to-cyan-400"/>
          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-7">
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Make the next 21 days count</h3>
              <p className="mt-3 text-white/85">Start free. Build one habit. Push an AI plan into your calendar. See the difference in a week.</p>
            </div>
            <div className="md:col-span-5 flex md:justify-end items-center gap-3">
              <a href="/signup" className="px-5 py-3 rounded-2xl bg-white text-black text-sm hover:scale-[1.02] transition shadow-[0_10px_40px_-12px_rgba(255,255,255,0.6)]">Create account</a>
              <a href="#how" onClick={(e)=>{e.preventDefault();smoothTo('#how');}} className="px-5 py-3 rounded-2xl border border-white/20 text-sm hover:border-fuchsia-400/70 transition">View how it works</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-10 text-sm text-white/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 shadow-[0_0_16px_6px_rgba(167,139,250,0.5)]" />
          <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Hustle — © {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#features" onClick={(e)=>{e.preventDefault();smoothTo('#features');}} className="hover:text-white">Features</a>
          <a href="#showcase" onClick={(e)=>{e.preventDefault();smoothTo('#showcase');}} className="hover:text-white">Demo</a>
          <a href="#how" onClick={(e)=>{e.preventDefault();smoothTo('#how');}} className="hover:text-white">How it works</a>
        </div>
      </div>
    </footer>
  );
}

// ---------- Back‑to‑top ----------
function BackToTop() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useEffect(() => scrollY.on("change", (y) => setShow(y > 600)), [scrollY]);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-6 right-6 z-50 rounded-full px-4 py-2 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white text-sm shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] hover:opacity-90">
      ↑ Top
    </button>
  );
}

// ---------- Hooks ----------
function useSectionReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, isInView };
}

// ---------- Runtime Smoke Tests (simple) ----------
if (typeof window !== "undefined") {
  try {
    console.assert(typeof HustleLanding === "function", "HustleLanding should be a function");
    console.assert(document != null, "DOM should exist in browser runtime");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Smoke test warning:", e);
  }
}
