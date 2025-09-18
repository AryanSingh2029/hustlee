'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { askGemini } from "../../lib/gemini";
import { supabase } from "../../lib/supabaseClient";

// -----------------------------
// Utilities
const classNames = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0,0,0,0)
  return d
}
function weeksBetween(aISO: string, b: Date) {
  const a = startOfWeek(new Date(aISO))
  const sb = startOfWeek(b)
  const diff = a.getTime() - sb.getTime()
  return Math.round(diff / (7*24*60*60*1000))
}
function incMonth(mi: number, yr: number) {
  const m = mi + 1
  return m > 11 ? { m: 0, y: yr + 1 } : { m, y: yr }
}
function decMonth(mi: number, yr: number) {
  const m = mi - 1
  return m < 0 ? { m: 11, y: yr - 1 } : { m, y: yr }
}

// -----------------------------
// Card Shell
function Card({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/10 backdrop-blur md:p-6"
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold md:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div>{children}</div>
    </motion.section>
  )
}

// -----------------------------
// Progress Ring
function ProgressRing({ value }: { value: number }) {
  const size = 120
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = circumference * (1 - value)
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" opacity={0.15} strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progress} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-current text-2xl font-semibold">
        {Math.round(value * 100)}%
      </text>
    </svg>
  )
}

// -----------------------------
// AI Compact & Detailed
function AIBlock({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-white/80">
      {lines.map((t, i) => (
        <p key={i} className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">{t}</p>
      ))}
    </div>
  )
}
function AnalysisBlock({ summary, findings, suggestions }: { summary: string; findings: string[]; suggestions: string[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <p className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10 text-white/80">{summary}</p>
      <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <h3 className="mb-2 text-sm font-semibold">What we found</h3>
        <ul className="list-disc space-y-1 pl-5 text-white/80">
          {findings.map((f, i) => (<li key={i}>{f}</li>))}
        </ul>
      </div>
      <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <h3 className="mb-2 text-sm font-semibold">Suggested actions</h3>
        <ul className="list-disc space-y-1 pl-5 text-white/80">
          {suggestions.map((s, i) => (<li key={i}>{s}</li>))}
        </ul>
      </div>
    </div>
  )
}

// -----------------------------
// MAIN PAGE
export default function AIPlannerPage() {
  const today = new Date();

  // Timeframe
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'custom'>('week');
  const [customMode, setCustomMode] = useState<'weekly' | 'monthly'>('weekly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // User ID
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  // Week Stats
  const [weekOffset, setWeekOffset] = useState(-1);
  const [weekData, setWeekData] = useState<{ date: string; tasks: number; done: number }[]>([]);
  useEffect(() => {
    if (!userId) return;
    const fetchWeek = async () => {
      const base = new Date();
      base.setDate(base.getDate() + weekOffset * 7);
      const start = startOfWeek(base);

      const days: { date: string; tasks: number; done: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = d.toISOString().slice(0, 10);

        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userId)
          .eq("due_date", iso);

        const tasks = data?.length || 0;
        const done = data?.filter((t) => t.is_completed).length || 0;
        days.push({ date: d.toLocaleDateString("en-US", { weekday: "short" }), tasks, done });
      }
      setWeekData(days);
    };
    fetchWeek();
  }, [userId, weekOffset]);
  const weekStats = useMemo(() => {
    const total = weekData.reduce((a, b) => a + b.tasks, 0);
    const done = weekData.reduce((a, b) => a + b.done, 0);
    return { total, done, rate: done / Math.max(1, total) };
  }, [weekData]);

  // Month Stats
  const [monthIndex, setMonthIndex] = useState<number>(today.getMonth());
  const [year, setYear] = useState<number>(today.getFullYear());
  const [monthStats, setMonthStats] = useState<{ total: number; done: number; rate: number }>({ total: 0, done: 0, rate: 0 });
  useEffect(() => {
    if (!userId) return;
    const fetchMonth = async () => {
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 0);
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .gte("due_date", start.toISOString().slice(0, 10))
        .lte("due_date", end.toISOString().slice(0, 10));
      const total = data?.length || 0;
      const done = data?.filter((t) => t.is_completed).length || 0;
      setMonthStats({ total, done, rate: done / Math.max(1, total) });
    };
    fetchMonth();
  }, [userId, monthIndex, year]);

  // Custom Placeholder
  const customStats = { total: 0, done: 0, rate: 0 }

  // AI Outputs
  const [aiThinking, setAiThinking] = useState(false)
  const [aiOutput, setAiOutput] = useState<string[]>([])
  const [aiDetailed, setAiDetailed] = useState<{ summary: string; findings: string[]; suggestions: string[] }>({ summary: '', findings: [], suggestions: [] })

  const generateAI = async () => {
  if (!userId) return;
  setAiThinking(true);

  let from: string, to: string;
  if (timeframe === "week") {
    const start = startOfWeek(new Date());
    from = start.toISOString().slice(0, 10);
    to = new Date(start.getTime() + 6 * 86400000).toISOString().slice(0, 10);
  } else if (timeframe === "month") {
    from = new Date(year, monthIndex, 1).toISOString().slice(0, 10);
    to = new Date(year, monthIndex + 1, 0).toISOString().slice(0, 10);
  } else {
    from = customFrom;
    to = customTo;
  }

  // Fetch data from Supabase
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .gte("due_date", from)
    .lte("due_date", to);

  const { data: journals } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", from)
    .lte("created_at", to);

  // Build prompt
  const prompt = `Analyze my productivity between ${from} and ${to}.
Tasks: ${JSON.stringify(tasks)}
Journals: ${JSON.stringify(journals)}
- For weekly timeframe: return 3-5 short bullet insights (lines).
- For monthly or custom: return a JSON object with { summary, findings[], suggestions[] }.`;

  try {
    const aiResponse = await askGemini(prompt);

    if (timeframe === "week") {
      // Expecting plain text → split into lines
      const lines = aiResponse.text
        ? aiResponse.text.split("\n").filter((l: string) => l.trim() !== "")
        : [
            "High completion early in the week.",
            "Evenings less productive than mornings.",
            "Try batching tasks by theme.",
          ];
      setAiOutput(lines);
    } else {
      // Expecting JSON object
      let parsed;
      try {
        parsed = JSON.parse(aiResponse.text);
      } catch {
        parsed = {
          summary: aiResponse.text || "No summary generated.",
          findings: ["Couldn’t parse structured output."],
          suggestions: ["Try again with more data."],
        };
      }
      setAiDetailed(parsed);
    }
  } catch (err) {
    console.error("AI error:", err);
    if (timeframe === "week") {
      setAiOutput(["AI request failed, showing sample insights."]);
    } else {
      setAiDetailed({
        summary: "AI request failed.",
        findings: ["Could not fetch AI response."],
        suggestions: ["Check API route / key configuration."],
      });
    }
  } finally {
    setAiThinking(false);
  }
};



  const getWeekLabel = (offset: number) => offset === 0 ? 'This Week' : offset === -1 ? 'Last Week' : `${Math.abs(offset)} wks ${offset<0?"ago":"ahead"}`
  const activeStats = timeframe === 'week' ? weekStats : timeframe === 'month' ? monthStats : customStats
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[radial-gradient(60%_80%_at_50%_0%,rgba(99,102,241,.25),transparent_60%),linear-gradient(180deg,rgba(16,16,20,.9),rgba(16,16,20))] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {/* Title + Controls */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">AI Planner & Insights</h1>
            <p className="mt-1 text-white/70">Weekly calendar · Progress & stats · AI insights</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe selector */}
            <div className="rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
              {(['week','month','custom'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={classNames(
                    'rounded-lg px-3 py-1.5 text-sm',
                    timeframe === tf ? 'bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80' : 'hover:bg-white/10'
                  )}
                >
                  {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'Custom'}
                </button>
              ))}
            </div>

            {/* Week Controls */}
            {timeframe === 'week' && (
              <div className="flex items-center gap-2 text-sm">
                <button onClick={() => setWeekOffset(weekOffset - 1)} className="rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">◀ Prev</button>
                <button onClick={() => setWeekOffset(-1)} className="rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">Last</button>
                <button onClick={() => setWeekOffset(0)} className="rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">This</button>
                <label className="flex items-center gap-2">
                  <span className="text-white/60">Week start</span>
                  <input type="date" onChange={e => setWeekOffset(weeksBetween(e.target.value, new Date()))} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 ring-1 ring-white/10" />
                </label>
              </div>
            )}

            {/* Month Controls */}
            {timeframe === 'month' && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button onClick={() => { const { m, y } = decMonth(monthIndex, year); setMonthIndex(m); setYear(y) }} className="rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">◀ Prev</button>
                <button onClick={() => { setMonthIndex(today.getMonth()); setYear(today.getFullYear()) }} className="rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">This</button>
                <button onClick={() => { const { m, y } = incMonth(monthIndex, year); setMonthIndex(m); setYear(y) }} className="rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">Next ▶</button>
                <select value={monthIndex} onChange={e => setMonthIndex(parseInt(e.target.value))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 ring-1 ring-white/10">
                  {monthNames.map((m, i) => (<option key={m} value={i} className="bg-[#121217]">{m}</option>))}
                </select>
                <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value || `${today.getFullYear()}`))} className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 ring-1 ring-white/10" />
              </div>
            )}

            {/* Custom Controls */}
            {timeframe === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
                  {(['weekly','monthly'] as const).map(mode => (
                    <button key={mode} onClick={() => setCustomMode(mode)} className={classNames('rounded-md px-3 py-1', customMode === mode ? 'bg-white/15' : 'hover:bg-white/10')}>
                      {mode === 'weekly' ? 'Weekly' : 'Monthly'}
                    </button>
                  ))}
                </div>
                {customMode === 'weekly' ? (
                  <>
                    <label className="flex items-center gap-2">
                      <span className="text-white/60">From</span>
                      <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 ring-1 ring-white/10" />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-white/60">To</span>
                      <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 ring-1 ring-white/10" />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2">
                      <span className="text-white/60">From</span>
                      <input type="month" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 ring-1 ring-white/10" />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-white/60">To</span>
                      <input type="month" value={customTo} onChange={e => setCustomTo(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 ring-1 ring-white/10" />
                    </label>
                  </>
                )}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={generateAI}
              className={classNames(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
                'bg-gradient-to-r from-indigo-500/90 via-fuchsia-500/90 to-cyan-500/90 hover:from-indigo-500 hover:via-fuchsia-500 hover:to-cyan-500',
                'shadow-lg shadow-indigo-500/20 ring-1 ring-white/20'
              )}
              disabled={aiThinking}
            >
              {aiThinking ? 'Thinking…' : 'Generate AI Insights'}
            </motion.button>
          </div>
        </div>

        {/* Stats + AI */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card
            title="Progress"
            subtitle={timeframe === 'week' ? getWeekLabel(weekOffset) : timeframe === 'month' ? `${monthNames[monthIndex]} ${year}` : (customMode === 'weekly' ? 'Custom: weekly range' : 'Custom: monthly range')}
            right={<div className="text-right text-sm text-white/60">{activeStats.done}/{activeStats.total} tasks</div>}
          >
            <div className="flex items-center gap-6">
              <ProgressRing value={activeStats.rate} />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-white/70">Completion</span>
                  <span className="font-medium">{Math.round(activeStats.rate * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-white/70">Tasks</span>
                  <span className="font-medium">{activeStats.total}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-white/70">Completed</span>
                  <span className="font-medium">{activeStats.done}</span>
                </div>
              </div>
            </div>
          </Card>

          {timeframe === 'week' ? (
            <Card title="AI Insights" subtitle="Based on last/selected week">
              <AIBlock lines={aiOutput} />
            </Card>
          ) : (
            <Card title="Analysis" subtitle={timeframe === 'month' ? 'Monthly detailed analysis' : (customMode === 'weekly' ? 'Custom weekly detailed analysis' : 'Custom monthly detailed analysis')}>
              <AnalysisBlock summary={aiDetailed.summary} findings={aiDetailed.findings} suggestions={aiDetailed.suggestions} />
            </Card>
          )}
        </div>

        {/* Weekly calendar (ONLY for Week) */}
        {timeframe === 'week' && (
          <div className="mt-6">
            <Card
              title="Weekly Calendar"
              subtitle="Days & done counts"
              right={
                <div className="flex items-center gap-2">
                  <button onClick={() => setWeekOffset(weekOffset - 1)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/15">◀ Prev</button>
                  <button onClick={() => setWeekOffset(-1)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/15">Last</button>
                  <button onClick={() => setWeekOffset(0)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/15">This</button>
                  <button onClick={() => setWeekOffset(weekOffset + 1)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/15">Next ▶</button>
                </div>
              }
            >
              <div className="grid grid-cols-7 gap-2">
                {weekData.map(d => {
                  const pct = d.tasks ? Math.round((d.done / d.tasks) * 100) : 0
                  return (
                    <div key={d.date} className="rounded-xl p-3 text-left ring-1 ring-white/10 bg-white/5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{d.date}</span>
                        <span className="text-white/60">{pct}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-white/70" style={{ width: `${pct}%` }} aria-hidden />
                      </div>
                      <p className="mt-2 text-xs text-white/60">{d.done}/{d.tasks} done</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-white/40">Insights are mocked. Wire Reflect/Review/Journal + Tasks data & backend to power AI.</p>
      </div>
      
    {/*trying  start  */}
        <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 text-white text-sm font-medium shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] hover:opacity-90 transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Go Back
        </button>
      </div>

  {/*trying  till here delete if error */}


    </div>
  )
}
