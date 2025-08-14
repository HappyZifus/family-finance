import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Replace with your Supabase URL and key
const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2tlaGhkeW1ocWN0eGxpb292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTczMzYsImV4cCI6MjA3MDczMzMzNn0.zE3B0Awm6eS3Gw7WdCu8MlsMJf8tqIkQo4ADiEzKi1o';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // JS month is 0-indexed

document.addEventListener('DOMContentLoaded', async () => {
  await loadPersons();
  populateMonthYearSelectors();
});

async function loadPersons() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('idx', { ascending: true });

  if (error) {
    console.error('Error loading users:', error);
    return;
  }

  const container = document.getElementById('personSelectors');
  container.innerHTML = '';

  users.forEach(user => {
    const btn = document.createElement('div');
    btn.classList.add('selector-block');
    btn.textContent = user.name;
    btn.dataset.userId = user.id;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPersonId = user.id;
      loadData();
    });

    container.appendChild(btn);
  });

  // Select first user by default
  if (users.length) {
    container.firstChild.click();
  }
}

function populateMonthYearSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  monthSelect.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  const currentYearVal = new Date().getFullYear();
  yearSelect.innerHTML = '';
  for (let y = currentYearVal - 1; y <= currentYearVal + 1; y++) {
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

async function loadData() {
  if (!currentPersonId) return;

  // Fetch income
  const { data: income, error: incomeError } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if (incomeError) console.error('Income fetch error:', incomeError);

  // Fetch expenses
  const { data: expenses, error: expenseError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if (expenseError) console.error('Expenses fetch error:', expenseError);

  renderIncome(income || []);
  renderExpenses(expenses || []);
}

function renderIncome(items) {
  const container = document.getElementById('incomeList');
  container.innerHTML = '';
  items.forEach(i => {
    const div = document.createElement('div');
    div.classList.add('income-item');
    div.textContent = `${i.source || 'Income'}: ${i.amount}`;
    container.appendChild(div);
  });
}

function renderExpenses(items) {
  const container = document.getElementById('expenseList');
  container.innerHTML = '';
  items.forEach(e => {
    const div = document.createElement('div');
    div.classList.add('expense-item');
    div.textContent = `${e.type || 'Expense'}: ${e.amount}`;
    container.appendChild(div);
  });
}
