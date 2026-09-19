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

const languageSelect = document.getElementById('languageSelect');
const timeUnitSelect = document.getElementById('timeUnitSelect');
const currencySelect = document.getElementById('currencySelect');
const periodsInput = document.getElementById('periodsInput');
const exportDataButton = document.getElementById('exportDataButton');
const loadDataButton = document.getElementById('loadDataButton');
const loadDataInput = document.getElementById('loadDataInput');

const currencyRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79
};

function getCurrentLocale() {
  return languageSelect && languageSelect.value ? languageSelect.value : 'en';
}

function applyTranslations(locale) {
  const pack = window.langPack && window.langPack[locale] ? window.langPack[locale] : window.langPack.en;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (pack[key]) {
      node.textContent = pack[key];
    }
  });

  if (languageSelect) {
    languageSelect.value = locale;
  }

  if (timeUnitSelect) {
    const unit = timeUnitSelect.value || 'week';
    document.querySelectorAll('#timeUnitSelect option').forEach((option) => {
      const key = option.value;
      if (pack[key]) {
        option.textContent = pack[key];
      }
    });
    timeUnitSelect.value = unit;
  }
}

languageSelect?.addEventListener('change', (event) => {
  applyTranslations(event.target.value);
  updateSummary();
  renderChart();
});

timeUnitSelect?.addEventListener('change', () => {
  updateSummary();
  renderChart();
});

currencySelect?.addEventListener('change', () => {
  updateSummary();
  renderChart();
});

periodsInput?.addEventListener('input', () => {
  updateSummary();
  renderChart();
});

exportDataButton?.addEventListener('click', () => {
  const data = {
    state,
    settings: {
      language: languageSelect?.value || 'en',
      timeUnit: timeUnitSelect?.value || 'week',
      periods: periodsInput?.value || '12',
      currency: currencySelect?.value || 'USD'
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'results-predictor-data.json';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 0);
});

loadDataButton?.addEventListener('click', () => {
  loadDataInput?.click();
});

loadDataInput?.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const stateKeys = Object.keys(state);
    if (!data.state || stateKeys.some((key) => !Number.isFinite(Number(data.state[key])))) {
      throw new Error('Invalid calculator data');
    }

    stateKeys.forEach((key) => {
      state[key] = Number(data.state[key]);
      const slider = document.querySelector(`input[data-key="${key}"]`);
      if (slider) {
        slider.value = state[key];
        setSliderFill(slider);
        updateReadout(key, state[key]);
      }
    });

    const settings = data.settings || {};
    if (languageSelect && ['en', 'es', 'fr'].includes(settings.language)) {
      languageSelect.value = settings.language;
      applyTranslations(settings.language);
    }
    if (timeUnitSelect && ['day', 'week', 'month'].includes(settings.timeUnit)) {
      timeUnitSelect.value = settings.timeUnit;
    }
    if (periodsInput && Number.isFinite(Number(settings.periods))) {
      periodsInput.value = Math.min(24, Math.max(1, Number(settings.periods)));
    }
    if (currencySelect && ['USD', 'EUR', 'GBP'].includes(settings.currency)) {
      currencySelect.value = settings.currency;
    }

    updateSummary();
    renderChart();
  } catch (error) {
    window.alert('Could not load calculator data.');
  } finally {
    event.target.value = '';
  }
});

function getXAxisLabel(unit, index) {
  const locale = getCurrentLocale();
  const pack = window.langPack && window.langPack[locale] ? window.langPack[locale] : window.langPack.en;
  const labelMap = {
    week: pack.week || 'Week',
    month: pack.month || 'Month',
    day: pack.day || 'Day'
  };

  const name = labelMap[unit] || 'Week';
  return `${name} ${index}`;
}

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
  firstPeriodLabel: document.getElementById('firstPeriodLabel'),
  firstPeriodProfit: document.getElementById('firstPeriodProfit'),
  finalPeriodLabel: document.getElementById('finalPeriodLabel'),
  retentionSummary: document.getElementById('retentionSummary'),
  roiSummary: document.getElementById('roiSummary')
};

const chartCanvas = document.getElementById('performanceChart');
const ctx = chartCanvas.getContext('2d');

function formatMoney(value) {
  const currency = currencySelect ? currencySelect.value : 'USD';
  const rate = currencyRates[currency] || 1;
  const converted = value * rate;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(converted);
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

function getPeriodSettings() {
  const unit = timeUnitSelect?.value || 'week';
  const periods = Math.min(24, Math.max(1, Number(periodsInput?.value) || 1));
  const weeksPerPeriod = { day: 1 / 7, week: 1, month: 52 / 12 }[unit] || 1;

  return { unit, periods, weeksPerPeriod };
}

function calculateSalesSeries() {
  const { periods, weeksPerPeriod } = getPeriodSettings();
  const values = [];

  for (let period = 1; period <= periods; period += 1) {
    const customers = state.launchingCustomers * Math.pow(
      1 + state.customerGrowthRate,
      period * weeksPerPeriod
    );
    const revenue = customers * state.averageResponseRate * state.revenuePerConversion * weeksPerPeriod;
    const operatingCosts = (state.fixedCosts + customers * state.variableCost) * weeksPerPeriod;
    const startingCost = period === 1 ? state.startingCost : 0;

    values.push({
      period,
      customers,
      revenue,
      expenses: operatingCosts + startingCost,
      profit: revenue - operatingCosts - startingCost
    });
  }

  return values;
}

function getPeriodLabel(key, unit, period) {
  const locale = getCurrentLocale();
  const pack = window.langPack && window.langPack[locale] ? window.langPack[locale] : window.langPack.en;
  const unitLabel = (pack[unit] || unit).toLowerCase();
  const template = pack[key] || `${key === 'profitWeek' ? 'Profit in' : 'At'} ${unitLabel} #${period}`;

  const label = template
    .replace(/week|semana|semaine/gi, unitLabel)
    .replace(/#\d+/, `#${period}`);

  if (locale === 'es') {
    return label.replace(/la mes|la día/gi, (match) => match.replace('la', 'el'));
  }

  if (locale === 'fr') {
    return label.replace(/la mois|la jour/gi, (match) => match.replace('la', 'le'));
  }

  return label;
}

function updateSummary() {
  const values = calculateSalesSeries();
  const firstPeriod = values[0];
  const finalPeriod = values[values.length - 1];
  const revenue = values.reduce((total, value) => total + value.revenue, 0);
  const expenses = values.reduce((total, value) => total + value.expenses, 0);
  const profit = revenue - expenses;
  const { unit, periods, weeksPerPeriod } = getPeriodSettings();
  const retention = Math.max(0, Math.pow(1 - state.customerChurnRate, periods * weeksPerPeriod));
  const roi = (profit / Math.max(1, expenses)) * 100;

  refs.firstPeriodLabel.textContent = getPeriodLabel('profitWeek', unit, 1);
  refs.firstPeriodProfit.textContent = formatMoney(firstPeriod.profit);
  refs.finalPeriodLabel.textContent = getPeriodLabel('atWeek', unit, periods);
  refs.customersSummary.textContent = Math.round(finalPeriod.customers).toLocaleString('en-US');
  refs.revenueSummary.textContent = formatMoney(revenue);
  refs.expensesSummary.textContent = formatMoney(expenses);
  refs.profitSummary.textContent = formatMoney(profit);
  refs.retentionSummary.textContent = formatPercent(retention);
  refs.roiSummary.textContent = formatPercent(roi / 100);
}

function renderChart() {
  const values = calculateSalesSeries();
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const padding = { top: 15, right: 12, bottom: 28, left: 28 };
  const { unit } = getPeriodSettings();
  const plotWidth = width - padding.left - padding.right;
  const getPointX = (index) => padding.left + (
    values.length === 1 ? plotWidth / 2 : (plotWidth / (values.length - 1)) * index
  );

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

  for (let i = 0; i <= values.length; i += 1) {
    const x = padding.left + ((width - padding.left - padding.right) / values.length) * i;
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
    const x = getPointX(index);
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
    const x = getPointX(index);
    const y = height - padding.bottom - ((val.profit - minProfit) / range) * (height - padding.top - padding.bottom);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#7d8ea2';
  ctx.font = '11px sans-serif';
  for (let i = 1; i <= values.length; i += 1) {
    const x = padding.left + ((width - padding.left - padding.right) / Math.max(values.length - 1, 1)) * (i - 1);
    ctx.fillText(getXAxisLabel(unit, i), x - 10, height - 8);
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

  const target = document.getElementById(labelMap[key]);
  if (!target) return;

  const formatMap = {
    customerGrowthRate: Number(value).toFixed(2),
    averageResponseRate: Number(value).toFixed(2),
    customerChurnRate: Number(value).toFixed(2),
    variableCost: Number(value).toFixed(1),
    launchingCustomers: String(Math.round(value)),
    revenuePerConversion: String(Math.round(value)),
    fixedCosts: String(Math.round(value)),
    startingCost: String(Math.round(value))
  };

  target.textContent = formatMap[key] ?? String(value);
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
    bindSlider(slider);
    slider.addEventListener('input', (event) => {
      bindSlider(event.target);
    });
  });
}

window.addEventListener('resize', renderChart);
applyTranslations(getCurrentLocale());
initSliders();
updateSummary();
renderChart();
