// Chart.js Bug Resolution Chart
const ctx = document.getElementById("bugChart");
new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["New", "In Progress", "Ready for QA", "Resolved", "Re-opened"],
    datasets: [
      {
        label: "Bug Count",
        data: [25, 45, 10, 120, 5],
        backgroundColor: ["#fcd34d", "#60a5fa", "#86efac", "#4ade80", "#f87171"],
        borderRadius: 6,
      },
    ],
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 20 } },
    },
  },
});

// Task Tab Switcher
function showTab(tab) {
  document.getElementById("agile").classList.add("hidden");
  document.getElementById("waterfall").classList.add("hidden");
  document.querySelectorAll(".tabs button").forEach((btn) => btn.classList.remove("active"));
  document.getElementById(tab).classList.remove("hidden");
  event.target.classList.add("active");
}
