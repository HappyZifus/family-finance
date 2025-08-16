import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;

const personButtons = {
  'person1': null,
  'person2': null
};

let usersList = []; // [{id,name},...]

document.addEventListener('DOMContentLoaded', async () => {
  // 1. загрузка пользователей
  const { data } = await supabase.from('users').select('id, name');
  usersList = data;

  // 2. инициализация кнопок
  personButtons['person1'] = document.getElementById('person1');
  personButtons['person2'] = document.getElementById('person2');

  usersList.forEach((u, idx) => {
    const btn = personButtons['person'+(idx+1)];
    btn.textContent = u.name;
    btn.dataset.userid = u.id;
    btn.addEventListener('click', () => selectPersonById(u.id));
  });

  // 3. обработчики года и месяца
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

  // 4. выбрать первого пользователя по умолчанию
  selectPersonById(usersList[0].id);
});

function selectPersonById(id){
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

async function loadData() {
  if(!currentPersonId) return;

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .limit(1)
    .single();

  if(error){
    console.error(error);
    return;
  }

  if(!data) return;

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

// ------------------ Income Inputs ------------------

async function renderIncomeInputs(){
  const container = document.getElementById('incomeInputs');
  container.innerHTML = "";

  // 1. грузим шаблон источников по user_id
  let { data: templateData } = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .order('slot_number', {ascending: true});

  // если пусто — создаем 6 строк
  if(!templateData || templateData.length === 0){
    for(let i=1;i<=6;i++){
      await supabase.from('income_sources_template').insert({
        user_id: currentPersonId,
        year: currentYear,
        slot_number: i,
        source: "",
        type: true
      });
    }
    const res = await supabase
      .from('income_sources_template')
      .select('*')
      .eq('user_id', currentPersonId)
      .eq('year', currentYear)
      .order('slot_number', {ascending: true});
    templateData = res.data;
  }

  // 2. загружаем реальные Amount для месяца
  const { data: incomeRows } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if(!templateData) return;

  // 3. рисуем строки
  for(const row of templateData){
    let amountVal = 0;
    const rec = incomeRows?.find(r=>r.source===row.source);
    if(rec) amountVal = rec.amount;

    const div = document.createElement('div');
    div.classList.add('income-item');
    div.innerHTML = `
      <input type="text" class="income-source" data-slot="${row.slot_number}" value="${row.source||""}" placeholder="Source">
      <input type="number" class="income-amount" data-slot="${row.slot_number}" value="${amountVal}" placeholder="Amount">
      <label class="switch">
         <input type="checkbox" class="income-type-toggle" data-slot="${row.slot_number}" ${row.type?"checked":""}>
         <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  // --- события ---

  // Source
  container.querySelectorAll('.income-source').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot=+e.target.dataset.slot;
      const val = e.target.value;
      await supabase.from('income_sources_template')
        .update({source:val})
        .eq('user_id',currentPersonId)
        .eq('year',currentYear)
        .eq('slot_number',slot);
    });
  });

  // Toggle → шаблон + income
  container.querySelectorAll('.income-type-toggle').forEach(inp=>{
    inp.addEventListener('change', async(e)=>{
      const slot=+e.target.dataset.slot;
      const val = e.target.checked;

      // обновляем шаблон
      const { data:srcTemplate } = await supabase
        .from('income_sources_template')
        .update({type:val})
        .eq('user_id',currentPersonId)
        .eq('year',currentYear)
        .eq('slot_number',slot)
        .select()
        .single();

      // upsert в income
      const existing = incomeRows?.find(r=>r.source === srcTemplate.source);
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        source: srcTemplate.source,
        type: val,
        amount: existing?.amount || 0
      }], {onConflict:['user_id','year','month','source']});
    });
  });

  // Amount
  container.querySelectorAll('.income-amount').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot=+e.target.dataset.slot;
      const amount=parseFloat(e.target.value)||0;
      const srcRow = templateData.find(r=>r.slot_number===slot);
      if(!srcRow || !srcRow.source) return;
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        source: srcRow.source,
        type: srcRow.type,
        amount: amount
      }], {onConflict:['user_id','year','month','source']});
    });
  });
}
