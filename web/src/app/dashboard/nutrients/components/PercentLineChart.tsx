"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReactNode } from "react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { TrendPoint } from "../types";

type MacroColorMap = {
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
};

type PercentLineChartProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  data: TrendPoint[];
  emptyText: string;
  dataTestId?: string;
  actions?: ReactNode;
  colors: MacroColorMap;
  labelFormatter?: (
    label: string | number,
    payload: ReadonlyArray<Payload<ValueType, NameType>>
  ) => React.ReactNode;
};

export function PercentLineChart({
  title,
  subtitle,
  icon,
  data,
  emptyText,
  dataTestId,
  actions,
  colors,
  labelFormatter,
}: PercentLineChartProps) {
  return (
    <div className="brutalism-card brutalism-shadow-lg bg-white p-4" data-testid={dataTestId}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <div>
          <h3 className="brutalism-text-bold text-xl uppercase">{title}</h3>
          <p className="text-sm font-semibold text-gray-600">{subtitle}</p>
        </div>
        {actions && <div className="ml-auto flex gap-2">{actions}</div>}
      </div>
      <div className="h-72 w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                width={48}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${Math.round(Number(v) || 0)}%`}
                domain={[0, "dataMax + 20"]}
              />
              <Tooltip
                formatter={(value) => `${(value as number).toFixed(0)}%`}
                labelFormatter={labelFormatter}
              />
              <ReferenceLine
                y={100}
                stroke="#000"
                strokeDasharray="6 6"
                strokeWidth={2}
                label={{
                  value: "Goal",
                  position: "insideTopRight",
                  fill: "#000",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="calories" stroke={colors.calories} strokeWidth={3} />
              <Line type="monotone" dataKey="protein" stroke={colors.protein} strokeWidth={3} />
              <Line type="monotone" dataKey="carbs" stroke={colors.carbs} strokeWidth={3} />
              <Line type="monotone" dataKey="fats" stroke={colors.fats} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-600">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
