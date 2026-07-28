"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/accounting/format";

export interface AgeingBucket {
  bucket: string;
  amount: number;
}

const BUCKET_STEPS = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab"];

function AgeingTooltip({ active, payload }: { active?: boolean; payload?: { payload: AgeingBucket }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-[var(--surface-1)] px-3 py-2 text-xs shadow-sm">
      <p className="text-[var(--text-secondary)]">{point.bucket}</p>
      <p className="font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(point.amount)}</p>
    </div>
  );
}

export function AgeingChart({ data }: { data: AgeingBucket[] }) {
  return (
    <div
      className="viz-root h-56 w-full"
      style={
        {
          "--surface-1": "#fcfcfb",
          "--text-secondary": "#52514e",
          "--text-primary": "#0b0b0b",
          "--muted": "#898781",
          "--grid": "#e1e0d9",
        } as React.CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}
          />
          <YAxis type="category" dataKey="bucket" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<AgeingTooltip />} cursor={{ fill: "var(--grid)", opacity: 0.4 }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={BUCKET_STEPS[Math.min(idx, BUCKET_STEPS.length - 1)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
