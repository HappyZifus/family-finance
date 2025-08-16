import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;

const personButtons = { 'person1': null, 'person2': null };
let usersList = [];

document.addEventListener('DOMContentLoaded', async () => {
  usersList = await loadUsers();

  personButtons['person1'] = document.getElementById('person1');
  personButtons['person2'] = document.getElementById('person2');

  usersList.forEach((u, idx) => {
    const btn = personButtons['person' + (idx + 1)];
    btn.textContent = u.name;
    btn.dataset.userid = u.id;
    btn.addEventListener('click', () => selectPersonById(u.id));
  });

  document.getElementById('yearSelect').addEventListener('change', () => {
    currentYear = +document.getElementById('yearSelect').value;
    loadData();
    renderIncomeInputs();
  });

  document.getElementById('monthSelect').addEventListener('change', () => {
    currentMonth = document.getElementById('monthSelect').selectedIndex + 1;
    loadData();
    renderIncomeInputs();
  });

  selectPersonById(usersList[0].id);
});

async function loadUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) console.error(error);
  return data || [];
}

function selectPersonById(id) {
  currentPersonId = id;
  Object.keys(personButtons).forEach(k => {
    personButtons[k].classList.toggle('active', personButtons[k].dataset.userid === id);
  });
  loadData();
  renderIncomeInputs();
}

async function loadData() {
  if (!currentPersonId) return;

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) return;

  document.getElementById("startCash").textContent = (+data.start_cash).toFixed(2);
  document.getElementById("endCash").textContent = (+data.end_cash).toFixed(2);
  document.getElementById("incomePercent").textContent = (+data.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+data.fair_share).toFixed(2);
  document.getElementById("diffExpense").textContent = (+data.difference).toFixed(2);

  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML = `<div class="income-item">Total Income: ${(+data.sum_income).toFixed(2)} €</div>
                         <div class="income-item">Family Income: ${(+data.family_income).toFixed(2)} €</div>`;

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}

// ----------------- Income Inputs -----------------
async function renderIncomeInputs() {
  const container = document.getElementById('incomeInputs');
  container.innerHTML = "";

  // 1. Шаблон источников
  let templateData = await fetchSupabase('income_sources_template', {
    user_id: currentPersonId,
    year: currentYear
  });

  // 2. Создаём недостающие слоты, чтобы всего было 6
  for (let i = 1; i <= 6; i++) {
    if (!templateData.find(r => r.slot_number === i)) {
      await fetch(`${SUPABASE_URL}/rest/v1/income_sources_template`, {
        method: 'POST',
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{user_id: currentPersonId, year: currentYear, slot_number: i, source:"", type:true}])
      });
    }
  }

  // Обновляем templateData после возможного добавления
  templateData = await fetchSupabase('income_sources_template', {
    user_id: currentPersonId,
    year: currentYear
  });

  // 3. Реальные суммы
  const incomeRows = await fetchSupabase('income', {
    user_id: currentPersonId,
    year: currentYear,
    month: currentMonth
  });

  // 4. Рендер всех 6 строк
  for (const row of templateData.sort((a,b)=>a.slot_number-b.slot_number)) {
    const rec = incomeRows.find(r => r.slot_number === row.slot_number) || {};
    const amountVal = rec.amount || 0;
    const sourceVal = rec.source || row.source || "";

    const div = document.createElement('div');
    div.classList.add('income-item');
    div.innerHTML = `
      <input type="text" class="income-source" data-slot="${row.slot_number}" value="${sourceVal}" placeholder="Source">
      <input type="number" class="income-amount" data-slot="${row.slot_number}" value="${amountVal}" placeholder="Amount">
      <label class="switch">
         <input type="checkbox" class="income-type-toggle" data-slot="${row.slot_number}" ${row.type?"checked":""}>
         <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  // --- здесь добавляем обработчики для input и toggle ---
}

