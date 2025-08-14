import { supabase } from './supabase/supabaseClient.js';

let currentUserId = null;
let currentMonth = 1;
let currentYear = 2025;

document.addEventListener('DOMContentLoaded', () => {
  setupUserButtons();
  setupDateSelectors();
});

function setupUserButtons() {
  const buttons = document.querySelectorAll('.user-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUserId = btn.dataset.userId;
      console.log('Selected user:', currentUserId);
      loadData();
    });
  });
}

function setupDateSelectors() {
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
  if (!currentUserId) return;

  console.log(`Loading data for user ${currentUserId} - ${currentMonth}/${currentYear}`);

  try {
    const { data: incomeData, error: incomeError } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('year', currentYear)
      .eq('month', currentMonth);

    if (incomeError) throw incomeError;

    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('year', currentYear)
      .eq('month', currentMonth);

    if (expenseError) throw expenseError;

    renderIncome(incomeData);
    renderExpenses(expenseData);
  } catch (err) {
    console.error('Error loading data:', err.message);
  }
}

function renderIncome(incomeList) {
  const container = document.getElementById('incomeList');
  container.innerHTML = '';
  incomeList.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.source}: ${item.amount} €`;
    container.appendChild(div);
  });
}

function renderExpenses(expenseList) {
  const container = document.getElementById('expenseList');
  container.innerHTML = '';
  expenseList.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.category}: ${item.amount} €`;
    container.appendChild(div);
  });
}
