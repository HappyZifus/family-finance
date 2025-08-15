import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  setupPersonButtons();
  setupDateSelectors();
});

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
  buttons[0].click();
}

function setupDateSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  for (let m = 1; m <= 12; m++) {
    const op = document.createElement('option');
    op.value = m;
    op.textContent = m;
    if (m === currentMonth) op.selected = true;
    monthSelect.appendChild(op);
  }
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    const op = document.createElement('option');
    op.value = y;
    op.textContent = y;
    if (y === currentYear) op.selected = true;
    yearSelect.appendChild(op);
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

  renderTopStats(data);
  renderIncomeAndExpenses(data);
}

function renderTopStats(d) {
  document.getElementById('startCash').textContent = d.amount_start ?? 0;
  document.getElementById('endCash').textContent = d.amount_end ?? 0;
  document.getElementById('incomePercent').textContent = (d.income_percent?.toFixed(1) ?? 0) + '%';
  document.getElementById('totalExpenses').textContent = d.sum_expenses ?? 0;
  document.getElementById('fairShare').textContent = d.fair_share ?? 0;
  document.getElementById('difference').textContent = d.difference ?? 0;
}

function renderIncomeAndExpenses(d) {
  // Simplified: show totals as single line. You can expand later to list items.
  document.getElementById('incomeList').innerHTML =
    `<div>Sum: ${d.sum_income ?? 0}</div>`;
  document.getElementById('expenseList').innerHTML =
    `<div>Sum: ${d.sum_expenses ?? 0}</div>`;
}
