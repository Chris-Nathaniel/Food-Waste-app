import { motion } from "motion/react";
import React from "react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  trendType?: "positive" | "negative" | "neutral";
  trendValue?: string;
  colorTheme?: "emerald" | "amber" | "rose" | "blue" | "indigo" | "secondary";
}

export default function MetricCard({
  id,
  title,
  value,
  subtext,
  icon,
  trendType = "neutral",
  trendValue,
  colorTheme = "secondary",
}: MetricCardProps) {
  const themes = {
    emerald: {
      bg: "bg-emerald-50/50 hover:bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-700",
      iconBg: "bg-emerald-100/80 text-emerald-700",
      accent: "bg-emerald-600",
    },
    amber: {
      bg: "bg-amber-50/50 hover:bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-700",
      iconBg: "bg-amber-100/80 text-amber-700",
      accent: "bg-amber-500",
    },
    rose: {
      bg: "bg-rose-50/50 hover:bg-rose-50",
      border: "border-rose-100",
      text: "text-rose-700",
      iconBg: "bg-rose-100/80 text-rose-700",
      accent: "bg-rose-600",
    },
    blue: {
      bg: "bg-blue-50/50 hover:bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-700",
      iconBg: "bg-blue-100/80 text-blue-700",
      accent: "bg-blue-600",
    },
    indigo: {
      bg: "bg-indigo-50/50 hover:bg-indigo-50",
      border: "border-indigo-100",
      text: "text-indigo-700",
      iconBg: "bg-indigo-100/80 text-indigo-700",
      accent: "bg-indigo-600",
    },
    secondary: {
      bg: "bg-white hover:bg-slate-50/50",
      border: "border-slate-100 shadow-sm",
      text: "text-slate-700",
      iconBg: "bg-slate-100 text-slate-600",
      accent: "bg-slate-400",
    },
  };

  const selectedTheme = themes[colorTheme];

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all text-slate-900 ${selectedTheme.bg} ${selectedTheme.border}`}
    >
      {/* Structural Accent Line */}
      <span className={`absolute top-0 left-0 h-1 w-full ${selectedTheme.accent}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="font-sans text-3xl font-extrabold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${selectedTheme.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200/60 pt-3">
        <span className="text-xs text-slate-500 font-medium">{subtext}</span>
        {trendValue && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono ${
              trendType === "positive"
                ? "bg-emerald-100 text-emerald-800"
                : trendType === "negative"
                ? "bg-rose-100 text-rose-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {trendType === "positive" ? "↑" : trendType === "negative" ? "↓" : "•"} {trendValue}
          </span>
        )}
      </div>
    </motion.div>
  );
}
