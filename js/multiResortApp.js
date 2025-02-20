 /* multiResortApp.js
   Multi-resort, 12-month model for a 2.5-room apartment across 6 ski resorts.
   Uses separate input fields for each month’s ADR (e.g. engADRJan … engADRDec)
   and a new table for monthly occupancy (IDs: occJan … occDec).
*/

// Attach the main function to the global scope.
window.calculateModelNew = calculateModelNew;

function calculateModelNew() {
  console.log("calculateModelNew invoked with monthly occupancy columns.");

  // --------------------------------------------------------------------------
  // Helper: Format numbers with commas & fixed decimals
  // --------------------------------------------------------------------------
  function formatNumber(num, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }

  // --------------------------------------------------------------------------
  // 1) Read Global Financial Inputs
  // --------------------------------------------------------------------------
  const downPaymentPerc = parseFloat(document.getElementById('downPaymentPerc').value) || 20;
  const interestRate = parseFloat(document.getElementById('interestRate').value) || 1.5;
  const expenseRate = parseFloat(document.getElementById('expenseRate').value) || 25;
  const userExpenseRate = expenseRate / 100.0;

  // --------------------------------------------------------------------------
  // 2) Parse Monthly Occupancy from individual fields (columns)
  // --------------------------------------------------------------------------
  function parseMonthlyOccupancy() {
    return [
      (parseFloat(document.getElementById("occJan").value) || 0) / 100,
      (parseFloat(document.getElementById("occFeb").value) || 0) / 100,
      (parseFloat(document.getElementById("occMar").value) || 0) / 100,
      (parseFloat(document.getElementById("occApr").value) || 0) / 100,
      (parseFloat(document.getElementById("occMay").value) || 0) / 100,
      (parseFloat(document.getElementById("occJun").value) || 0) / 100,
      (parseFloat(document.getElementById("occJul").value) || 0) / 100,
      (parseFloat(document.getElementById("occAug").value) || 0) / 100,
      (parseFloat(document.getElementById("occSep").value) || 0) / 100,
      (parseFloat(document.getElementById("occOct").value) || 0) / 100,
      (parseFloat(document.getElementById("occNov").value) || 0) / 100,
      (parseFloat(document.getElementById("occDec").value) || 0) / 100
    ];
  }
  const occupancyRates = parseMonthlyOccupancy();

  // Standard days in each month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // --------------------------------------------------------------------------
  // 3) Parse Resort-Specific Data from a Single Table
  //    Each resort has a Price per m² and 12 monthly ADR values (from separate inputs)
  // --------------------------------------------------------------------------
  function parseMonthlyADR(prefix) {
    return [
      parseFloat(document.getElementById(prefix + "Jan").value) || 0,
      parseFloat(document.getElementById(prefix + "Feb").value) || 0,
      parseFloat(document.getElementById(prefix + "Mar").value) || 0,
      parseFloat(document.getElementById(prefix + "Apr").value) || 0,
      parseFloat(document.getElementById(prefix + "May").value) || 0,
      parseFloat(document.getElementById(prefix + "Jun").value) || 0,
      parseFloat(document.getElementById(prefix + "Jul").value) || 0,
      parseFloat(document.getElementById(prefix + "Aug").value) || 0,
      parseFloat(document.getElementById(prefix + "Sep").value) || 0,
      parseFloat(document.getElementById(prefix + "Oct").value) || 0,
      parseFloat(document.getElementById(prefix + "Nov").value) || 0,
      parseFloat(document.getElementById(prefix + "Dec").value) || 0
    ];
  }

  const resorts = [
    {
      name: "Engelberg",
      pricePerM2: parseFloat(document.getElementById("engPrice").value) || 11300,
      adrArray: parseMonthlyADR("engADR")
    },
    {
      name: "Interlaken",
      pricePerM2: parseFloat(document.getElementById("intPrice").value) || 10000,
      adrArray: parseMonthlyADR("intADR")
    },
    {
      name: "Zermatt",
      pricePerM2: parseFloat(document.getElementById("zerPrice").value) || 18000,
      adrArray: parseMonthlyADR("zerADR")
    },
    {
      name: "Verbier",
      pricePerM2: parseFloat(document.getElementById("verPrice").value) || 16000,
      adrArray: parseMonthlyADR("verADR")
    },
    {
      name: "Davos",
      pricePerM2: parseFloat(document.getElementById("davPrice").value) || 15000,
      adrArray: parseMonthlyADR("davADR")
    },
    {
      name: "Laax",
      pricePerM2: parseFloat(document.getElementById("laaxPrice").value) || 14000,
      adrArray: parseMonthlyADR("laaxADR")
    }
  ];

  // --------------------------------------------------------------------------
  // 4) Set Apartment Size (Fixed for 2.5-room)
  // --------------------------------------------------------------------------
  const aptSize = 60;

  // --------------------------------------------------------------------------
  // 5) Compute Annual Revenue & Monthly Details
  // --------------------------------------------------------------------------
  function computeAnnualRevenue(adrArray, occArray) {
    let totalGross = 0;
    let totalBooked = 0;
    let monthlyDetails = [];
    for (let i = 0; i < 12; i++) {
      const bookedNights = daysInMonth[i] * (occArray[i] || 0);
      const gross = bookedNights * (adrArray[i] || 0);
      monthlyDetails.push({
        month: new Date(0, i).toLocaleString('default', { month: 'long' }),
        days: daysInMonth[i],
        occupancyPerc: (occArray[i] || 0) * 100,
        adr: adrArray[i] || 0,
        booked: bookedNights,
        gross: gross
      });
      totalGross += gross;
      totalBooked += bookedNights;
    }
    const averageADR = (totalBooked > 0) ? (totalGross / totalBooked) : 0;
    return { totalGross, totalBooked, averageADR, monthlyDetails };
  }

  // --------------------------------------------------------------------------
  // 6) Compute Model for Each Resort
  // --------------------------------------------------------------------------
  function computeResort(resort) {
    const purchasePrice = aptSize * resort.pricePerM2;
    const downPayment = purchasePrice * (downPaymentPerc / 100);
    const financed = purchasePrice - downPayment;

    const { totalGross, totalBooked, averageADR, monthlyDetails } =
      computeAnnualRevenue(resort.adrArray, occupancyRates);

    const NOI = totalGross * (1 - userExpenseRate);
    const interest = financed * (interestRate / 100);
    const cashFlow = NOI - interest;
    const cashOnCash = (downPayment > 0) ? (cashFlow / downPayment) * 100 : 0;
    const capRate = (purchasePrice > 0) ? (NOI / purchasePrice) * 100 : 0;

    return {
      name: resort.name,
      purchasePrice, downPayment, financed,
      totalGross, totalBooked, averageADR,
      NOI, interest, cashFlow, cashOnCash, capRate,
      monthlyDetails
    };
  }
  const results = resorts.map(r => computeResort(r));

  // --------------------------------------------------------------------------
  // 7) Build Monthly Breakdown Table for Each Resort
  // --------------------------------------------------------------------------
  function buildMonthlyBreakdownTable(r) {
    let html = `<h3>${r.name} - 12-Month Breakdown</h3>
      <table class="results-table">
        <tr>
          <th>Month</th>
          <th>Days</th>
          <th>Occupancy (%)</th>
          <th>ADR (CHF)</th>
          <th>Booked Nights</th>
          <th>Gross Revenue (CHF)</th>
        </tr>`;
    r.monthlyDetails.forEach(m => {
      html += `<tr>
          <td>${m.month}</td>
          <td>${formatNumber(m.days)}</td>
          <td>${formatNumber(m.occupancyPerc, 0)}%</td>
          <td>${formatNumber(m.adr, 0)}</td>
          <td>${formatNumber(m.booked, 0)}</td>
          <td>${formatNumber(m.gross, 0)}</td>
        </tr>`;
    });
    html += `<tr>
          <td colspan="5"><strong>Total Annual Gross Revenue</strong></td>
          <td><strong>${formatNumber(r.totalGross, 0)}</strong></td>
        </tr>
        <tr>
          <td colspan="5"><strong>Average ADR (CHF/night)</strong></td>
          <td><strong>${formatNumber(r.averageADR, 2)}</strong></td>
        </tr>
      </table>`;
    return html;
  }
  let monthlyOutput = "";
  results.forEach(r => {
    monthlyOutput += buildMonthlyBreakdownTable(r);
  });

  // --------------------------------------------------------------------------
  // 8) Build Comparison Table Across Resorts
  // --------------------------------------------------------------------------
  function buildComparisonTable(arr) {
    let html = `
      <table class="results-table">
        <tr>
          <th>Parameter</th>
          ${arr.map(x => `<th>${x.name}</th>`).join('')}
        </tr>
        <tr>
          <td>Purchase Price (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.purchasePrice)}</td>`).join('')}
        </tr>
        <tr>
          <td>Down Payment (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.downPayment)}</td>`).join('')}
        </tr>
        <tr>
          <td>Financed Amount (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.financed)}</td>`).join('')}
        </tr>
        <tr>
          <td>Annual Gross Revenue (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.totalGross)}</td>`).join('')}
        </tr>
        <tr>
          <td>NOI (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.NOI)}</td>`).join('')}
        </tr>
        <tr>
          <td>Mortgage Interest (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.interest)}</td>`).join('')}
        </tr>
        <tr>
          <td>Cash Flow (CHF)</td>
          ${arr.map(x => `<td>${formatNumber(x.cashFlow)}</td>`).join('')}
        </tr>
        <tr>
          <td>Cash-on-Cash ROI (%)</td>
          ${arr.map(x => `<td>${formatNumber(x.cashOnCash, 2)}%</td>`).join('')}
        </tr>
        <tr>
          <td>Cap Rate (%)</td>
          ${arr.map(x => `<td>${formatNumber(x.capRate, 2)}%</td>`).join('')}
        </tr>
      </table>`;
    return html;
  }
  const comparisonTable = buildComparisonTable(results);

  // --------------------------------------------------------------------------
  // 9) Combine outputs, store in localStorage, and redirect to results page
  // --------------------------------------------------------------------------
  const finalOutput = monthlyOutput + comparisonTable;
  localStorage.setItem("seasonBreakdownResults", monthlyOutput);
  localStorage.setItem("baseResults", comparisonTable);
  localStorage.setItem("investmentResults", finalOutput);
  window.location.href = "resultsMultiResort.html";
}
