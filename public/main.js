import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // JS months 0–11

document.addEventListener('DOMContentLoaded', async () => {
  await setupPersonSelectors();
  setupMonthYearSelectors();
});

// Load users from Supabase to create buttons
async function setupPersonSelectors() {
  const { data: users, error } = await supabase.from('users').select('id,name');
  if (error) return console.error('Error fetching users:', error);

  const container = document.getElementById('personSelectors');
  container.innerHTML = '';

  users.forEach((u, idx) => {
    const btn = document.createElement('div');
    btn.classList.add('selector-block');
    btn.textContent = u.name;
    btn.dataset.userid = u.id;
    btn.addEventListener('click', () => {
      currentPersonId = u.id;
      container.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadData();
    });
    container.appendChild(btn);

    // select first by default
    if (idx === 0) {
      btn.click();
    }
  });
}

function setupMonthYearSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  // populate month/year options
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  const startYear = 2023;
  const endYear = new Date().getFullYear();
  for (let y = startYear; y <= endYear; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  monthSelect.addEventListener('change', () => {
    currentMonth = parseInt(monthSelect.value);
    loadData();
  });
  yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value);
    loadData();
  });
}

// Load data from the new view
async function loadData() {
  if (!currentPersonId) return;

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .single(); // only one row per user/month

  if (error) return console.error('Error loading monthly finance:', error);

  renderData(data);
}

function renderData(data) {
  if (!data) return;

  document.getElementById('income').textContent = data.sum_income ?? 0;
  document.getElementById('expenses').textContent = data.sum_expenses ?? 0;
  document.getElementById('startCash').textContent = data.start_cash ?? 0;
  document.getElementById('endCash').textContent = data.end_cash ?? 0;
  document.getElementById('incomePercent').textContent = data.income_percent?.toFixed(2) ?? '0';
  document.getElementById('fairShare').textContent = data.fair_share?.toFixed(2) ?? '0';
  document.getElementById('difference').textContent = data.difference?.toFixed(2) ?? '0';
}
