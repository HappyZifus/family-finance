import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-12

document.addEventListener('DOMContentLoaded', async () => {
  await loadPersons();
  setupMonthYearSelectors();
  await loadData();
});

async function loadPersons() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  const container = document.getElementById('personButtons');
  container.innerHTML = '';

  users.forEach(user => {
    const btn = document.createElement('button');
    btn.textContent = user.name;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#personButtons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPersonId = user.id;
      loadData();
    });
    container.appendChild(btn);
  });

  // Select first user by default
  if (users.length > 0) {
    currentPersonId = users[0].id;
    container.querySelector('button').classList.add('active');
  }
}

function setupMonthYearSelectors() {
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');

  // Populate year dropdown (last 5 years + current + next)
  const thisYear = new Date().getFullYear();
  for (let y = thisYear - 5; y <= thisYear + 1; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value);
    loadData();
  });

  monthSelect.value = currentMonth;
  monthSelect.addEventListener('change', () => {
    currentMonth = parseInt(monthSelect.value);
    loadData();
  });
}

async function loadData() {
  if (!currentPersonId) return;

  console.log(`Loading data for user ${currentPersonId}, ${currentMonth}/${currentYear}`);

  const { data: incomes, error: incomeErr } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if (incomeErr) console.error('Income fetch error:', incomeErr);

  const { data: expenses, error: expenseErr } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if (expenseErr) console.error('Expense fetch error:', expenseErr);

  renderIncome(incomes || []);
  renderExpenses(expenses || []);
}

function renderIncome(list) {
  const container = document.getElementById('incomeList');
  container.innerHTML = '';
  if (list.length === 0) {
    container.textContent = 'No income data.';
    return;
  }
  list.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.source}: ${item.amount}`;
    container.appendChild(div);
  });
}

function renderExpenses(list) {
  const container = document.getElementById('expenseList');
  container.innerHTML = '';
  if (list.length === 0) {
    container.textContent = 'No expense data.';
    return;
  }
  list.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.type}: ${item.amount}`;
    container.appendChild(div);
  });
}
