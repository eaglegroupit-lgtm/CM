"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/accounting/format";

export interface CategoryValuePoint {
  category: string;
  value: number;
}

function CategoryTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryValuePoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-[var(--surface-1)] px-3 py-2 text-xs shadow-sm">
      <p className="text-[var(--text-secondary)]">{point.category}</p>
      <p className="font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(point.value)}</p>
    </div>
  );
}

export function StockByCategoryChart({ data }: { data: CategoryValuePoint[] }) {
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
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--grid)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}
          />
          <Tooltip content={<CategoryTooltip />} cursor={{ fill: "var(--grid)", opacity: 0.4 }} />
          <Bar dataKey="value" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
