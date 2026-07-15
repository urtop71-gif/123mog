"use client";

import { useState, useEffect, useCallback } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  LineController,
  BarController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { format, parseISO } from "date-fns";
import { useT } from "@/lib/LangContext";

ChartJS.register(
  LineElement,
  BarElement,
  LineController,
  BarController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

interface TrendPoint {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  exercise: number;
  bmr: number;
}

export default function TrendChart() {
  const { t } = useT();
  const [range, setRange] = useState<"week" | "month">("week");
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrend = useCallback(async (r: "week" | "month") => {
    setLoading(true);
    const res = await fetch(`/api/meals/trend?range=${r}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/range-change; setState only runs after the awaited fetch resolves
  useEffect(() => { fetchTrend(range); }, [range, fetchTrend]);

  const chartData = {
    labels: data.map((d) => format(parseISO(d.date), range === "week" ? "EEE" : "MM/dd")),
    datasets: [
      {
        type: "bar" as const,
        label: t.profile.bmr,
        data: data.map((d) => d.bmr),
        backgroundColor: "#6366f1",
        stack: "burned",
        order: 3,
      },
      {
        type: "bar" as const,
        label: t.dashboard.exercise,
        data: data.map((d) => d.exercise),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
        stack: "burned",
        order: 2,
      },
      {
        type: "line" as const,
        label: t.dashboard.calories,
        data: data.map((d) => d.calories),
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        tension: 0.3,
        order: 1,
      },
    ],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" as const, labels: { boxWidth: 12, usePointStyle: true } },
      tooltip: { backgroundColor: "#1f2937", padding: 12, cornerRadius: 8 },
    },
    scales: {
      y: { beginAtZero: true, stacked: true },
      x: { grid: { display: false }, stacked: true },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.dashboard.trend}</h3>
        <div className="flex gap-1">
          <button onClick={() => setRange("week")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${range === "week" ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>
            {t.dashboard.weekly}
          </button>
          <button onClick={() => setRange("month")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${range === "month" ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>
            {t.dashboard.monthly}
          </button>
        </div>
      </div>
      <div className="h-64">
        {!loading && data.length > 0 ? (
          <Chart type="bar" data={chartData} options={opts} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">{loading ? "" : t.dashboard.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
