/**
 * Finance Calculator Hub - Core Logic & Calculator Engines
 * Pure Vanilla JavaScript | Zero external libraries | 100% Client-side
 */

// Global State
const State = {
  currency: '₹', // Default currency
  currencyCode: 'INR',
  activeView: 'home',
  calculatorDefaults: {
    sip: { monthly: 10000, rate: 12, years: 10 },
    emi: { principal: 2500000, rate: 8.5, years: 20 },
    fd: { principal: 500000, rate: 7.1, years: 5, comp: '4' },
    compound: { principal: 200000, rate: 10, years: 10, monthly: 5000, comp: '12' },
    gst: { amount: 50000, rate: 18, mode: 'exclusive' },
    loan: { principal: 1500000, rate: 9.0, years: 15, extra: 0 }
  }
};

// Currency formats
const Currencies = {
  '₹': { symbol: '₹', locale: 'en-IN', code: 'INR' },
  '$': { symbol: '$', locale: 'en-US', code: 'USD' },
  '€': { symbol: '€', locale: 'de-DE', code: 'EUR' },
  '£': { symbol: '£', locale: 'en-GB', code: 'GBP' },
  '¥': { symbol: '¥', locale: 'ja-JP', code: 'JPY' }
};

// Formatter utility
function formatMoney(amount, showDecimals = false) {
  if (isNaN(amount) || amount === null || amount === undefined) return `${State.currency}0`;
  const curr = Currencies[State.currency] || Currencies['₹'];
  try {
    const formatted = new Intl.NumberFormat(curr.locale, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    }).format(Math.round(amount * 100) / 100);
    return `${State.currency} ${formatted}`;
  } catch (e) {
    return `${State.currency} ${amount.toFixed(showDecimals ? 2 : 0)}`;
  }
}

function updateCurrencyDisplays() {
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = State.currency;
  });
  // Recalculate all visible calculator cards or views
  calculateSIP();
  calculateEMI();
  calculateFD();
  calculateCompound();
  calculateGST();
  calculateLoan();
}

// -------------------------------------------------------------
// 1. SIP CALCULATOR ENGINE
// Formula: FV = P * [((1 + i)^n - 1) / i] * (1 + i)
// -------------------------------------------------------------
function calculateSIP() {
  const monthly = parseFloat(document.getElementById('sip-amount')?.value) || 0;
  const annualRate = parseFloat(document.getElementById('sip-rate')?.value) || 0;
  const years = parseFloat(document.getElementById('sip-years')?.value) || 0;

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  let totalInvestment = monthly * totalMonths;
  let futureValue = 0;

  if (monthlyRate === 0) {
    futureValue = totalInvestment;
  } else {
    futureValue = monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const estimatedReturns = Math.max(0, futureValue - totalInvestment);

  // Update UI Elements
  const totalValEl = document.getElementById('sip-total-value');
  const investedEl = document.getElementById('sip-invested-amount');
  const returnsEl = document.getElementById('sip-estimated-returns');

  if (totalValEl) totalValEl.textContent = formatMoney(futureValue);
  if (investedEl) investedEl.textContent = formatMoney(totalInvestment);
  if (returnsEl) returnsEl.textContent = formatMoney(estimatedReturns);

  // Update Chart
  drawDonutChart('sip-donut-chart', [
    { label: 'Invested', value: totalInvestment, color: 'var(--primary)' },
    { label: 'Returns', value: estimatedReturns, color: 'var(--success)' }
  ]);

  // Generate Year by Year breakdown
  const tableBody = document.getElementById('sip-schedule-body');
  if (tableBody) {
    let rowsHtml = '';
    let currentBalance = 0;
    for (let y = 1; y <= Math.min(years, 30); y++) {
      const monthsSoFar = y * 12;
      const investedSoFar = monthly * monthsSoFar;
      let bal = 0;
      if (monthlyRate === 0) {
        bal = investedSoFar;
      } else {
        bal = monthly * ((Math.pow(1 + monthlyRate, monthsSoFar) - 1) / monthlyRate) * (1 + monthlyRate);
      }
      const returnsSoFar = bal - investedSoFar;
      rowsHtml += `
        <tr>
          <td>Year ${y}</td>
          <td>${formatMoney(investedSoFar)}</td>
          <td>${formatMoney(returnsSoFar)}</td>
          <td><strong>${formatMoney(bal)}</strong></td>
        </tr>
      `;
    }
    tableBody.innerHTML = rowsHtml;
  }
}

function resetSIP() {
  const d = State.calculatorDefaults.sip;
  setInputValue('sip-amount', d.monthly);
  setInputValue('sip-amount-range', d.monthly);
  setInputValue('sip-rate', d.rate);
  setInputValue('sip-rate-range', d.rate);
  setInputValue('sip-years', d.years);
  setInputValue('sip-years-range', d.years);
  calculateSIP();
}

// -------------------------------------------------------------
// 2. EMI CALCULATOR ENGINE
// Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
// -------------------------------------------------------------
function calculateEMI() {
  const principal = parseFloat(document.getElementById('emi-principal')?.value) || 0;
  const annualRate = parseFloat(document.getElementById('emi-rate')?.value) || 0;
  const years = parseFloat(document.getElementById('emi-tenure')?.value) || 0;

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  let emi = 0;
  if (totalMonths <= 0 || principal <= 0) {
    emi = 0;
  } else if (monthlyRate === 0) {
    emi = principal / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    emi = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  // Update UI
  const emiValEl = document.getElementById('emi-monthly-val');
  const principalEl = document.getElementById('emi-principal-val');
  const interestEl = document.getElementById('emi-total-interest');
  const totalPayEl = document.getElementById('emi-total-payment');

  if (emiValEl) emiValEl.textContent = formatMoney(emi);
  if (principalEl) principalEl.textContent = formatMoney(principal);
  if (interestEl) interestEl.textContent = formatMoney(totalInterest);
  if (totalPayEl) totalPayEl.textContent = formatMoney(totalPayment);

  // Update Chart
  drawDonutChart('emi-donut-chart', [
    { label: 'Principal', value: principal, color: 'var(--primary)' },
    { label: 'Total Interest', value: totalInterest, color: 'var(--danger)' }
  ]);

  // Generate Amortization Preview Table (Yearly)
  const tableBody = document.getElementById('emi-schedule-body');
  if (tableBody) {
    let rowsHtml = '';
    let balance = principal;
    for (let y = 1; y <= Math.min(years, 30); y++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      for (let m = 1; m <= 12; m++) {
        if (balance <= 0) break;
        const interestMonth = balance * monthlyRate;
        const principalMonth = Math.min(balance, emi - interestMonth);
        yearlyInterest += interestMonth;
        yearlyPrincipal += principalMonth;
        balance -= principalMonth;
      }
      rowsHtml += `
        <tr>
          <td>Year ${y}</td>
          <td>${formatMoney(yearlyPrincipal)}</td>
          <td>${formatMoney(yearlyInterest)}</td>
          <td>${formatMoney(Math.max(0, balance))}</td>
        </tr>
      `;
      if (balance <= 0) break;
    }
    tableBody.innerHTML = rowsHtml;
  }
}

function resetEMI() {
  const d = State.calculatorDefaults.emi;
  setInputValue('emi-principal', d.principal);
  setInputValue('emi-principal-range', d.principal);
  setInputValue('emi-rate', d.rate);
  setInputValue('emi-rate-range', d.rate);
  setInputValue('emi-tenure', d.years);
  setInputValue('emi-tenure-range', d.years);
  calculateEMI();
}

// -------------------------------------------------------------
// 3. FD CALCULATOR ENGINE
// Formula: A = P * (1 + r / n)^(n * t)
// -------------------------------------------------------------
function calculateFD() {
  const principal = parseFloat(document.getElementById('fd-principal')?.value) || 0;
  const annualRate = parseFloat(document.getElementById('fd-rate')?.value) || 0;
  const years = parseFloat(document.getElementById('fd-tenure')?.value) || 0;
  const compFrequency = parseInt(document.getElementById('fd-compounding')?.value || '4', 10);

  const r = annualRate / 100;
  let maturity = 0;

  if (compFrequency === 0) {
    // Simple Interest
    const interest = (principal * annualRate * years) / 100;
    maturity = principal + interest;
  } else {
    // Compound Interest
    maturity = principal * Math.pow(1 + (r / compFrequency), compFrequency * years);
  }

  const interestEarned = Math.max(0, maturity - principal);

  const matEl = document.getElementById('fd-maturity-val');
  const prinEl = document.getElementById('fd-principal-val');
  const intEl = document.getElementById('fd-interest-val');

  if (matEl) matEl.textContent = formatMoney(maturity);
  if (prinEl) prinEl.textContent = formatMoney(principal);
  if (intEl) intEl.textContent = formatMoney(interestEarned);

  // Update Chart
  drawDonutChart('fd-donut-chart', [
    { label: 'Principal', value: principal, color: 'var(--primary)' },
    { label: 'Interest', value: interestEarned, color: 'var(--success)' }
  ]);
}

function resetFD() {
  const d = State.calculatorDefaults.fd;
  setInputValue('fd-principal', d.principal);
  setInputValue('fd-principal-range', d.principal);
  setInputValue('fd-rate', d.rate);
  setInputValue('fd-rate-range', d.rate);
  setInputValue('fd-tenure', d.years);
  setInputValue('fd-tenure-range', d.years);
  const sel = document.getElementById('fd-compounding');
  if (sel) sel.value = d.comp;
  calculateFD();
}

// -------------------------------------------------------------
// 4. COMPOUND INTEREST CALCULATOR
// Computes Base Principal + Recurring Monthly Contributions
// -------------------------------------------------------------
function calculateCompound() {
  const principal = parseFloat(document.getElementById('ci-principal')?.value) || 0;
  const annualRate = parseFloat(document.getElementById('ci-rate')?.value) || 0;
  const years = parseFloat(document.getElementById('ci-tenure')?.value) || 0;
  const monthlyAdd = parseFloat(document.getElementById('ci-monthly')?.value) || 0;
  const compPerYear = parseInt(document.getElementById('ci-compounding')?.value || '12', 10);

  const r = annualRate / 100;
  const totalMonths = Math.round(years * 12);
  const monthlyRate = r / 12;

  let balance = principal;
  let totalAdditions = 0;

  // Month-by-month compounding simulation with monthly additions
  const rows = [];
  for (let m = 1; m <= totalMonths; m++) {
    // Interest earned this month
    const interest = balance * monthlyRate;
    balance += interest;
    if (monthlyAdd > 0) {
      balance += monthlyAdd;
      totalAdditions += monthlyAdd;
    }
    if (m % 12 === 0) {
      rows.push({
        year: m / 12,
        invested: principal + totalAdditions,
        balance: balance
      });
    }
  }

  const totalDeposited = principal + totalAdditions;
  const totalInterest = Math.max(0, balance - totalDeposited);

  const totalBalEl = document.getElementById('ci-total-balance');
  const prinValEl = document.getElementById('ci-principal-val');
  const addValEl = document.getElementById('ci-additions-val');
  const intValEl = document.getElementById('ci-interest-val');

  if (totalBalEl) totalBalEl.textContent = formatMoney(balance);
  if (prinValEl) prinValEl.textContent = formatMoney(principal);
  if (addValEl) addValEl.textContent = formatMoney(totalAdditions);
  if (intValEl) intValEl.textContent = formatMoney(totalInterest);

  // Update Chart
  drawDonutChart('ci-donut-chart', [
    { label: 'Initial', value: principal, color: 'var(--primary)' },
    { label: 'Additions', value: totalAdditions, color: '#6366f1' },
    { label: 'Interest', value: totalInterest, color: 'var(--success)' }
  ]);

  // Schedule Table
  const tableBody = document.getElementById('ci-schedule-body');
  if (tableBody) {
    let rowsHtml = '';
    rows.forEach(item => {
      const intSoFar = item.balance - item.invested;
      rowsHtml += `
        <tr>
          <td>Year ${item.year}</td>
          <td>${formatMoney(item.invested)}</td>
          <td>${formatMoney(intSoFar)}</td>
          <td><strong>${formatMoney(item.balance)}</strong></td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;
  }
}

function resetCompound() {
  const d = State.calculatorDefaults.compound;
  setInputValue('ci-principal', d.principal);
  setInputValue('ci-principal-range', d.principal);
  setInputValue('ci-rate', d.rate);
  setInputValue('ci-rate-range', d.rate);
  setInputValue('ci-tenure', d.years);
  setInputValue('ci-tenure-range', d.years);
  setInputValue('ci-monthly', d.monthly);
  setInputValue('ci-monthly-range', d.monthly);
  const sel = document.getElementById('ci-compounding');
  if (sel) sel.value = d.comp;
  calculateCompound();
}

// -------------------------------------------------------------
// 5. GST CALCULATOR ENGINE
// Exclusive (Add GST) & Inclusive (Remove GST)
// -------------------------------------------------------------
let gstMode = 'exclusive';

function setGstMode(mode) {
  gstMode = mode;
  document.querySelectorAll('.gst-mode-opt').forEach(el => {
    if (el.dataset.mode === mode) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  const labelEl = document.getElementById('gst-amount-label');
  if (labelEl) {
    labelEl.textContent = mode === 'exclusive' ? 'Base Amount (Excluding GST)' : 'Total Invoice Amount (Including GST)';
  }
  calculateGST();
}

function setGstRate(rate) {
  setInputValue('gst-rate', rate);
  document.querySelectorAll('.gst-rate-chip').forEach(chip => {
    if (parseFloat(chip.dataset.rate) === rate) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  calculateGST();
}

function calculateGST() {
  const amount = parseFloat(document.getElementById('gst-amount')?.value) || 0;
  const rate = parseFloat(document.getElementById('gst-rate')?.value) || 0;

  let netAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  if (gstMode === 'exclusive') {
    // Add GST to base amount
    netAmount = amount;
    gstAmount = (amount * rate) / 100;
    totalAmount = netAmount + gstAmount;
  } else {
    // Remove GST from gross amount
    totalAmount = amount;
    netAmount = amount / (1 + (rate / 100));
    gstAmount = totalAmount - netAmount;
  }

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  const totalEl = document.getElementById('gst-total-amount');
  const netEl = document.getElementById('gst-net-amount');
  const gstEl = document.getElementById('gst-calculated-amount');
  const cgstEl = document.getElementById('gst-cgst-amount');
  const sgstEl = document.getElementById('gst-sgst-amount');

  if (totalEl) totalEl.textContent = formatMoney(totalAmount, true);
  if (netEl) netEl.textContent = formatMoney(netAmount, true);
  if (gstEl) gstEl.textContent = formatMoney(gstAmount, true);
  if (cgstEl) cgstEl.textContent = formatMoney(cgst, true);
  if (sgstEl) sgstEl.textContent = formatMoney(sgst, true);

  // Update Chart
  drawDonutChart('gst-donut-chart', [
    { label: 'Net Amount', value: netAmount, color: 'var(--primary)' },
    { label: 'GST Tax', value: gstAmount, color: 'var(--warning)' }
  ]);
}

function resetGST() {
  const d = State.calculatorDefaults.gst;
  setInputValue('gst-amount', d.amount);
  setGstMode(d.mode);
  setGstRate(d.rate);
  calculateGST();
}

// -------------------------------------------------------------
// 6. LOAN CALCULATOR ENGINE
// Supports loan terms and optional extra monthly prepayments
// -------------------------------------------------------------
function calculateLoan() {
  const principal = parseFloat(document.getElementById('loan-amount')?.value) || 0;
  const annualRate = parseFloat(document.getElementById('loan-rate')?.value) || 0;
  const years = parseFloat(document.getElementById('loan-years')?.value) || 0;
  const extraMonthly = parseFloat(document.getElementById('loan-extra')?.value) || 0;

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  let baseEmi = 0;
  if (monthlyRate === 0) {
    baseEmi = totalMonths > 0 ? principal / totalMonths : 0;
  } else if (totalMonths > 0) {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    baseEmi = (principal * monthlyRate * factor) / (factor - 1);
  }

  // Simulation with and without extra payments
  let balanceWithExtra = principal;
  let totalInterestWithExtra = 0;
  let monthsWithExtra = 0;
  const totalMonthlyPay = baseEmi + extraMonthly;

  while (balanceWithExtra > 0.01 && monthsWithExtra < 600) {
    monthsWithExtra++;
    const intMonth = balanceWithExtra * monthlyRate;
    totalInterestWithExtra += intMonth;
    const prinMonth = Math.min(balanceWithExtra, totalMonthlyPay - intMonth);
    balanceWithExtra -= prinMonth;
  }

  const standardTotalInterest = (baseEmi * totalMonths) - principal;
  const interestSaved = Math.max(0, standardTotalInterest - totalInterestWithExtra);
  const monthsSaved = Math.max(0, totalMonths - monthsWithExtra);

  // Update UI
  const monthlyPayEl = document.getElementById('loan-monthly-payment');
  const totalInterestEl = document.getElementById('loan-total-interest');
  const totalCostEl = document.getElementById('loan-total-cost');
  const savedBox = document.getElementById('loan-savings-box');
  const savedText = document.getElementById('loan-savings-text');

  if (monthlyPayEl) monthlyPayEl.textContent = formatMoney(totalMonthlyPay);
  if (totalInterestEl) totalInterestEl.textContent = formatMoney(totalInterestWithExtra);
  if (totalCostEl) totalCostEl.textContent = formatMoney(principal + totalInterestWithExtra);

  if (savedBox && savedText) {
    if (extraMonthly > 0 && interestSaved > 0) {
      savedBox.style.display = 'block';
      const yearsSavedStr = (monthsSaved / 12).toFixed(1);
      savedText.textContent = `By paying an extra ${formatMoney(extraMonthly)}/mo, you save ${formatMoney(interestSaved)} in interest and pay off your loan ${yearsSavedStr} years earlier!`;
    } else {
      savedBox.style.display = 'none';
    }
  }

  // Draw Chart
  drawDonutChart('loan-donut-chart', [
    { label: 'Principal', value: principal, color: 'var(--primary)' },
    { label: 'Interest', value: totalInterestWithExtra, color: 'var(--danger)' }
  ]);
}

function resetLoan() {
  const d = State.calculatorDefaults.loan;
  setInputValue('loan-amount', d.principal);
  setInputValue('loan-amount-range', d.principal);
  setInputValue('loan-rate', d.rate);
  setInputValue('loan-rate-range', d.rate);
  setInputValue('loan-years', d.years);
  setInputValue('loan-years-range', d.years);
  setInputValue('loan-extra', d.extra);
  calculateLoan();
}

// -------------------------------------------------------------
// SVG Donut Chart Renderer (Zero External Libraries)
// -------------------------------------------------------------
function drawDonutChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const total = data.reduce((acc, item) => acc + (item.value || 0), 0);
  if (total <= 0) {
    container.innerHTML = '<div style="color: var(--text-light); font-size: 0.8rem; padding: 2rem;">Enter values to see chart</div>';
    return;
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  let circlesHtml = '';
  let legendHtml = '';

  data.forEach(slice => {
    const sliceVal = slice.value || 0;
    const fraction = sliceVal / total;
    const strokeDash = fraction * circumference;
    const percentage = Math.round(fraction * 100);

    circlesHtml += `
      <circle
        cx="60"
        cy="60"
        r="${radius}"
        fill="transparent"
        stroke="${slice.color}"
        stroke-width="14"
        stroke-dasharray="${strokeDash} ${circumference - strokeDash}"
        stroke-dashoffset="${-cumulativeOffset}"
        style="transition: stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease;"
      />
    `;
    cumulativeOffset += strokeDash;

    legendHtml += `
      <div class="legend-item">
        <span class="legend-dot" style="background: ${slice.color};"></span>
        <span>${slice.label}: ${percentage}%</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="chart-container">
      <svg class="donut-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="14" opacity="0.3" />
        ${circlesHtml}
      </svg>
      <div class="chart-legend">
        ${legendHtml}
      </div>
    </div>
  `;
}

// Helper: sync input and range
function linkInputAndRange(inputId, rangeId, callback) {
  const inputEl = document.getElementById(inputId);
  const rangeEl = document.getElementById(rangeId);

  if (!inputEl || !rangeEl) return;

  inputEl.addEventListener('input', () => {
    rangeEl.value = inputEl.value;
    if (callback) callback();
  });

  rangeEl.addEventListener('input', () => {
    inputEl.value = rangeEl.value;
    if (callback) callback();
  });
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// -------------------------------------------------------------
// SPA Navigation & Routing
// -------------------------------------------------------------
function navigateTo(viewId) {
  const validViews = ['home', 'sip', 'emi', 'fd', 'compound', 'gst', 'loan', 'about', 'contact', 'privacy', 'terms'];
  const target = validViews.includes(viewId) ? viewId : 'home';
  State.activeView = target;

  // Show only active view
  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === `view-${target}`) {
      view.classList.add('active-view');
    } else {
      view.classList.remove('active-view');
    }
  });

  // Update nav links active state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === `#${target}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update quick pills active state
  document.querySelectorAll('.quick-pill').forEach(pill => {
    if (pill.getAttribute('href') === `#${target}`) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Close mobile nav drawer if open
  const navMenu = document.getElementById('nav-links');
  if (navMenu) navMenu.classList.remove('show');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update page title dynamically for SEO & clarity
  const titles = {
    home: 'Finance Calculator Hub - Fast, Free & Client-Side Financial Calculators',
    sip: 'SIP Calculator - Systematic Investment Plan Returns | Finance Hub',
    emi: 'EMI Calculator - Loan EMI, Interest & Amortization | Finance Hub',
    fd: 'Fixed Deposit (FD) Calculator - Interest & Maturity | Finance Hub',
    compound: 'Compound Interest Calculator - Recurring Growth | Finance Hub',
    gst: 'GST Calculator - Add & Remove GST with Tax Slabs | Finance Hub',
    loan: 'Loan Calculator - Payoff Schedule & Savings | Finance Hub',
    about: 'About Us - Mission & Methodology | Finance Calculator Hub',
    contact: 'Contact Us - Feedback & Inquiries | Finance Calculator Hub',
    privacy: 'Privacy Policy - Zero Tracking, 100% Client-Side | Finance Hub',
    terms: 'Terms of Use & Financial Disclaimer | Finance Calculator Hub'
  };
  if (titles[target]) {
    document.title = titles[target];
  }
}

// -------------------------------------------------------------
// Initialization & Event Listeners
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const navLinks = document.getElementById('nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Currency Selector
  const currSelect = document.getElementById('currency-select');
  if (currSelect) {
    currSelect.addEventListener('change', (e) => {
      State.currency = e.target.value;
      updateCurrencyDisplays();
    });
  }

  // Link Sliders with Number Inputs
  linkInputAndRange('sip-amount', 'sip-amount-range', calculateSIP);
  linkInputAndRange('sip-rate', 'sip-rate-range', calculateSIP);
  linkInputAndRange('sip-years', 'sip-years-range', calculateSIP);

  linkInputAndRange('emi-principal', 'emi-principal-range', calculateEMI);
  linkInputAndRange('emi-rate', 'emi-rate-range', calculateEMI);
  linkInputAndRange('emi-tenure', 'emi-tenure-range', calculateEMI);

  linkInputAndRange('fd-principal', 'fd-principal-range', calculateFD);
  linkInputAndRange('fd-rate', 'fd-rate-range', calculateFD);
  linkInputAndRange('fd-tenure', 'fd-tenure-range', calculateFD);
  const fdComp = document.getElementById('fd-compounding');
  if (fdComp) fdComp.addEventListener('change', calculateFD);

  linkInputAndRange('ci-principal', 'ci-principal-range', calculateCompound);
  linkInputAndRange('ci-rate', 'ci-rate-range', calculateCompound);
  linkInputAndRange('ci-tenure', 'ci-tenure-range', calculateCompound);
  linkInputAndRange('ci-monthly', 'ci-monthly-range', calculateCompound);
  const ciComp = document.getElementById('ci-compounding');
  if (ciComp) ciComp.addEventListener('change', calculateCompound);

  const gstAmount = document.getElementById('gst-amount');
  const gstRate = document.getElementById('gst-rate');
  if (gstAmount) gstAmount.addEventListener('input', calculateGST);
  if (gstRate) gstRate.addEventListener('input', calculateGST);

  linkInputAndRange('loan-amount', 'loan-amount-range', calculateLoan);
  linkInputAndRange('loan-rate', 'loan-rate-range', calculateLoan);
  linkInputAndRange('loan-years', 'loan-years-range', calculateLoan);
  const loanExtra = document.getElementById('loan-extra');
  if (loanExtra) loanExtra.addEventListener('input', calculateLoan);

  // Setup FAQ Accordion Toggles
  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (item) {
        item.classList.toggle('active');
      }
    });
  });

  // Setup Contact Form
  const contactForm = document.getElementById('contact-form');
  const contactAlert = document.getElementById('contact-alert');
  if (contactForm && contactAlert) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactAlert.classList.add('success');
      contactAlert.textContent = 'Thank you for reaching out! Your message has been recorded locally.';
      contactForm.reset();
    });
  }

  // Setup Hash Routing
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    navigateTo(hash);
  });

  // Initial Route Check
  const initialHash = window.location.hash.replace('#', '') || 'home';
  navigateTo(initialHash);

  // Initial calculation runs
  updateCurrencyDisplays();
});
