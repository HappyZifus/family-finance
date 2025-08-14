import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentMonth = 1;
let currentYear = 2025;
let persons = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadPersons();
  setupMonthYearSelectors();
});

async function loadPersons() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  persons = data;

  const container = document.getElementById('personSelectors');
  container.innerHTML = '';
  data.forEach(user => {
    const btn = document.createElement('button');
    btn.className = 'person-btn';
    btn.textContent = user.name;
    btn.dataset.id = user.id;
    btn.addEventListener('click', () => selectPerson(user.id, btn));
    container.appendChild(btn);
  });

  // Select first person by default
  if (persons.length) selectPerson(persons[0].id, container.firstChild);
}

function selectPerson(id, btnElement) {
  currentPersonId = id;
  // Update button active class
  document.querySelectorAll('.person-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
  loadData();
}

function setupMonthYearSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

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
  const { data: incomeData, error: incomeError } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  if (incomeError) console.error('Income fetch error:', incomeError);

  // Fetch expenses
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('month', currentMonth)
    .eq('year', currentYear);

  if (expenseError) console.error('Expenses fetch error:', expenseError);

  renderIncome(incomeData || []);
  renderExpenses(expenseData || []);
}

function renderIncome(list) {
  const container = document.getElementById('incomeList');
  container.innerHTML = '';
  list.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.source}: ${item.amount}`;
    container.appendChild(div);
  });
}

function renderExpenses(list) {
  const container = document.getElementById('expenseList');
  container.innerHTML = '';
  list.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.type}: ${item.amount}`;
    container.appendChild(div);
  });
}
