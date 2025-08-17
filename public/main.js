import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;
const MAX_SLOTS = 6;

const personButtons = {
  person1: null,
  person2: null
};
let usersList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadUsers();

  // Инициализация кнопок
  personButtons.person1 = document.getElementById('person1');
  personButtons.person2 = document.getElementById('person2');

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

// ----------------- Load Users -----------------
async function loadUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at');
  if (error) {
    console.error(error);
    return;
  }
  usersList = data;
}

// ----------------- Select Person -----------------
function selectPersonById(id) {
  currentPersonId = id;
  Object.keys(personButtons).forEach(k => {
    personButtons[k].classList.toggle(
      'active',
      personButtons[k].dataset.userid === id
    );
  });
  loadData();
  renderIncomeInputs();
}

// ----------------- Load Monthly Finance -----------------
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

  document.getElementById('startCash').textContent = (+data.start_cash).toFixed(2);
  document.getElementById('endCash').textContent = (+data.end_cash).toFixed(2);
  document.getElementById('incomePercent').textContent = (+data.income_percent).toFixed(2);
  document.getElementById('totalFamilyExpense').textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById('fairExpense').textContent = (+data.fair_share).toFixed(2);
  document.getElementById('diffExpense').textContent = (+data.difference).toFixed(2);

  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML = `<div class="income-item">Total Income: ${(+data.sum_income).toFixed(2)} €</div>
                         <div class="income-item">Family Income: ${(+data.family_income).toFixed(2)} €</div>`;

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}

// ----------------- Render Income Inputs -----------------
async function renderIncomeInputs() {
  const container = document.getElementById('incomeInputs');
  container.innerHTML = '';

  // 1. Получаем шаблон источников
  let { data: templateData, error: tplError } = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear);

  if (tplError) {
    console.error(tplError);
    return;
  }

  // Создаем пустые слоты, если их меньше MAX_SLOTS
  if (!templateData) templateData = [];
  for (let i = 1; i <= MAX_SLOTS; i++) {
    if (!templateData.find(r => r.slot_number === i)) {
      const { error: insErr } = await supabase
        .from('income_sources_template')
        .insert([{ user_id: currentPersonId, year: currentYear, slot_number: i, source: '', type: true }]);
      if (insErr) console.error(insErr);
      templateData.push({ slot_number: i, source: '', type: true });
    }
  }

  // 2. Загружаем реальные суммы
  const { data: incomeRows, error: incErr } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if (incErr) console.error(incErr);

  for (const row of templateData.sort((a,b)=>a.slot_number-b.slot_number)) {
    const rec = incomeRows?.find(r => r.slot_number === row.slot_number);
    const amountVal = rec ? rec.amount : 0;
    const sourceVal = rec ? rec.source : row.source;

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

  // ----------------- Events -----------------
  container.querySelectorAll('.income-source').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot = +e.target.dataset.slot;
      const val = e.target.value;

      await supabase
        .from('income_sources_template')
        .update({ source: val })
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('slot_number', slot);
    });
  });

  container.querySelectorAll('.income-amount').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot = +e.target.dataset.slot;
      const amount = parseFloat(e.target.value)||0;

      const srcRow = templateData.find(r=>r.slot_number===slot);
      if (!srcRow || !srcRow.source) return;

      await supabase
        .from('income')
        .upsert([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          slot_number: slot,
          source: srcRow.source,
          type: srcRow.type,
          amount: amount
        }], { onConflict: ['user_id','year','month','slot_number'] });

      loadData(); // обновляем статистику
    });
  });

  container.querySelectorAll('.income-type-toggle').forEach(inp=>{
    inp.addEventListener('change', async(e)=>{
      const slot = +e.target.dataset.slot;
      const val = inp.checked;
      const srcRow = templateData.find(r=>r.slot_number===slot);
      if(!srcRow || !srcRow.source) return;

      // Обновляем шаблон
      await supabase
        .from('income_sources_template')
        .update({ type: val })
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('slot_number', slot);

      // Обновляем income
      await supabase
        .from('income')
        .upsert([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          slot_number: slot,
          source: srcRow.source,
          type: val,
          amount: 0
        }], { onConflict: ['user_id','year','month','slot_number'] });

      loadData();
    });
  });
}
