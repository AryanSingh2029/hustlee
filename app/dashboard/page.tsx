"use client";
//   ///  
import { supabase } from "../../lib/supabaseClient";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// =============================================================
// Hustle — Dashboard v6 (Integrated Day + Habits + Reflect)
// • Week date nav (today highlight)
// • Tabs: Day / Habits
// • Day: Normal list or Hourly fixed grid (12–1, 1–2, …)
// • Ongoing 21‑day habits surfaced with per‑day checkbox
// • Reflect & Review inside Day — Journal OR Hourly notes
// • Habits tab: create 21‑day habit, list all, show window, quick delete
// Drop in: app/dashboard/page.tsx (Next.js App Router)
// Requires TailwindCSS and framer-motion.
// =============================================================

// ---------------- utils ----------------
const fmtISO = (d: Date) =>{
  return d.toLocaleDateString("en-CA"); // gives YYYY-MM-DD in local timezone
};
const startOfWeek = (d: Date) => {
  const n = new Date(d);
  const day = (n.getDay() + 6) % 7; // Monday=0
  n.setDate(n.getDate() - day);
  n.setHours(0, 0, 0, 0);
  return n;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const inRangeInclusive = (d: Date, a: Date, b: Date) => d >= a && d <= b;

// time helpers
const pad2 = (n: number) => String(n).padStart(2, "0");
const to12h = (h: number) => {
  const label = ((h + 11) % 12) + 1; // 0→12, 13→1
  const ampm = h < 12 ? "AM" : "PM";
  return { label, ampm };
};

// ---------------- Types ----------------
type Task = { id: number; title: string; time?: string; done: boolean };
type Habit = { id: number; name: string; startISO: string; goalDays: number };
type Reflection = { mode: "journal" | "hourly"; journalText: string; hourly: Record<string, string> };

// ---------------- Visual background ----------------
function Aurora() {
  const prefersReduced = useReducedMotion();
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-25 bg-gradient-to-tr from-indigo-600 via-fuchsia-500 to-cyan-400"
        animate={prefersReduced ? {} : { y: [0, -18, 0], x: [0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />as React.ReactElement
      <motion.div
        aria-hidden ="true"  
        className="pointer-events-none absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-300"
        animate={prefersReduced ? {} : { y: [0, 16, 0], x: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

// ---------------- Sidebar (slide‑in) ----------------
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
             aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
             aria-hidden="true"
            className="fixed z-50 top-0 left-0 h-full w-72 bg-[#0b0c12]/95 backdrop-blur border-r border-white/10 text-white"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 shadow-[0_0_18px_6px_rgba(167,139,250,0.5)]" />
                <span className="font-semibold tracking-tight bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Hustle</span>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white text-sm">✕</button>
            </div>
            <nav className="p-3 text-sm">
              {[
                { key: "day", label: "Day" },
                { key: "habits", label: "Habits" },
                { key: "insights", label: "AI Insights" },
              ].map((i) => (
                <button key={i.key} onClick={onClose} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white">{i.label}</button>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------- Topbar ----------------
function Topbar({ onMenu }: { onMenu: () => void }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log("Logging out...");
    window.location.href = "/";
  };

  const handleProfile = () => {
    // TODO: Navigate to profile page
    console.log("Going to profile...");
    // window.location.href = "/profile";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showProfileMenu && !target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="md:hidden rounded-lg border border-white/10 px-2 py-1 text-white/80 hover:text-white">☰</button>
          <div className="hidden md:flex items-center gap-2 select-none">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 shadow-[0_0_18px_6px_rgba(167,139,250,0.5)]" />
            <span className="font-semibold tracking-tight bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Hustle Dashboard</span>
          </div>
        </div>
        <div className="relative profile-dropdown">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="rounded-full w-8 h-8 bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition" 
            aria-label="profile"
          >
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur border border-white/10 rounded-xl shadow-xl z-50">
              <div className="py-2">
                <button
                  onClick={() => {
                  window.location.href = "/profile";  // or use router.push

                    //  handleProfile();
                   // setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white transition flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Go to Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white transition flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ---------------- Date Nav (week strip) ----------------
function WeekNav({ selected, onSelect, onShift }: { selected: Date; onSelect: (d: Date) => void; onShift: (dir: -1 | 1) => void }) {
  const weekStart = startOfWeek(selected);
  const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
  const isSameDay = (a: Date, b: Date) => fmtISO(a) === fmtISO(b);
  const todayISO = fmtISO(new Date());
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={() => onShift(-1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/10">← Prev</button>
        <button onClick={() => onShift(1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/10">Next →</button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {days.map((d) => {
          const active = isSameDay(d, selected);
          const isToday = fmtISO(d) === todayISO;
          return (
            <button
              key={fmtISO(d)}
              onClick={() => onSelect(d)}
              className={`min-w-[3.25rem] rounded-xl px-3 py-2 text-sm border ${active ? "border-fuchsia-400/70 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              title={d.toDateString()}
            >
              <div className="text-[10px] uppercase text-white/60">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className="leading-none">{d.getDate()}</div>
              {isToday ? <div className="mt-0.5 text-[10px] text-cyan-300">Today</div> : null}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onSelect(new Date())} 
          className="rounded-lg border border-white/10 px-3 py-1 text-xs hover:bg-white/10 bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 border-indigo-400/30 hover:border-indigo-400/50 transition"
        >
          Today
        </button>
      </div>
    </div>
  );
}

// ---------------- Day View ----------------
function DayView({ date, tasksByDay, setTasksByDay, habits, habitDone, toggleHabitDone, reflectionsByDay, setReflectionsByDay, userId }: {
  date: Date;
  tasksByDay: Record<string, { normal: Task[]; hourly: Task[] }>;
  setTasksByDay: React.Dispatch<React.SetStateAction<Record<string, { normal: Task[]; hourly: Task[] }>>>;
  habits: Habit[];
  habitDone: Record<number, Set<string>>;
  toggleHabitDone: (habitId: number, iso: string) => void;
  reflectionsByDay: Record<string, Reflection>;
  setReflectionsByDay: React.Dispatch<React.SetStateAction<Record<string, Reflection>>>;
   userId: string | null;   // ✅ accept it
}) {
  const [mode, setMode] = useState<'list' | 'hourly'>('list');
  const iso = fmtISO(date);
  const dayTasks = tasksByDay[iso] || { normal: [], hourly: [] };
  const items = mode === 'list' ? dayTasks.normal : dayTasks.hourly;
  const [newTitle, setNewTitle] = useState("");
  const [draftByHour, setDraftByHour] = useState<Record<string, string>>({});

  // Reflect state for this date
  const reflect: Reflection = reflectionsByDay[iso] || { mode: "journal", journalText: "", hourly: {} };
  const setReflect = (r: Partial<Reflection>) => setReflectionsByDay((map) => ({ ...map, [iso]: { ...reflect, ...r } as Reflection }));

  const setItems = (fn: (arr: Task[]) => Task[]) => {
    setTasksByDay((map) => {
      const current = map[iso] || { normal: [], hourly: [] };
      const updated = mode === 'list' 
        ? { ...current, normal: fn(current.normal) }
        : { ...current, hourly: fn(current.hourly) };
      return { ...map, [iso]: updated };
    });
  };
  
  const addTask = async () => {
  if (!newTitle.trim()) return;
  const { data, error } = await supabase.from("tasks").insert([
    {
      user_id: userId,            // pass logged-in user id
      title: newTitle.trim(),
      description: "",
      due_date: iso,
    }
  ]).select("*").single();

  if (!error && data) {
    setItems((arr) => [...arr, { id: data.id, title: data.title, done: data.is_completed }]);
    setNewTitle("");
  }
};

const toggle = async (id: number, done: boolean) => {
  await supabase.from("tasks").update({ is_completed: done }).eq("id", id);
  setItems((arr) => arr.map((t) => (t.id === id ? { ...t, done } : t)));
};
const toggleHourlyTask = async (id: number, done: boolean) => {
  await supabase.from("hourly_tasks").update({ is_completed: done }).eq("id", id);
  setItems((arr) => arr.map((t) => (t.id === id ? { ...t, done } : t)));
};
  // Ongoing habits (21‑day window)
  const ongoing = habits.filter((h) => {
    const start = new Date(h.startISO);
    const end = addDays(start, h.goalDays - 1);
    return inRangeInclusive(date, start, end);
  });

  // Build 24 fixed slots for Hourly planning and Hourly reflections
  const slots = useMemo(() => (
    Array.from({ length: 24 }, (_, h) => {
      const next = (h + 1) % 24;
      const a = to12h(h);
      const b = to12h(next);
      const label = `${a.label}–${b.label} ${a.ampm === b.ampm ? a.ampm : `${a.ampm}/${b.ampm}`}`;
      const key = `${pad2(h)}:00`;
      return { key, label };
    })
  ), []);

  // tasks grouped by hour
  const itemsByHour = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of items) {
      if (!t.time) continue;
      const k = t.time.slice(0, 5);
      (map[k] ||= []).push(t);
    }
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.id - b.id));
    return map;
  }, [items]);

const addAtHour = async (key: string) => {
  const text = (draftByHour[key] || "").trim();
  if (!text) return;

  const { data, error } = await supabase.from("hourly_tasks").insert([
    {
      user_id: userId,
      task_date: iso,
      hour: parseInt(key.split(":")[0]),
      description: text,
    }
  ]).select("*").single();

  if (!error && data) {
    setItems((arr) => [...arr, { id: data.id, title: data.description, time: key, done: data.is_completed }]);
    setDraftByHour((d) => ({ ...d, [key]: "" }));
  }
};

  // For Normal mode list ordering (time first)
  const itemsSorted = [...items].sort((a, b) => (a.time || '99:99') < (b.time || '99:99') ? -1 : 1);

  return (
    <div className="space-y-6">
      {/* Plan mode switch */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-white/70">Plan mode:</div>
        <div className="rounded-full border border-white/10 bg-white/5 p-1 text-xs">
          <button onClick={() => setMode('list')} className={`px-3 py-1 rounded-full ${mode==='list' ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white' : 'hover:text-white/90 text-white/80'}`}>Normal</button>
          <button onClick={() => setMode('hourly')} className={`px-3 py-1 rounded-full ${mode==='hourly' ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white' : 'hover:text-white/90 text-white/80'}`}>Hourly</button>
        </div>
      </div>

      {/* Ongoing habits */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Ongoing habits</h3>
          <div className="text-xs text-white/70">{ongoing.length} active</div>
        </div>
        {ongoing.length === 0 ? (
          <div className="mt-2 text-sm text-white/60">No habits in a 21‑day window for this date.</div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {ongoing.map((h) => {
              const done = habitDone[h.id]?.has(iso);
              const start = new Date(h.startISO);
              const dayIndex = Math.floor((+date - +start) / 86400000) + 1; // 1..21
              return (
                <li key={h.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <input type="checkbox" checked={!!done} onChange={() => toggleHabitDone(h.id, iso)} className="h-4 w-4 rounded border-white/20" />
                  <div className="flex-1">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-white/70">Day {Math.max(1, Math.min(h.goalDays, dayIndex))} / {h.goalDays}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Tasks */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Tasks — {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
          {mode === 'list' && (
            <div className="flex items-center gap-2 text-xs">
              <div className="px-2 py-1 rounded-full bg-white/10 border border-white/20">
                {items.filter(t => t.done).length} / {items.length} completed
              </div>
              {items.length > 0 && (
                <div className="text-white/60">
                  {Math.round((items.filter(t => t.done).length / items.length) * 100)}%
                </div>
              )}
            </div>
          )}
        </div>

        {mode === 'hourly' ? (
          <div className="mt-3 grid gap-2">
            {slots.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-28 text-xs text-white/60">{label}</div>
                <input
                  value={draftByHour[key] || ''}
                  onChange={(e) => setDraftByHour((d) => ({ ...d, [key]: e.target.value }))}
                  placeholder="Write task…"
                  className="flex-1 rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/70"
                />
                <button onClick={() => addAtHour(key)} className="text-xs rounded-lg border border-white/10 px-2 py-1 hover:bg-white/10">Add</button>
                {/* existing tasks for this hour */}
                <div className="w-64">
                  {(itemsByHour[key] || []).map((t) => (
                    <div key={t.id} className="text-xs text-white/80 flex items-center gap-2">
                      <input type="checkbox" checked={t.done} onChange={(e) => toggleHourlyTask(t.id, e.target.checked)}  className="h-3.5 w-3.5 rounded border-white/20" />
                      <span className={t.done ? 'line-through text-white/50' : ''}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* quick add for Normal mode */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add task…" className="sm:col-span-4 rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/70" />
              <button onClick={addTask} className="sm:col-span-1 rounded-xl px-3 py-2 text-sm bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)]">Add</button>
            </div>
            <ul className="mt-3 divide-y divide-white/10">
              {itemsSorted.map((i) => (
                <li key={i.id} className="py-2 flex items-center gap-3">
                  <input type="checkbox" checked={i.done}  onChange={(e) => toggle(i.id, e.target.checked)}  className="h-4 w-4 rounded border-white/20" />
                  <div className={`flex-1 ${i.done ? 'line-through text-white/50' : ''}`}>{i.title}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Reflect & Review */}
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
  <div className="flex items-center justify-between">
    <h3 className="font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
      Reflect & Review
    </h3>
    <div className="text-xs rounded-full border border-white/10 bg-white/5 p-1">
      <button
        onClick={() => setReflect({ mode: "journal" })}
        className={`px-3 py-1 rounded-full ${
          reflect.mode === "journal"
            ? "bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white"
            : "text-white/80 hover:text-white"
        }`}
      >
        Journal
      </button>
      <button
        onClick={() => setReflect({ mode: "hourly" })}
        className={`px-3 py-1 rounded-full ${
          reflect.mode === "hourly"
            ? "bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white"
            : "text-white/80 hover:text-white"
        }`}
      >
        Hourly
      </button>
    </div>
  </div>

  {reflect.mode === "journal" ? (
    <div className="mt-3">
      <textarea
        value={reflect.journalText}
        onChange={(e) => setReflect({ journalText: e.target.value })}
        placeholder="Write your thoughts, wins, struggles, what to improve tomorrow…"
        className="w-full h-56 rounded-xl bg-black/30 border border-white/15 px-4 py-3 text-sm outline-none focus:border-fuchsia-400/70"
      />
    </div>
  ) : (
    <div className="mt-3 grid gap-2">
      {slots.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-28 text-xs text-white/60">{label}</div>
          <input
            value={reflect.hourly[key] || ""}
            onChange={(e) =>
              setReflect({
                hourly: { ...reflect.hourly, [key]: e.target.value },
              })
            }
            placeholder="Reflection for this hour…"
            className="flex-1 rounded-xl bg-black/30 border border-white/15 px-3 py-2 text-sm outline-none focus:border-fuchsia-400/70"
          />
        </div>
      ))}
    </div>
  )}

  {/* Save Button */}
  <div className="mt-4 flex justify-end">
    <button
      onClick={async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return alert("Not logged in");

        const iso = fmtISO(date);

        if (reflect.mode === "journal") {
          await supabase.from("journals").upsert({
            user_id: user.id,
            content: reflect.journalText,
            created_at: iso,
          });
        } else {
          for (const [key, value] of Object.entries(reflect.hourly)) {
            if (value.trim()) {
              await supabase.from("hourly_journals").upsert({
                user_id: user.id,
                journal_date: iso,
                hour: parseInt(key.split(":")[0]),
                content: value,
              });
            }
          }
        }

        alert("Reflection saved ✅");
      }}
      className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white text-sm hover:opacity-90"
    >
      Save Reflection
    </button>
  </div>
</div>

    </div>
  );
}

// ---------------- Habits View ----------------
function HabitsView({ selectedDate, habits, setHabits,userId }: { selectedDate: Date; habits: Habit[]; setHabits: React.Dispatch<React.SetStateAction<Habit[]>>; userId: string | null; }) {
  const [name, setName] = useState("");
  const [startISO, setStartISO] = useState(fmtISO(selectedDate));
  const goalDays = 21; // fixed per request

  const addHabit = async () => {
  if (!name.trim()) return;

  const { data, error } = await supabase.from("habits").insert([
    { user_id: userId, name: name.trim(), start_date: startISO, duration_days: 21 }
  ]).select("*").single();

  if (!error && data) {
    setHabits((arr) => [...arr, { id: data.id, name: data.name, startISO: data.start_date, goalDays: data.duration_days }]);
    setName("");
  }
};

  // const removeHabit = (id: number) => setHabits((arr) => arr.filter((h) => h.id !== id));
  const removeHabit = async (habitId: number) => {
  // Delete from DB
  await supabase.from("habits").delete().eq("id", habitId);
  await supabase.from("habit_progress").delete().eq("habit_id", habitId); // optional cleanup

  // Update local state
  setHabits((prev) => prev.filter((h) => h.id !== habitId));
};


  return (
    <div className="space-y-6">
      {/* creator */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-semibold">Create a habit (21‑day)</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name (e.g., Run, LeetCode)" className="md:col-span-3 rounded-xl bg-black/30 border border-white/15 px-3 py-2 outline-none focus:border-fuchsia-400/70" />
          <input value={startISO} onChange={(e) => setStartISO(e.target.value)} type="date" className="md:col-span-1 rounded-xl bg-black/30 border border-white/15 px-3 py-2 outline-none focus:border-fuchsia-400/70" />
          <button onClick={addHabit} className="md:col-span-1 rounded-xl px-3 py-2 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)]">Add</button>
        </div>
        <div className="mt-2 text-xs text-white/70">Goal length is fixed to 21 days.</div>
      </div>

      {/* list */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your habits</h3>
          <div className="text-xs text-white/70">{habits.length} total</div>
        </div>
        {habits.length === 0 ? (
          <div className="mt-2 text-sm text-white/60">No habits yet. Create one above.</div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {habits.map((h) => {
              const start = new Date(h.startISO);
              const end = addDays(start, h.goalDays - 1);
              const active = inRangeInclusive(selectedDate, start, end);
              return (
                <li key={h.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-white/70">{h.startISO} → {fmtISO(end)} • {h.goalDays} days {active ? '• Active this day' : ''}</div>
                  </div>
                  <button onClick={() => removeHabit(h.id)} className="text-xs rounded-lg border border-white/10 px-2 py-1 hover:bg-white/10">Delete</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------- Page (Tabs) ----------------
export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"day" | "habits">("day");

  const [tasksByDay, setTasksByDay] = useState<Record<string, { normal: Task[]; hourly: Task[] }>>({});
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitDone, setHabitDone] = useState<Record<number, Set<string>>>({});
  const [reflectionsByDay, setReflectionsByDay] = useState<Record<string, Reflection>>({});
  const [userId, setUserId] = useState<string | null>(null);
 useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);
  const toggleHabitDone = async (habitId: number, iso: string) => {
  if (!userId) return; // wait until userId is loaded
  const done = habitDone[habitId]?.has(iso);

  if (done) {
    await supabase.from("habit_progress")
      .delete()
      .eq("habit_id", habitId)
      .eq("progress_date", iso)
      .eq("user_id", userId);
  } else {
    await supabase.from("habit_progress").insert([
      { user_id: userId, habit_id: habitId, progress_date: iso, is_done: true },
    ]);
  }

  setHabitDone((map) => {
    const set = new Set(map[habitId] || []);
    done ? set.delete(iso) : set.add(iso);
    return { ...map, [habitId]: set };
  });
};
useEffect(() => {
  if (!userId) return;

  const fetchData = async () => {
    const { data: tasks } = await supabase.from("tasks").select("*").eq("user_id", userId);
    const { data: hourly } = await supabase.from("hourly_tasks").select("*").eq("user_id", userId);
    const { data: habitsData } = await supabase.from("habits").select("*").eq("user_id", userId);
    const { data: journals } = await supabase.from("journals").select("*").eq("user_id", userId);
    const { data: hourlyJournals } = await supabase.from("hourly_journals").select("*").eq("user_id", userId);
      const { data: progress } = await supabase.from("habit_progress").select("*").eq("user_id", userId);
    // 1. Map tasks into state
    const taskMap: Record<string, { normal: Task[]; hourly: Task[] }> = {};
    tasks?.forEach((t) => {
      const iso = t.due_date;
      (taskMap[iso] ||= { normal: [], hourly: [] }).normal.push({
        id: t.id,
        title: t.title,
        done: t.is_completed,
      });
    });
    hourly?.forEach((h) => {
      const iso = h.task_date;
      const key = `${String(h.hour).padStart(2, "0")}:00`;
      (taskMap[iso] ||= { normal: [], hourly: [] }).hourly.push({
        id: h.id,
        title: h.description,
        time: key,
        done: h.is_completed,
      });
    });
    setTasksByDay(taskMap);

    // 2. Map habits
    setHabits(
      habitsData?.map((h) => ({
        id: h.id,
        name: h.name,
        startISO: h.start_date,
        goalDays: h.duration_days,
      })) || []
    );

    // 3. Map reflections
    const reflMap: Record<string, Reflection> = {};
    journals?.forEach((j) => {
      reflMap[j.created_at] = {
        mode: "journal",
        journalText: j.content,
        hourly: {},
      };
    });
    hourlyJournals?.forEach((hj) => {
      const iso = hj.journal_date;
      (reflMap[iso] ||= { mode: "hourly", journalText: "", hourly: {} }).hourly[
        `${String(hj.hour).padStart(2, "0")}:00`
      ] = hj.content;
    });
    setReflectionsByDay(reflMap);
    if (progress) {
      const map: Record<number, Set<string>> = {};
      progress.forEach((p) => {
        if (!map[p.habit_id]) map[p.habit_id] = new Set();
        map[p.habit_id].add(p.progress_date);
      });
      setHabitDone(map);
    }
  };
   
  fetchData();
}, [userId]);


  


  return (
    <div className="min-h-screen relative bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(900px_500px_at_110%_10%,rgba(236,72,153,0.14),transparent),linear-gradient(180deg,#0a0b12,40%,#0e0f16)] text-gray-100">
      <Aurora />
      <Topbar onMenu={() => {}} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <WeekNav selected={selectedDate} onSelect={setSelectedDate} onShift={(dir) => setSelectedDate(addDays(selectedDate, dir * 7))} />

        {/* tabs */}
        <div className="flex items-center gap-2 text-sm">
          <div className="rounded-full border border-white/10 bg-white/5 p-1">
            <button onClick={() => setActiveTab("day")} className={`px-3 py-1 rounded-full ${activeTab==='day' ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white' : 'text-white/80 hover:text-white'}`}>Day</button>
            <button onClick={() => setActiveTab("habits")} className={`px-3 py-1 rounded-full ${activeTab==='habits' ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white' : 'text-white/80 hover:text-white'}`}>Habits</button>
          </div>
        </div>

        {activeTab === "day" ? (
          <DayView
            date={selectedDate}
            tasksByDay={tasksByDay}
            setTasksByDay={setTasksByDay}
            habits={habits}
            habitDone={habitDone}
            toggleHabitDone={toggleHabitDone}
            reflectionsByDay={reflectionsByDay}
            setReflectionsByDay={setReflectionsByDay}
             userId={userId}   // ✅ pass it here
          />
        ) : (
          <HabitsView selectedDate={selectedDate} habits={habits} setHabits={setHabits} userId={userId}   />
        )}
      </main>
      
      {/* Stats Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => window.location.href = "/stats"}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white text-sm font-medium shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] hover:opacity-90 transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Check Stats
        </button>
      </div>
    </div>
  );
}
