const state = {
  launchingCustomers: 119,
  revenuePerConversion: 119,
  customerGrowthRate: 0.15,
  averageResponseRate: 0.2,
  customerChurnRate: 0.02,
  variableCost: 10.8,
  fixedCosts: 175,
  startingCost: 0
};

const refs = {
  launchingCustomers: document.getElementById('launchingCustomersValue'),
  revenuePerConversion: document.getElementById('revenuePerConversionValue'),
  customerGrowthRate: document.getElementById('customerGrowthRateValue'),
  averageResponseRate: document.getElementById('averageResponseRateValue'),
  customerChurnRate: document.getElementById('customerChurnRateValue'),
  variableCost: document.getElementById('variableCostValue'),
  fixedCosts: document.getElementById('fixedCostsValue'),
  startingCost: document.getElementById('startingCostValue'),
  customersSummary: document.getElementById('customersSummary'),
  revenueSummary: document.getElementById('revenueSummary'),
  expensesSummary: document.getElementById('expensesSummary'),
  profitSummary: document.getElementById('profitSummary'),
  retentionSummary: document.getElementById('retentionSummary'),
  roiSummary: document.getElementById('roiSummary')
};

const chartCanvas = document.getElementById('performanceChart');
const ctx = chartCanvas.getContext('2d');

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function setSliderFill(slider) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const value = Number(slider.value);
  const percent = ((value - min) / (max - min)) * 100;
  slider.style.setProperty('--percent', `${percent}%`);
}

function updateSummary() {
  const customers = Math.round(
    state.launchingCustomers * Math.pow(1 + state.customerGrowthRate, 12)
  );

  const revenue = customers * state.revenuePerConversion;
  const expenses = state.fixedCosts + state.startingCost + customers * state.variableCost;
  const profit = revenue - expenses;
  const retention = Math.max(0, 1 - state.customerChurnRate);
  const roi = (profit / Math.max(1, expenses)) * 100;

  refs.customersSummary.textContent = customers.toLocaleString('en-US');
  refs.revenueSummary.textContent = formatMoney(revenue);
  refs.expensesSummary.textContent = formatMoney(expenses);
  refs.profitSummary.textContent = formatMoney(profit);
  refs.retentionSummary.textContent = formatPercent(retention);
  refs.roiSummary.textContent = formatPercent(roi / 100);
}

function calculateSalesSeries() {
  const weeks = 12;
  const values = [];

  for (let i = 1; i <= weeks; i += 1) {
    const customers = state.launchingCustomers * Math.pow(1 + state.customerGrowthRate, i);
    const revenue = customers * state.revenuePerConversion;
    const operatingCosts = state.fixedCosts + customers * state.variableCost;
    const profit = revenue - operatingCosts;
    values.push({
      week: i,
      customers,
      revenue,
      profit
    });
  }

  return values;
}

function renderChart() {
  const values = calculateSalesSeries();
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const padding = { top: 15, right: 12, bottom: 28, left: 28 };

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#e7edf4';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 12; i += 1) {
    const x = padding.left + ((width - padding.left - padding.right) / 12) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  const maxProfit = Math.max(...values.map(v => v.profit), 1);
  const minProfit = Math.min(...values.map(v => v.profit), 0);
  const range = Math.max(maxProfit - minProfit, 1);

  ctx.beginPath();
  ctx.strokeStyle = '#29b8d9';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  values.forEach((val, index) => {
    const x = padding.left + ((width - padding.left - padding.right) / (values.length - 1)) * index;
    const y = height - padding.bottom - ((val.profit - minProfit) / range) * (height - padding.top - padding.bottom);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = '#2ac4b3';
  values.forEach((val, index) => {
    const x = padding.left + ((width - padding.left - padding.right) / (values.length - 1)) * index;
    const y = height - padding.bottom - ((val.profit - minProfit) / range) * (height - padding.top - padding.bottom);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#7d8ea2';
  ctx.font = '11px sans-serif';
  for (let i = 1; i <= 12; i += 1) {
    const x = padding.left + ((width - padding.left - padding.right) / 12) * (i - 1);
    ctx.fillText(String(i), x - 2, height - 8);
  }

  ctx.save();
  ctx.translate(20, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#8091a5';
  ctx.font = '11px sans-serif';
  ctx.fillText('Profit', 0, 0);
  ctx.restore();
}

function updateReadout(key, value) {
  const labelMap = {
    launchingCustomers: 'launchingCustomersValue',
    revenuePerConversion: 'revenuePerConversionValue',
    customerGrowthRate: 'customerGrowthRateValue',
    averageResponseRate: 'averageResponseRateValue',
    customerChurnRate: 'customerChurnRateValue',
    variableCost: 'variableCostValue',
    fixedCosts: 'fixedCostsValue',
    startingCost: 'startingCostValue'
  };

  const target = refs[labelMap[key]];
  if (!target) return;

  target.textContent = Number.isInteger(value) ? value : Number(value).toFixed(2);
}

function bindSlider(input) {
  const key = input.dataset.key;
  const value = Number(input.value);
  state[key] = value;
  setSliderFill(input);
  updateReadout(key, value);
  updateSummary();
  renderChart();
}

function initSliders() {
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    setSliderFill(slider);
    slider.addEventListener('input', (event) => {
      bindSlider(event.target);
    });
  });
}

window.addEventListener('resize', renderChart);
initSliders();
updateSummary();
renderChart();
