import { supabase } from "./supabase-config.js";

let weightChartInstance = null;
let recordsChartInstance = null;

// 체중 그래프
async function loadWeightChart(user) {
  const { data, error } = await supabase
    .from("weights")
    .select("*")
    .eq("uid", user.id)
    .order("date", { ascending: true });

  if (error) {
    console.error("체중 불러오기 오류:", error.message);
    return;
  }

  const labels = data.map(item => item.date);
  const weights = data.map(item => item.weight);

  const ctx = document.getElementById("weightChart").getContext("2d");

  if (weightChartInstance) weightChartInstance.destroy();

  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "체중 변화 (kg)",
        data: weights,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// 종목별 기록 그래프
async function loadRecordsChart(user) {
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("uid", user.id)
    .single();

  if (error || !data) return;

  const ctx = document.getElementById("recordsChart").getContext("2d");

  if (recordsChartInstance) recordsChartInstance.destroy();

  recordsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Snatch", "Clean & Jerk", "Back Squat", "Front Squat", "Deadlift", "Bench Press"],
      datasets: [{
        label: "기록 (kg)",
        data: [
          data.snatch, data.cleanJerk, data.backSquat,
          data.frontSquat, data.deadlift, data.benchPress
        ],
        backgroundColor: [
          "#007bff", "#6610f2", "#28a745", "#17a2b8", "#ffc107", "#dc3545"
        ]
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

window.loadWeightChart = loadWeightChart;
window.loadRecordsChart = loadRecordsChart;

export { loadWeightChart, loadRecordsChart };
