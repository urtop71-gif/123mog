"use client";

import { Doughnut, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useT } from "@/lib/LangContext";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface MacroChartProps {
  protein: number; fat: number; carbs: number;
  meals: { mealType: string; totalCalories: number }[];
}

export default function MacroChart({ protein, fat, carbs, meals }: MacroChartProps) {
  const { t } = useT();

  const doughnutData = {
    labels: [t.dashboard.protein, t.dashboard.fat, t.dashboard.carbs],
    datasets: [{ data: [protein, fat, carbs], backgroundColor: ["#3b82f6", "#f59e0b", "#8b5cf6"], borderWidth: 1, hoverOffset: 6 }],
  };

  const barData = {
    labels: meals.map((m) => m.mealType),
    datasets: [{ label: "kcal", data: meals.map((m) => m.totalCalories), backgroundColor: ["#34d399", "#60a5fa", "#fbbf24", "#f472b6"], borderRadius: 8 }],
  };

  const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" as const, labels: { padding: 16, usePointStyle: true, font: { size: 13 } } }, tooltip: { backgroundColor: "#1f2937", padding: 12, cornerRadius: 8 } } };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.macroRatio}</h3>
        <div className="h-64 flex items-center justify-center">
          {protein + fat + carbs > 0 ? <Doughnut data={doughnutData} options={opts} /> : <p className="text-gray-400 text-sm">{t.dashboard.noData}</p>}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.mealCalories}</h3>
        <div className="h-64 flex items-center justify-center">
          {meals.length > 0 ? <Bar data={barData} options={{ ...opts, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }, plugins: { ...opts.plugins, legend: { display: false } } }} /> : <p className="text-sm text-gray-400">{t.dashboard.noData}</p>}
        </div>
      </div>
    </div>
  );
}
