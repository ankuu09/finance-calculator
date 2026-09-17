/**
 * Finance Calculator Hub - Core Logic & Mathematical Engines
 * 100% Client-side | Zero Tracking | Bank-Standard Formulations
 */

// Global State
const State = {
  currency: '₹', // Default currency
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

// Currency definitions with corresponding locales and ISO codes
const Currencies = {
  '₹': { symbol: '₹', locale: 'en-IN', code: 'INR', name: 'Indian Rupee' },
  '$': { symbol: '$', locale: 'en-US', code: 'USD', name: 'US Dollar' },
  '€': { symbol: '€', locale: 'de-DE', code: 'EUR', name: 'Euro' },
  '£': { symbol: '£', locale: 'en-GB', code: 'GBP', name: 'British Pound' },
  '¥': { symbol: '¥', locale: 'ja-JP', code: 'JPY', name: 'Japanese Yen' }
};

// Load saved currency preference from localStorage
try {
  const savedCurrency = localStorage.getItem('fch_currency');
  if (savedCurrency && Currencies[savedCurrency]) {
    State.currency = savedCurrency;
  }
} catch (e) {
  // Graceful fallback if localStorage is disabled or restricted
}

/**
 * Formats a monetary amount using the selected currency's locale format.
 * Guarantees that NaN, Infinity, or undefined are never displayed.
 * Calculations directly use the entered amount in the chosen currency (no fake conversion).
 */
function formatMoney(amount, showDecimals = false) {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return `${State.currency} 0`;
  }

  // Prevent negative zero artifact (-0)
  const cleanAmount = Math.abs(amount) < 0.0001 ? 0 : amount;
  const curr = Currencies[State.currency] || Currencies['₹'];

  // Japanese Yen does not use fractional subunit decimals
  const decimals = curr.code === 'JPY' ? 0 : (showDecimals ? 2 : 0);

  try {
    const formatted = new Intl.NumberFormat(curr.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(cleanAmount);
    return `${State.currency} ${formatted}`;
  } catch (e) {
    return `${State.currency} ${cleanAmount.toFixed(decimals)}`;
  }
}

/**
 * Updates all currency symbols across input prefixes and recalculates visible calculators.
 */
function updateCurrencyDisplays() {
  // Sync all currency select elements on page
  document.querySelectorAll('.currency-select').forEach(select => {
    select.value = State.currency;
  });

  // Update all currency indicator spans
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = State.currency;
  });

  // Persist preference
  try {
    localStorage.setItem('fch_currency', State.currency);
  } catch (e) {}

  // Recalculate any calculator present on the current page/view
  if (document.getElementById('sip-amount')) calculateSIP();
  if (document.getElementById('emi-principal')) calculateEMI();
  if (document.getElementById('fd-principal')) calculateFD();
  if (document.getElementById('ci-principal')) calculateCompound();
  if (document.getElementById('gst-amount')) calculateGST();
  if (document.getElementById('loan-amount')) calculateLoan();
}

// -------------------------------------------------------------
// 1. SIP CALCULATOR ENGINE
// Formula: FV = P * [((1 + i)^n - 1) / i] * (1 + i)
// Where:
// P = Monthly investment
// i = Monthly interest rate (annual rate / 12 / 100)
// n = Total monthly installments (years * 12)
// -------------------------------------------------------------
function calculateSIP() {
  const amountEl = document.getElementById('sip-amount');
  if (!amountEl) return;

  const monthlyRaw = parseFloat(amountEl.value);
  const rateRaw = parseFloat(document.getElementById('sip-rate')?.value);
  const yearsRaw = parseFloat(document.getElementById('sip-years')?.value);

  const monthly = isNaN(monthlyRaw) || monthlyRaw < 0 ? 0 : monthlyRaw;
  const annualRate = isNaN(rateRaw) || rateRaw < 0 ? 0 : rateRaw;
  const years = isNaN(yearsRaw) || yearsRaw < 0 ? 0 : Math.min(yearsRaw, 50);

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  const totalInvestment = monthly * totalMonths;
  let futureValue = 0;

  if (totalInvestment === 0 || totalMonths === 0) {
    futureValue = 0;
  } else if (monthlyRate === 0) {
    futureValue = totalInvestment;
  } else {
    futureValue = monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  if (!isFinite(futureValue) || futureValue < 0) {
    futureValue = totalInvestment;
  }

  const estimatedReturns = Math.max(0, futureValue - totalInvestment);

  // Update UI Elements
  const totalValEl = document.getElementById('sip-total-value');
  const investedEl = document.getElementById('sip-invested-amount');
  const returnsEl = document.getElementById('sip-estimated-returns');

  if (totalValEl) totalValEl.textContent = formatMoney(futureValue);
  if (investedEl) investedEl.textContent = formatMoney(totalInvestment);
  if (returnsEl) returnsEl.textContent = formatMoney(estimatedReturns);

  // Update Donut Chart
  drawDonutChart('sip-donut-chart', [
    { label: 'Invested', value: totalInvestment, color: 'var(--primary)' },
    { label: 'Est. Returns', value: estimatedReturns, color: 'var(--success)' }
  ]);

  // Generate Year-by-Year Growth Table
  const tableBody = document.getElementById('sip-schedule-body');
  if (tableBody) {
    let rowsHtml = '';
    const maxYearsToDisplay = Math.min(Math.floor(years), 30);

    for (let y = 1; y <= maxYearsToDisplay; y++) {
      const monthsSoFar = y * 12;
      const investedSoFar = monthly * monthsSoFar;
      let bal = 0;
      if (monthlyRate === 0) {
        bal = investedSoFar;
      } else {
        bal = monthly * ((Math.pow(1 + monthlyRate, monthsSoFar) - 1) / monthlyRate) * (1 + monthlyRate);
      }
      if (!isFinite(bal)) bal = investedSoFar;
      const returnsSoFar = Math.max(0, bal - investedSoFar);

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
// Formula: E = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
// Where:
// P = Loan principal
// r = Monthly interest rate (annual rate / 12 / 100)
// n = Number of monthly installments (years * 12)
// -------------------------------------------------------------
function calculateEMI() {
  const principalEl = document.getElementById('emi-principal');
  if (!principalEl) return;

  const principalRaw = parseFloat(principalEl.value);
  const rateRaw = parseFloat(document.getElementById('emi-rate')?.value);
  const yearsRaw = parseFloat(document.getElementById('emi-tenure')?.value);

  const principal = isNaN(principalRaw) || principalRaw < 0 ? 0 : principalRaw;
  const annualRate = isNaN(rateRaw) || rateRaw < 0 ? 0 : rateRaw;
  const years = isNaN(yearsRaw) || yearsRaw < 0 ? 0 : Math.min(yearsRaw, 40);

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  let emi = 0;
  if (totalMonths <= 0 || principal <= 0) {
    emi = 0;
  } else if (monthlyRate === 0) {
    emi = principal / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    if (!isFinite(factor) || factor <= 1) {
      emi = principal / totalMonths;
    } else {
      emi = (principal * monthlyRate * factor) / (factor - 1);
    }
  }

  if (!isFinite(emi) || emi < 0) emi = 0;

  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  // Update UI Elements
  const emiValEl = document.getElementById('emi-monthly-val');
  const prinEl = document.getElementById('emi-principal-val');
  const interestEl = document.getElementById('emi-total-interest');
  const totalPayEl = document.getElementById('emi-total-payment');

  if (emiValEl) emiValEl.textContent = formatMoney(emi);
  if (prinEl) prinEl.textContent = formatMoney(principal);
  if (interestEl) interestEl.textContent = formatMoney(totalInterest);
  if (totalPayEl) totalPayEl.textContent = formatMoney(totalPayment);

  // Update Donut Chart
  drawDonutChart('emi-donut-chart', [
    { label: 'Principal', value: principal, color: 'var(--primary)' },
    { label: 'Total Interest', value: totalInterest, color: 'var(--danger)' }
  ]);

  // Generate Amortization Table (Yearly)
  const tableBody = document.getElementById('emi-schedule-body');
  if (tableBody) {
    let rowsHtml = '';
    let balance = principal;
    const maxYears = Math.min(Math.floor(years), 30);

    for (let y = 1; y <= maxYears; y++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;

      for (let m = 1; m <= 12; m++) {
        if (balance <= 0.01) break;
        const interestMonth = balance * monthlyRate;
        const principalMonth = Math.min(balance, emi - interestMonth);
        yearlyInterest += interestMonth;
        yearlyPrincipal += principalMonth;
        balance = Math.max(0, balance - principalMonth);
      }

      rowsHtml += `
        <tr>
          <td>Year ${y}</td>
          <td>${formatMoney(yearlyPrincipal)}</td>
          <td>${formatMoney(yearlyInterest)}</td>
          <td>${formatMoney(Math.max(0, balance))}</td>
        </tr>
      `;

      if (balance <= 0.01) break;
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
// 3. FIXED DEPOSIT (FD) CALCULATOR ENGINE
// Formula: A = P * (1 + r / n)^(n * t)
// Where:
// P = Principal deposit
// r = Annual nominal interest rate (decimal)
// n = Compounding periods per year (Quarterly = 4)
// t = Duration in years
// -------------------------------------------------------------
function calculateFD() {
  const principalEl = document.getElementById('fd-principal');
  if (!principalEl) return;

  const principalRaw = parseFloat(principalEl.value);
  const rateRaw = parseFloat(document.getElementById('fd-rate')?.value);
  const yearsRaw = parseFloat(document.getElementById('fd-tenure')?.value);
  const compFrequency = parseInt(document.getElementById('fd-compounding')?.value || '4', 10);

  const principal = isNaN(principalRaw) || principalRaw < 0 ? 0 : principalRaw;
  const annualRate = isNaN(rateRaw) || rateRaw < 0 ? 0 : rateRaw;
  const years = isNaN(yearsRaw) || yearsRaw < 0 ? 0 : Math.min(yearsRaw, 30);

  const r = annualRate / 100;
  let maturity = 0;

  if (principal <= 0 || years <= 0) {
    maturity = principal;
  } else if (compFrequency === 0 || r === 0) {
    // Simple Interest
    const simpleInterest = (principal * annualRate * years) / 100;
    maturity = principal + simpleInterest;
  } else {
    // Compound Interest
    maturity = principal * Math.pow(1 + (r / compFrequency), compFrequency * years);
  }

  if (!isFinite(maturity) || maturity < principal) {
    maturity = principal;
  }

  const interestEarned = Math.max(0, maturity - principal);

  const matEl = document.getElementById('fd-maturity-val');
  const prinEl = document.getElementById('fd-principal-val');
  const intEl = document.getElementById('fd-interest-val');

  if (matEl) matEl.textContent = formatMoney(maturity);
  if (prinEl) prinEl.textContent = formatMoney(principal);
  if (intEl) intEl.textContent = formatMoney(interestEarned);

  // Update Donut Chart
  drawDonutChart('fd-donut-chart', [
    { label: 'Principal Deposit', value: principal, color: 'var(--primary)' },
    { label: 'Interest Earned', value: interestEarned, color: 'var(--success)' }
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
// Computes Base Principal + Optional Recurring Monthly Contributions
// -------------------------------------------------------------
function calculateCompound() {
  const principalEl = document.getElementById('ci-principal');
  if (!principalEl) return;

  const principalRaw = parseFloat(principalEl.value);
  const rateRaw = parseFloat(document.getElementById('ci-rate')?.value);
  const yearsRaw = parseFloat(document.getElementById('ci-tenure')?.value);
  const monthlyAddRaw = parseFloat(document.getElementById('ci-monthly')?.value);

  const principal = isNaN(principalRaw) || principalRaw < 0 ? 0 : principalRaw;
  const annualRate = isNaN(rateRaw) || rateRaw < 0 ? 0 : rateRaw;
  const years = isNaN(yearsRaw) || yearsRaw < 0 ? 0 : Math.min(yearsRaw, 50);
  const monthlyAdd = isNaN(monthlyAddRaw) || monthlyAddRaw < 0 ? 0 : monthlyAddRaw;

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  let balance = principal;
  let totalAdditions = 0;
  const rows = [];

  for (let m = 1; m <= totalMonths; m++) {
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

  if (!isFinite(balance) || balance < 0) {
    balance = principal + totalAdditions;
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

  // Update Donut Chart
  drawDonutChart('ci-donut-chart', [
    { label: 'Initial Principal', value: principal, color: 'var(--primary)' },
    { label: 'Monthly Additions', value: totalAdditions, color: '#6366f1' },
    { label: 'Compound Interest', value: totalInterest, color: 'var(--success)' }
  ]);

  // Trajectory Table
  const tableBody = document.getElementById('ci-schedule-body');
  if (tableBody) {
    let rowsHtml = '';
    rows.forEach(item => {
      const intSoFar = Math.max(0, item.balance - item.invested);
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
  const amountEl = document.getElementById('gst-amount');
  if (!amountEl) return;

  const amountRaw = parseFloat(amountEl.value);
  const rateRaw = parseFloat(document.getElementById('gst-rate')?.value);

  const amount = isNaN(amountRaw) || amountRaw < 0 ? 0 : amountRaw;
  const rate = isNaN(rateRaw) || rateRaw < 0 ? 0 : rateRaw;

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
    netAmount = rate > 0 ? (amount / (1 + (rate / 100))) : amount;
    gstAmount = Math.max(0, totalAmount - netAmount);
  }

  if (!isFinite(totalAmount)) totalAmount = 0;
  if (!isFinite(netAmount)) netAmount = 0;
  if (!isFinite(gstAmount)) gstAmount = 0;

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

  // Update Donut Chart
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
// 6. LOAN & EXTRA PAYMENT CALCULATOR
// Evaluates standard amortization and interest saved via prepayments
// -------------------------------------------------------------
function calculateLoan() {
  const loanEl = document.getElementById('loan-amount');
  if (!loanEl) return;

  const principalRaw = parseFloat(loanEl.value);
  const rateRaw = parseFloat(document.getElementById('loan-rate')?.value);
  const yearsRaw = parseFloat(document.getElementById('loan-years')?.value);
  const extraMonthlyRaw = parseFloat(document.getElementById('loan-extra')?.value);

  const principal = isNaN(principalRaw) || principalRaw < 0 ? 0 : principalRaw;
  const annualRate = isNaN(rateRaw) || rateRaw < 0 ? 0 : rateRaw;
  const years = isNaN(yearsRaw) || yearsRaw < 0 ? 0 : Math.min(yearsRaw, 40);
  const extraMonthly = isNaN(extraMonthlyRaw) || extraMonthlyRaw < 0 ? 0 : extraMonthlyRaw;

  const totalMonths = Math.round(years * 12);
  const monthlyRate = (annualRate / 100) / 12;

  let baseEmi = 0;
  if (principal <= 0 || totalMonths <= 0) {
    baseEmi = 0;
  } else if (monthlyRate === 0) {
    baseEmi = principal / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    baseEmi = (principal * monthlyRate * factor) / (factor - 1);
  }

  if (!isFinite(baseEmi)) baseEmi = 0;

  // Simulation with extra payments
  let balanceWithExtra = principal;
  let totalInterestWithExtra = 0;
  let monthsWithExtra = 0;
  const totalMonthlyPay = baseEmi + extraMonthly;

  const maxSimulationMonths = 1200; // 100 years guard
  while (balanceWithExtra > 0.01 && monthsWithExtra < maxSimulationMonths) {
    monthsWithExtra++;
    const intMonth = balanceWithExtra * monthlyRate;
    totalInterestWithExtra += intMonth;

    // Principal portion paid this month
    const prinMonth = Math.min(balanceWithExtra, Math.max(0, totalMonthlyPay - intMonth));
    balanceWithExtra -= prinMonth;

    // Safety guard: if payment doesn't even cover monthly interest, break to prevent infinite loop
    if (totalMonthlyPay <= intMonth && balanceWithExtra > 0) {
      break;
    }
  }

  const standardTotalInterest = Math.max(0, (baseEmi * totalMonths) - principal);
  const interestSaved = Math.max(0, standardTotalInterest - totalInterestWithExtra);
  const monthsSaved = Math.max(0, totalMonths - monthsWithExtra);

  // Update UI Elements
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
      savedText.textContent = `By prepaying ${formatMoney(extraMonthly)} extra each month, you save ${formatMoney(interestSaved)} in interest and extinguish your debt ${yearsSavedStr} years earlier.`;
    } else {
      savedBox.style.display = 'none';
    }
  }

  // Draw Chart
  drawDonutChart('loan-donut-chart', [
    { label: 'Principal', value: principal, color: 'var(--primary)' },
    { label: 'Total Interest', value: totalInterestWithExtra, color: 'var(--danger)' }
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

  const total = data.reduce((acc, item) => acc + (Math.max(0, item.value) || 0), 0);
  if (total <= 0) {
    container.innerHTML = '<div style="color: var(--text-light); font-size: 0.85rem; padding: 2rem; text-align: center;">Enter values to view distribution chart</div>';
    return;
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  let circlesHtml = '';
  let legendHtml = '';

  data.forEach(slice => {
    const sliceVal = Math.max(0, slice.value || 0);
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
        style="transition: stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease;"
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
      <svg class="donut-svg" viewBox="0 0 120 120" role="img" aria-label="Financial Breakdown Donut Chart">
        <circle cx="60" cy="60" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="14" opacity="0.3" />
        ${circlesHtml}
      </svg>
      <div class="chart-legend">
        ${legendHtml}
      </div>
    </div>
  `;
}

// Helper: sync input and range sliders
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
// SPA Navigation & Multi-View Router (When on index.html)
// -------------------------------------------------------------
function navigateTo(viewId) {
  const validViews = ['home', 'sip', 'emi', 'fd', 'compound', 'gst', 'loan', 'about', 'contact', 'privacy', 'terms'];
  const target = validViews.includes(viewId) ? viewId : 'home';
  State.activeView = target;

  const targetView = document.getElementById(`view-${target}`);
  if (!targetView) {
    // If we're on a standalone page, standard browser navigation applies
    return;
  }

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
    const href = link.getAttribute('href');
    if (href === `#${target}` || href === `${target}-calculator.html` || (target === 'home' && (href === '#home' || href === 'index.html'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update quick pills active state
  document.querySelectorAll('.quick-pill').forEach(pill => {
    const href = pill.getAttribute('href');
    if (href === `#${target}` || href === `${target}-calculator.html`) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Close mobile nav drawer if open
  const navMenu = document.getElementById('nav-links');
  if (navMenu) navMenu.classList.remove('show');

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update document title
  const titles = {
    home: 'Free Online Financial Calculators - Finance Calculator Hub',
    sip: 'SIP Calculator - Systematic Investment Plan Returns | Finance Hub',
    emi: 'EMI Calculator - Loan EMI, Interest & Amortization | Finance Hub',
    fd: 'Fixed Deposit (FD) Calculator - Interest & Maturity | Finance Hub',
    compound: 'Compound Interest Calculator - Multi-Year Growth | Finance Hub',
    gst: 'GST Calculator - Add & Remove GST with Tax Slabs | Finance Hub',
    loan: 'Loan Calculator - Payoff Schedule & Prepayment Savings | Finance Hub',
    about: 'About Us - Educational Mission & Methodology | Finance Calculator Hub',
    contact: 'Contact Us - Feedback & Inquiries | Finance Calculator Hub',
    privacy: 'Privacy Policy - 100% Client-Side Privacy | Finance Hub',
    terms: 'Terms of Service & Financial Estimation Disclaimer | Finance Hub'
  };

  if (titles[target]) {
    document.title = titles[target];
  }
}

// -------------------------------------------------------------
// Copy Text Utility
// -------------------------------------------------------------
function copyToClipboard(text, btnElement, successMsg = 'Copied!') {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      const origText = btnElement.innerHTML;
      btnElement.innerHTML = `✓ ${successMsg}`;
      setTimeout(() => { btnElement.innerHTML = origText; }, 2000);
    });
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      const origText = btnElement.innerHTML;
      btnElement.innerHTML = `✓ ${successMsg}`;
      setTimeout(() => { btnElement.innerHTML = origText; }, 2000);
    } catch (err) {}
    document.body.removeChild(textArea);
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
      const isExpanded = navLinks.classList.toggle('show');
      toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }

  // Currency Selector Syncing
  document.querySelectorAll('.currency-select').forEach(select => {
    select.value = State.currency;
    select.addEventListener('change', (e) => {
      State.currency = e.target.value;
      updateCurrencyDisplays();
    });
  });

  // Link Sliders with Inputs across all calculators
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
        const isActive = item.classList.toggle('active');
        btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      }
    });
  });

  // Setup Static Contact Form (Transparent, No fake claims)
  const contactForm = document.getElementById('contact-form');
  const contactAlert = document.getElementById('contact-alert');
  if (contactForm && contactAlert) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = encodeURIComponent(document.getElementById('contact-subject')?.value || 'Finance Calculator Inquiry');
      const message = encodeURIComponent(document.getElementById('contact-message')?.value || '');
      const mailtoUri = `mailto:contact@financecalculatorhub.com?subject=${subject}&body=${message}`;
      
      contactAlert.classList.add('success');
      contactAlert.style.display = 'block';
      contactAlert.innerHTML = `
        <strong>Message Prepared!</strong> As this site operates 100% statically on GitHub Pages without server storage, 
        <a href="${mailtoUri}" style="font-weight: 700; text-decoration: underline;">click here to send your inquiry directly via your email app</a>.
      `;
    });
  }

  // Setup Hash Routing (on pages that contain view containers)
  if (document.getElementById('view-home')) {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      navigateTo(hash);
    });

    const initialHash = window.location.hash.replace('#', '') || 'home';
    navigateTo(initialHash);
  }

  // Initial currency and calculation run
  updateCurrencyDisplays();
});
