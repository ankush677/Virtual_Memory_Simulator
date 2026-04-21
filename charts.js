
'use strict';

let comparisonChart = null;
let faultTrendChart = null;
let memoryPieChart = null;
let fragChart = null;

const CHART_COLORS = {
  fifo:    '#ff006e',
  lru:     '#00d4ff',
  optimal: '#00ff88',
  fault:   '#ff4d6d',
  hit:     '#06ffa5',
  used:    '#00d4ff',
  wasted:  '#ff006e',
  free:    '#1e2a3a',
};

function destroyChart(chartRef) {
  if (chartRef) { chartRef.destroy(); }
}

function renderComparisonChart(results) {
  destroyChart(comparisonChart);
  const ctx = document.getElementById('comparisonChart');
  if (!ctx) return;

  const labels = results.map(r => r.algorithm);
  const faults = results.map(r => r.faults);
  const hits   = results.map(r => r.hits);

  comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Page Faults',
          data: faults,
          backgroundColor: [CHART_COLORS.fifo, CHART_COLORS.lru, CHART_COLORS.optimal]
            .map(c => c + 'cc'),
          borderColor: [CHART_COLORS.fifo, CHART_COLORS.lru, CHART_COLORS.optimal],
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: 'Page Hits',
          data: hits,
          backgroundColor: ['#ff006e33','#00d4ff33','#00ff8833'],
          borderColor: [CHART_COLORS.fifo, CHART_COLORS.lru, CHART_COLORS.optimal],
          borderWidth: 1,
          borderRadius: 6,
          borderDash: [4,4],
        }
      ],
    },
    options: chartOptions('Algorithm Comparison — Faults vs Hits'),
  });
}


function renderFaultTrendChart(results) {
  destroyChart(faultTrendChart);
  const ctx = document.getElementById('faultTrendChart');
  if (!ctx) return;

  const labels = results[0].steps.map(s => `S${s.step}`);
  const datasets = results.map((r, i) => {
    const colors = [CHART_COLORS.fifo, CHART_COLORS.lru, CHART_COLORS.optimal];
    let cumFaults = 0;
    const data = r.steps.map(s => {
      if (s.fault) cumFaults++;
      return cumFaults;
    });
    return {
      label: r.algorithm,
      data,
      borderColor: colors[i],
      backgroundColor: colors[i] + '22',
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: colors[i],
    };
  });

  faultTrendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: chartOptions('Cumulative Page Faults Over Time'),
  });
}

function renderMemoryPieChart(used, free, wasted, canvasId = 'memoryPieChart') {
  destroyChart(memoryPieChart);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  memoryPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Used', 'Free', 'Internal Fragmentation'],
      datasets: [{
        data: [used, free, wasted],
        backgroundColor: [CHART_COLORS.used + 'cc', CHART_COLORS.free, CHART_COLORS.wasted + 'cc'],
        borderColor: [CHART_COLORS.used, '#2a3a50', CHART_COLORS.wasted],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#a0b4c8', font: { family: 'JetBrains Mono', size: 11 }, padding: 12 },
        },
        title: {
          display: true,
          text: 'Memory Distribution',
          color: '#e0eaf6',
          font: { family: 'Orbitron', size: 13 },
        },
        tooltip: tooltipStyle(),
      },
      cutout: '65%',
    },
  });
}


function renderFragChart(partitions) {
  destroyChart(fragChart);
  const ctx = document.getElementById('fragChart');
  if (!ctx) return;

  fragChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: partitions.map(p => p.name),
      datasets: [
        {
          label: 'Requested (KB)',
          data: partitions.map(p => p.requested),
          backgroundColor: CHART_COLORS.used + 'cc',
          borderColor: CHART_COLORS.used,
          borderWidth: 2,
          borderRadius: 4,
        },
        {
          label: 'Wasted (KB)',
          data: partitions.map(p => p.wasted),
          backgroundColor: CHART_COLORS.wasted + 'cc',
          borderColor: CHART_COLORS.wasted,
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions('Internal Fragmentation per Process'),
  });
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#a0b4c8', font: { family: 'JetBrains Mono', size: 11 }, padding: 12 },
      },
      title: {
        display: true,
        text: title,
        color: '#e0eaf6',
        font: { family: 'Orbitron', size: 13 },
        padding: { bottom: 12 },
      },
      tooltip: tooltipStyle(),
    },
    scales: {
      x: {
        ticks: { color: '#6a8a9a', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1e2e3e' },
      },
      y: {
        ticks: { color: '#6a8a9a', font: { family: 'JetBrains Mono', size: 10 } },
        grid: { color: '#1e2e3e' },
        beginAtZero: true,
      },
    },
  };
}

function tooltipStyle() {
  return {
    backgroundColor: '#0d1a2a',
    titleColor: '#00d4ff',
    bodyColor: '#a0b4c8',
    borderColor: '#1e3a5a',
    borderWidth: 1,
    titleFont: { family: 'Orbitron', size: 11 },
    bodyFont: { family: 'JetBrains Mono', size: 11 },
    padding: 10,
  };
}
