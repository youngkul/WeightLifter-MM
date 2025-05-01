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
        fill: true,
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.1)",
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#fff",
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#333",
            font: { size: 14, weight: "bold" }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            color: "#333",
            callback: value => `${value}kg`
          }
        },
        x: {
          ticks: { color: "#666" }
        }
      }
    }
  });
}

// 종목별 기록 그래프
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
        fill: true,
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.1)",
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#fff",
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#333",
            font: { size: 14, weight: "bold" }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            color: "#333",
            callback: value => `${value}kg`
          }
        },
        x: {
          ticks: { color: "#666" }
        }
      }
    }
  });
}


window.loadWeightChart = loadWeightChart;
window.loadRecordsChart = loadRecordsChart;

export { loadWeightChart, loadRecordsChart };

