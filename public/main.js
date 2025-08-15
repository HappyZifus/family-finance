import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

const totalExpensesInput = document.getElementById('totalExpenses');

// Initialize selectors
document.addEventListener('DOMContentLoaded', () => {
  setupPersonSelectors();
  setupMonthYearSelectors();
  loadMonthYearOptions();
});

// Person selection
function setupPersonSelectors() {
  const persons = document.querySelectorAll('.selector-block');
  persons.forEach(btn => {
    btn.addEventListener('click', () => {
      persons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Map name to user_id
      if (btn.id === 'personLesha') currentPersonId = 'a833b039-f440-4474-b566-3333e73398c8';
      else if (btn.id === 'personLena') currentPersonId = '5148e3c8-adab-484c-975c-f2f5b494fb4f';

      loadData();
      loadTotalExpenses();
    });
  });
}

// Month/Year selectors
function setupMonthYearSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  monthSelect.addEventListener('change', () => {
    currentMonth = parseInt(monthSelect.value);
    loadData();
    loadTotalExpenses();
  });

  yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value);
    loadData();
    loadTotalExpenses();
  });
}

function loadMonthYearOptions() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  for (let m=1; m<=12; m++) {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }
  for (let y=currentYear-5; y<=currentYear+1; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

// Load Total Expenses
async function loadTotalExpenses() {
  if (!currentPersonId) return;
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .eq('type', 'manual_total')
    .single();

  totalExpensesInput.value = data ? data.amount : 0;
}

// Auto-save Total Expenses
totalExpensesInput.addEventListener('input', async () => {
  const value = parseFloat(totalExpensesInput.value) || 0;
  if (!currentPersonId) return;

  await supabase
    .from('expenses')
    .upsert({
      user_id: currentPersonId,
      year: currentYear,
      month: currentMonth,
      amount: value,
      type: 'manual_total'
    }, { onConflict: ['user_id', 'year', 'month', 'type'] });

  loadData();
});

// Load main data (income/expenses/stats)
async function loadData() {
  if (!currentPersonId) return;

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .single();

  if (error) { console.error(error); return; }

  document.getElementById('totalIncome').textContent = data.sum_income || 0;
  document.getElementById('startCash').textContent = data.amount_start || 0;
  document.getElementById('endCash').textContent = data.amount_end || 0;
}
