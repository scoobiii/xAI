import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { InteractiveChartData } from "../../types";
import { BarChart3 } from "lucide-react";

interface Props {
  chartData: InteractiveChartData;
}

export const InteractiveChartEmbed: React.FC<Props> = ({ chartData }) => {
  if (!chartData || !chartData.data || chartData.data.length === 0) return null;

  return (
    <div id={`chart-embed-${chartData.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} className="my-3 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-100">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-neutral-200 tracking-wide">{chartData.title}</h4>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono border border-emerald-800/50 uppercase">
          {chartData.type || "area"}
        </span>
      </div>

      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {chartData.type === "bar" ? (
            <BarChart data={chartData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey={chartData.xAxisKey} stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171717", borderColor: "#333", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {chartData.dataKeys.map((dk) => (
                <Bar key={dk.key} dataKey={dk.key} fill={dk.color || "#10b981"} name={dk.label} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartData.type === "line" ? (
            <LineChart data={chartData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey={chartData.xAxisKey} stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171717", borderColor: "#333", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {chartData.dataKeys.map((dk) => (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  stroke={dk.color || "#3b82f6"}
                  name={dk.label}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={chartData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {chartData.dataKeys.map((dk) => (
                  <linearGradient key={`grad-${dk.key}`} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dk.color || "#3b82f6"} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={dk.color || "#3b82f6"} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey={chartData.xAxisKey} stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#171717", borderColor: "#333", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {chartData.dataKeys.map((dk) => (
                <Area
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  stroke={dk.color || "#3b82f6"}
                  fillOpacity={1}
                  fill={`url(#grad-${dk.key})`}
                  name={dk.label}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {chartData.summary && (
        <p className="mt-2 text-xs text-neutral-400 italic bg-neutral-950/40 p-2 rounded border border-neutral-800/60">
          💡 {chartData.summary}
        </p>
      )}
    </div>
  );
};
