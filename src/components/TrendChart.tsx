import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendPoint {
  date: string;
  passed: number;
  failed: number;
}

interface TrendChartProps {
  data: TrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
    }>;
  }>({ labels: [], datasets: [] });

  useEffect(() => {
    if (!data.length) return;
    setChartData({
      labels: data.map((p) => new Date(p.date).toLocaleDateString(undefined, { weekday: "short" })),
      datasets: [
        {
          label: "Passed",
          data: data.map((p) => p.passed),
          borderColor: "#12b76a",
          backgroundColor: "rgba(18, 183, 106, 0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: "Failed",
          data: data.map((p) => p.failed),
          borderColor: "#f04438",
          backgroundColor: "rgba(240, 68, 56, 0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    });
  }, [data]);

  const options: Parameters<typeof Line>[0]["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Execution trend (last 7 days)",
        font: { size: 14, weight: 700 },
        color: "#344054",
        padding: { top: 4, bottom: 16 },
      },
      legend: {
        position: "top" as const,
        labels: { font: { size: 11, weight: 600 }, boxWidth: 10, padding: 20, color: "#475467" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(29, 35, 52, 0.9)",
        titleFont: { size: 11, weight: 700 },
        bodyFont: { size: 11 },
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString() ?? 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "#667085" },
        title: { display: true, text: "Date", font: { size: 11, weight: 600 }, color: "#475467" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#eaecf0" },
        ticks: { font: { size: 10 }, color: "#667085", callback: (v: any) => v?.toLocaleString() },
        title: { display: true, text: "Executions", font: { size: 11, weight: 600 }, color: "#475467" },
      },
    },
    animation: { duration: 1200 },
  };

  return (
    <section className="panel trend-panel">
      <div className="panel-heading">
        <div>
          <h2>Execution trend</h2>
          <p>Pass and fail results over time</p>
        </div>
        <span className="quiet-button">Last 7 days</span>
      </div>
      <div className="chart-container" style={{ height: 240 }}>
        <Line data={chartData} options={options} />
      </div>
    </section>
  );
}