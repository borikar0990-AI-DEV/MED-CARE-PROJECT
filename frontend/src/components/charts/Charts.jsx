import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "../common/Feedback";

/**
 * Raw hex values mirroring tailwind.config.js's palette — Recharts renders
 * to SVG attributes directly and can't consume Tailwind utility classes,
 * so the brand colors are duplicated here deliberately (single source of
 * truth for the *values* stays the Tailwind config; keep these in sync if
 * that palette ever changes).
 */
const COLORS = {
  taken: "#22B57B", // secondary-500
  skipped: "#DE9F2E", // amber-500
  missed: "#E2542D", // danger-500
  pending: "#2F6FED", // primary-500
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgb(241 245 249)",
  boxShadow: "0 10px 30px -10px rgba(16,40,34,0.15)",
  fontSize: 13,
};

function ChartCard({ title, subtitle, children, empty }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5"
    >
      <div className="mb-4">
        <p className="font-display text-base font-semibold text-slate-900 dark:text-white">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {empty ? <EmptyState icon="📊" title="Not enough data yet" description="Log a few doses to see this chart fill in." /> : children}
    </motion.div>
  );
}

export function WeeklyActivityChart({ data = [] }) {
  const hasData = data.some((d) => d.taken + d.skipped + d.missed > 0);
  return (
    <ChartCard title="Weekly Medication Activity" subtitle="Taken vs. skipped vs. missed, per day" empty={!hasData}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-white/5" />
            <XAxis dataKey="day_label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400" axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="taken" name="Taken" fill={COLORS.taken} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="skipped" name="Skipped" fill={COLORS.skipped} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="missed" name="Missed" fill={COLORS.missed} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function StatusDonutChart({ breakdown }) {
  const slices = [
    { key: "taken", label: "Taken", value: breakdown?.taken || 0 },
    { key: "missed", label: "Missed", value: breakdown?.missed || 0 },
    { key: "skipped", label: "Skipped", value: breakdown?.skipped || 0 },
  ];
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <ChartCard title="Medication Status" subtitle="Share of completed doses by outcome" empty={total === 0}>
      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="label" innerRadius={62} outerRadius={92} paddingAngle={3} strokeWidth={0}>
              {slices.map((s) => (
                <Cell key={s.key} fill={COLORS[s.key]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} dose${value === 1 ? "" : "s"}`, name]} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ marginBottom: 28 }}>
            <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">{total}</span>
            <span className="text-[11px] text-slate-400">logged</span>
          </div>
        )}
      </div>
    </ChartCard>
  );
}

export function AdherenceTrendChart({ data = [], title = "Daily Schedule", subtitle = "Doses taken per day" }) {
  const hasData = data.some((d) => d.taken + d.skipped + d.missed > 0);
  return (
    <ChartCard title={title} subtitle={subtitle} empty={!hasData}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-white/5" />
            <XAxis dataKey="day_label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400" axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="taken" name="Taken" stroke={COLORS.taken} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="missed" name="Missed" stroke={COLORS.missed} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function AdherenceRateCard({ rate = 0 }) {
  const color = rate >= 80 ? COLORS.taken : rate >= 50 ? COLORS.skipped : COLORS.missed;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5"
    >
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-white/10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(100, Math.max(0, rate)) / 100)}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">{rate}%</span>
        </div>
      </div>
      <p className="mt-3 font-display text-sm font-semibold text-slate-800 dark:text-slate-100">Adherence Rate</p>
      <p className="text-xs text-slate-400">Taken vs. all completed doses</p>
    </motion.div>
  );
}
