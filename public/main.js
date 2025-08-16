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
async function renderIncomeInputs(){
  const container = document.getElementById('incomeInputs');
  container.innerHTML = "";

  // 1. Шаблон источников (6 слотов)
  let {data:templateData} = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id',currentPersonId)
    .eq('year',currentYear);

  // если нет шаблона — создаём 6 строк
  if(!templateData || templateData.length === 0) {
    for(let i=1;i<=6;i++){
      await supabase.from('income_sources_template')
        .insert({user_id:currentPersonId,year:currentYear,slot_number:i,source:"",type:true});
    }
    ({data:templateData} = await supabase
      .from('income_sources_template')
      .select('*')
      .eq('user_id',currentPersonId)
      .eq('year',currentYear));
  }

  // 2. Реальные значения суммы
  const {data:incomeRows} = await supabase
    .from('income')
    .select('*')
    .eq('user_id',currentPersonId)
    .eq('year',currentYear)
    .eq('month',currentMonth);

  // 3. Рендеруем 6 строк
  for(let i=1; i<=6; i++) {
    const templateRow = templateData.find(r=>r.slot_number===i) || {slot_number:i,source:"",type:true};
    const record = incomeRows?.find(r=>r.slot_number===i) || {};
    const sourceVal = record.source || templateRow.source || "";
    const amountVal = record.amount ?? 0;

    const div = document.createElement('div');
    div.classList.add('income-item');
    div.innerHTML = `
      <input type="text" class="income-source" data-slot="${i}" value="${sourceVal}" placeholder="Source">
      <input type="number" class="income-amount" data-slot="${i}" value="${amountVal}" placeholder="Amount">
      <label class="switch">
         <input type="checkbox" class="income-type-toggle" data-slot="${i}" ${templateRow.type?"checked":""}>
         <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  // 4. Source — сохраняем в шаблон
  container.querySelectorAll('.income-source').forEach(inp=>{
    inp.addEventListener('input', async (e)=>{
      const slot = +e.target.dataset.slot;
      const val  = e.target.value;
      await supabase.from('income_sources_template')
        .update({source:val})
        .eq('user_id',currentPersonId)
        .eq('year',currentYear)
        .eq('slot_number',slot);
    });
  });

  // 5. Amount — upsert в таблицу income
  container.querySelectorAll('.income-amount').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot   = +e.target.dataset.slot;
      const amount = parseFloat(e.target.value)||0;
      const templateRow = templateData.find(r=>r.slot_number===slot);
      const src = templateRow?.source || "";
      const type = templateRow?.type || true;
      if(!src) return; // если пустой Source — не сохраняем
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        slot_number: slot,
        source: src,
        type: type,
        amount: amount
      }], {onConflict:['user_id','year','month','slot_number']});
      loadData(); // обновить верхнюю статистику
    });
  });

  // 6. Toggle — обновляем шаблон + таблицу income
  container.querySelectorAll('.income-type-toggle').forEach(inp=>{
    inp.addEventListener('change', async(e)=>{
      const slot = +e.target.dataset.slot;
      const val  = inp.checked;
      const templateRow = templateData.find(r=>r.slot_number===slot);
      const src = templateRow?.source || "";
      // сначала обновляем шаблон
      await supabase.from('income_sources_template')
        .update({type:val})
        .eq('user_id',currentPersonId)
        .eq('year',currentYear)
        .eq('slot_number',slot);
      // потом — income
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        slot_number: slot,
        source: src,
        type: val,
        amount: 0
      }], {onConflict:['user_id','year','month','slot_number']});
      loadData();
    });
  });
}


