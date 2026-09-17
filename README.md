# Finance Calculator Hub 📈💳

A professional, fast, mobile-first suite of personal finance calculators built with semantic HTML5, modern CSS3, and vanilla JavaScript. Zero external backends, zero paid APIs, and 100% client-side execution.

---

## 🚀 Live GitHub Pages Deployment Guide

This project is structured so it can be hosted directly on **GitHub Pages** without any build step, bundler, or server setup.

### Quick Setup Steps:
1. **Push or Upload to GitHub:**
   - Commit all files (`index.html`, `css/`, `js/`, `.nojekyll`) to your repository on GitHub (e.g. `main` or `gh-pages` branch).
2. **Enable GitHub Pages:**
   - Open your GitHub repository in your web browser.
   - Click on **Settings** → **Pages** (under the "Code and automation" sidebar).
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` (or whichever branch your code is on) and the root folder (`/ (root)`).
     - Click **Save**.
3. **Your Site is Live:**
   - Within 1–2 minutes, GitHub Pages will deploy your site at `https://<username>.github.io/<repo-name>/`.

---

## 📁 Project File Structure

```text
finance-calculator-hub/
│
├── index.html                  # Main web application entrypoint (GitHub Pages ready)
├── .nojekyll                   # Prevents GitHub Pages from ignoring asset directories
│
├── css/
│   └── styles.css              # Custom mobile-first stylesheet (responsive grid, themes, cards)
│
├── js/
│   └── app.js                  # Vanilla JavaScript calculation engines, charts, and router
│
├── public/                     # Static mirror directory for web deployment packages
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
│
├── app/                        # Android companion app wrapper (Edge-to-Edge WebView)
│   ├── src/main/
│   │   ├── AndroidManifest.xml # Android manifest with adaptive icons
│   │   ├── assets/             # Bundled offline web application
│   │   │   ├── index.html
│   │   │   ├── css/styles.css
│   │   │   └── js/app.js
│   │   ├── java/com/example/
│   │   │   └── MainActivity.kt # Jetpack Compose WebView host with back-handler
│   │   └── res/                # M3 Adaptive icon assets & branding
│   └── build.gradle.kts
│
├── metadata.json               # Platform manifest
└── README.md                   # Documentation, mathematical formulas, and guide
```

---

## 🧮 Included Financial Calculators & Formulas

### 1. SIP Calculator (Systematic Investment Plan)
Calculates projected wealth and compounding returns from regular monthly mutual fund investments.
- **Formula:**
  $$FV = P \times \left[ \frac{(1 + i)^n - 1}{i} \right] \times (1 + i)$$
  - $P$: Monthly contribution
  - $i$: Monthly interest rate $(r / 12 / 100)$
  - $n$: Total installments $(Years \times 12)$
- **Key Details:** Total Invested, Estimated Returns (Wealth Gain), Maturity Amount, and Annual Growth Schedule.

### 2. EMI Calculator (Equated Monthly Installment)
Calculates monthly debt obligations and reducing balance loan interest.
- **Formula:**
  $$EMI = \frac{P \times r \times (1 + r)^n}{(1 + r)^n - 1}$$
  - $P$: Loan principal
  - $r$: Monthly rate $(R / 12 / 100)$
  - $n$: Total repayment months
- **Key Details:** Monthly EMI, Principal Borrowed, Total Interest Paid, Total Payment, and Amortization Schedule.

### 3. FD Calculator (Fixed Deposit)
Calculates maturity value and interest earnings across quarterly, monthly, semi-annual, or annual compounding frequencies.
- **Formula:**
  $$A = P \times \left(1 + \frac{r}{n}\right)^{n \times t}$$
  - $P$: Principal deposit
  - $r$: Annual nominal rate
  - $n$: Compounding periods per year (e.g., $4$ for quarterly)
  - $t$: Duration in years

### 4. Compound Interest Calculator
Simulates long-term exponential capital accumulation with optional ongoing monthly contributions.
- **Key Details:** Initial Principal, Total Additions, Total Compound Interest, Final Balance, and Annual Milestone Table.

### 5. GST Calculator (Goods & Services Tax)
Supports both GST Exclusive (adding tax to base prices) and GST Inclusive (reversing tax out of gross prices) with standard slabs (3%, 5%, 12%, 18%, 28%) and equal CGST/SGST split.
- **Exclusive:** $GST = (Base \times Rate) / 100$
- **Inclusive:** $Base = Gross / (1 + Rate / 100)$

### 6. Loan & Extra Payment Calculator
Analyzes standard loan amortization and quantifies the exact financial impact of extra monthly principal prepayments.
- **Key Details:** Monthly Outflow, Interest Savings, Total Cost of Loan, and Months Saved.

---

## 🔒 Privacy & Client-Side Security

- **Zero Tracking:** No analytics trackers, no ad beacons, no third-party scripts.
- **100% Client-Side:** Calculations run exclusively inside your browser's JavaScript engine (RAM). Financial data is never transmitted to any external server.
- **Universal Multi-Currency:** Dynamic formatting for INR (`₹`), USD (`$`), EUR (`€`), GBP (`£`), and JPY (`¥`).

---

## ⚠️ Financial Disclaimer

All results, projections, and calculations presented by **Finance Calculator Hub** are for informational and illustrative purposes only. They do not constitute certified financial, legal, investment, or tax advice. Actual loan terms, interest rates, tax deductions, and investment returns will vary based on financial institution policies, market conditions, and regional laws. Always verify calculations with your respective bank, lender, or certified financial advisor.
