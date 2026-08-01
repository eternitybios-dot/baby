"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyMetricPoint } from "@/types/domain";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface MetricChartCardProps {
  title: string;
  unit: string;
  data: DailyMetricPoint[];
  variant?: "bar" | "line";
  color?: string;
  className?: string;
  emptyTitle?: string;
}

export function MetricChartCard({
  title,
  unit,
  data,
  variant = "bar",
  color = "var(--primary)",
  className,
  emptyTitle = "表示できるデータがありません",
}: MetricChartCardProps) {
  const hasData = data.some((point) => point.value > 0);

  return (
    <section
      className={cn("rounded-2xl bg-card p-4 shadow-soft", className)}
      aria-label={title}
    >
      <div className="mb-3 flex items-end justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">単位: {unit}</p>
      </div>

      {!hasData ? (
        <EmptyState
          title={emptyTitle}
          description="記録が増えるとここにグラフが表示されます"
          className="shadow-none"
        />
      ) : (
        <div className="h-52 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {variant === "line" ? (
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={36}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `${typeof value === "number" ? value : String(value)}${unit}`,
                    title,
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={36}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `${typeof value === "number" ? value : String(value)}${unit}`,
                    title,
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="value" fill={color} radius={[8, 8, 4, 4]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
