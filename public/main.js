import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  setupPersonButtons();
  setupDateSelectors();
});

// Person selection buttons
function setupPersonButtons() {
  const buttons = document.querySelectorAll('.person-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentPersonId = btn.dataset.id;
      loadData();
    });
  });
  buttons[0]?.click();
}

// Month/Year selectors
function setupDateSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  monthSelect.addEventListener('change', () => {
    currentMonth = +monthSelect.value;
    loadData();
  });
  yearSelect.addEventListener('change', () => {
    currentYear = +yearSelect.value;
    loadData();
  });
}

// Load from Supabase VIEW monthly_finance_2
async function loadData() {
  if (!currentPersonId) return;

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .single();

  if (error) {
    console.error(error);
    return;
  }
  renderData(data);
}

function renderData(d) {
  // Top stats
  document.getElementById('startCash').textContent = d.start_cash ?? 0;
  document.getElementById('endCash').textContent = d.end_cash ?? 0;
  document.getElementById('incomePercent').textContent = ((d.income_percent || 0).toFixed(1)) + '%';
  document.getElementById('totalExpenses').textContent = d.sum_expenses ?? 0;
  document.getElementById('fairShare').textContent = d.fair_share ?? 0;
  document.getElementById('difference').textContent = d.difference ?? 0;

  // Income & Expense Totals
  document.getElementById('incomeList').innerHTML = `<div>Total: ${d.sum_income ?? 0}</div>`;
  document.getElementById('expenseList').innerHTML = `<div>Total: ${d.sum_expenses ?? 0}</div>`;
}
