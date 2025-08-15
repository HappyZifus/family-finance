import { supabase } from './supabase/supabaseClient.js';

let currentUserId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// >>> INIT

document.addEventListener('DOMContentLoaded', async () => {
  await setupPersons();
  setupMonthYearSelectors();
});

// >>> LOAD USER BUTTONS

async function setupPersons() {
  const { data: users, error } = await supabase.from('users').select('id,name');
  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById('personSelectors');
  container.innerHTML = '';

  users.forEach((u) => {
    const btn = document.createElement('div');
    btn.className = 'selector-block';
    btn.textContent = u.name;
    btn.dataset.id = u.id;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUserId = u.id;
      loadAllData();
    });
    container.appendChild(btn);
  });

  // select first
  if (users.length > 0) {
    currentUserId = users[0].id;
    container.firstChild.classList.add('active');
    loadAllData();
  }
}

// >>> MONTH / YEAR SELECTORS

function setupMonthYearSelectors() {
  const m = document.getElementById('monthSelect');
  const y = document.getElementById('yearSelect');

  // pre-selected by HTML

  m.addEventListener('change', () => {
    currentMonth = +m.value;
    loadAllData();
  });
  y.addEventListener('change', () => {
    currentYear = +y.value;
    loadAllData();
  });
}

// >>> MASTER FETCH

async function loadAllData() {
  if (!currentUserId) return;

  // fetch income and expenses of this person
  const { data: incomes } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentUserId)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', currentUserId)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  renderIncome(incomes || []);
  renderExpenses(expenses || []);
  calculateTopStats(incomes || [], expenses || []);

  // also load YEARLY stats across all users
  loadYearlyStatistics();
}

// >>> RENDER LISTS

function renderIncome(list) {
  const c = document.getElementById('incomeList');
  c.innerHTML = '';
  list.forEach(i => {
    const div = document.createElement('div');
    div.className = 'income-item';
    div.textContent = `${i.source}: ${i.amount}`;
    c.appendChild(div);
  });
}

function renderExpenses(list) {
  const c = document.getElementById('expenseList');
  c.innerHTML = '';
  list.forEach(e => {
    const div = document.createElement('div');
    div.className = 'expense-item';
    div.textContent = `${e.type}: ${e.amount}`;
    c.appendChild(div);
  });
}

// >>> CALCULATE TOP STATS

async function calculateTopStats(incomes, expenses) {
  // fetch starting cash
  let startCash = 0;
  const { data: tc } = await supabase
    .from('total_cash')
    .select('*')
    .eq('user_id', currentUserId)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .maybeSingle();

  if (tc) startCash = parseFloat(tc.amount);

  const totalIncome = incomes.reduce((s, r) => s + (+r.amount), 0);
  const totalExpense = expenses.reduce((s, r) => s + (+r.amount), 0);

  const endCash = startCash + totalIncome - totalExpense;

  // calculate % of family income and fair share
  const { data: familyIncome } = await supabase
    .from('income')
    .select('amount')
    .eq('year', currentYear)
    .eq('month', currentMonth);
  const totalFamilyIncome = (familyIncome || []).reduce((s, r) => s + (+r.amount), 0);

  const incomePercent = totalFamilyIncome ? ((totalIncome / totalFamilyIncome) * 100) : 0;
  const fairShare = totalFamilyIncome ? (totalExpense * incomePercent / 100) : 0;
  const difference = totalExpense - fairShare;

  // set dom
  document.getElementById('startCash').textContent   = `Start Cash: ${startCash.toFixed(2)}`;
  document.getElementById('endCash').textContent     = `End Cash: ${endCash.toFixed(2)}`;
  document.getElementById('incomePercent').textContent = `Income %: ${incomePercent.toFixed(1)}%`;
  document.getElementById('totalFamilyExpenses').textContent = `Total Expenses: ${totalExpense.toFixed(2)}`;
  document.getElementById('fairShare').textContent   = `Fair Share: ${fairShare.toFixed(2)}`;
  document.getElementById('difference').textContent  = `Diff: ${difference.toFixed(2)}`;
}

// >>> YEARLY BLOCK

async function loadYearlyStatistics() {
  const { data: stats } = await supabase.from('income').select('*').eq('year', currentYear);
  const yearly = document.getElementById('yearlyStatsContainer');
  yearly.innerHTML = '';

  if (stats.length === 0) {
    yearly.textContent = 'No yearly data.';
    return;
  }

  // simple sum by user
  const grouped = {};
  stats.forEach(r => {
    if (!grouped[r.user_id]) grouped[r.user_id] = 0;
    grouped[r.user_id] += (+r.amount);
  });

  Object.entries(grouped).forEach(([uid, total]) => {
    const div = document.createElement('div');
    div.textContent = `User ${uid}: ${total.toFixed(2)}`;
    yearly.appendChild(div);
  });
}
