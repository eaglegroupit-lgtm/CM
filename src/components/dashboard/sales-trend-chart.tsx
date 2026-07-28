"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/accounting/format";

export interface SalesTrendPoint {
  date: string;
  label: string;
  amount: number;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: SalesTrendPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-[var(--surface-1)] px-3 py-2 text-xs shadow-sm">
      <p className="text-[var(--text-secondary)]">{point.label}</p>
      <p className="font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(point.amount)}</p>
    </div>
  );
}

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  return (
    <div
      className="viz-root h-64 w-full"
      style={
        {
          "--surface-1": "#fcfcfb",
          "--text-secondary": "#52514e",
          "--text-primary": "#0b0b0b",
          "--muted": "#898781",
          "--grid": "#e1e0d9",
          "--series-1": "#2a78d6",
        } as React.CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--grid)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--grid)" }} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
