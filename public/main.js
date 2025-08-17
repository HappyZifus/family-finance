import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;

const personButtons = {'person1': null, 'person2': null};
let usersList = [];

document.addEventListener('DOMContentLoaded', async () => {
  // загрузка пользователей
  const { data } = await supabase.from('users').select('id, name');
  usersList = data;

  // кнопки
  personButtons['person1'] = document.getElementById('person1');
  personButtons['person2'] = document.getElementById('person2');

  usersList.forEach((u, idx)=>{
    const btn = personButtons['person'+(idx+1)];
    btn.textContent = u.name;
    btn.dataset.userid = u.id;
    btn.addEventListener('click', ()=> selectPersonById(u.id));
  });

  // год/месяц
  document.getElementById('yearSelect').addEventListener('change', ()=>{
    currentYear = +document.getElementById('yearSelect').value;
    reloadAll();
  });
  document.getElementById('monthSelect').addEventListener('change', ()=>{
    currentMonth = document.getElementById('monthSelect').selectedIndex+1;
    reloadAll();
  });

  // первый запуск
  selectPersonById(usersList[0].id);
});

function selectPersonById(id){
  currentPersonId = id;
  Object.keys(personButtons).forEach(k=>{
    personButtons[k].classList.toggle('active', personButtons[k].dataset.userid === id);
  });
  reloadAll();
}

async function reloadAll(){
  await loadData();
  await renderIncomeInputs();
}

// ---------------- статистика ----------------
async function loadData(){
  if(!currentPersonId) return;
  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .single();
  if(error) { console.error(error); return; }
  if(!data) return;

  document.getElementById("startCash").textContent = (+data.start_cash).toFixed(2);
  document.getElementById("endCash").textContent   = (+data.end_cash).toFixed(2);
  document.getElementById("incomePercent").textContent = (+data.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+data.fair_share).toFixed(2);
  document.getElementById("diffExpense").textContent = (+data.difference).toFixed(2);

  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML =
    `<div class="income-item">Total Income: ${(+data.sum_income).toFixed(2)} €</div>
     <div class="income-item">Family Income: ${(+data.family_income).toFixed(2)} €</div>`;

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML =
    `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}

// --------------- INCOME EDITABLE 6 LINES ----------------
async function renderIncomeInputs(){
  const container = document.getElementById('incomeInputs');
  container.innerHTML = "";

  // 1. Загрузить шаблон
  let { data: templateData } = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear);

  // если нет → создаём 6 пустых
  if(!templateData || templateData.length === 0){
    templateData = [];
    for(let i=1;i<=6;i++){
      templateData.push({slot_number: i, source:"", type:true});
    }
  } else {
    for(let i=1;i<=6;i++){
      if(!templateData.find(r=>r.slot_number===i)){
        templateData.push({slot_number:i, source:"", type:true });
      }
    }
  }

  // 2. Загрузить реальные income
  const { data: incomeRows } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth);

  // 3. Сортировка и рендер
  templateData.sort((a,b)=>a.slot_number-b.slot_number);
  for(const row of templateData){
    const rec = incomeRows?.find(r=>r.slot_number === row.slot_number) || {};
    const div = document.createElement('div');
    div.classList.add('income-item');
    div.innerHTML = `
      <input type="text" class="income-source" data-slot="${row.slot_number}" value="${rec.source || row.source || ""}" placeholder="Source"/>
      <input type="number" class="income-amount" data-slot="${row.slot_number}" value="${rec.amount || 0}" placeholder="Amount"/>
      <label class="switch">
        <input type="checkbox" class="income-type-toggle" data-slot="${row.slot_number}" ${row.type?"checked":""}>
        <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  //----------------- обработчики с USE SDK -----------------
  container.addEventListener('input', async(e)=>{
    const slot = +e.target.dataset.slot;
    if(!slot) return;

    // Source
    if(e.target.classList.contains('income-source')){
      const srcVal = e.target.value;
      await supabase.from('income_sources_template').upsert({
        user_id: currentPersonId,
        year: currentYear,
        slot_number: slot,
        source: srcVal,
        type: true
      }, { onConflict: ['user_id','year','slot_number'] });
    }

    // Amount
    if(e.target.classList.contains('income-amount')){
      const amountVal = parseFloat(e.target.value) || 0;
      const tmpl = templateData.find(r=>r.slot_number===slot);
      if(!tmpl || !tmpl.source) return;
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        slot_number: slot,
        source: tmpl.source,
        type: tmpl.type,
        amount: amountVal
      }], { onConflict:['user_id','year','month','slot_number']});
      loadData();
    }
  });

  container.addEventListener('change', async(e)=>{
    const slot = +e.target.dataset.slot;
    if(!slot) return;
    if(e.target.classList.contains('income-type-toggle')){
      const newType = e.target.checked;
      const tmpl    = templateData.find(r=>r.slot_number===slot);
      const srcVal  = tmpl?.source || "";
      await supabase.from('income_sources_template').upsert({
        user_id: currentPersonId,
        year: currentYear,
        slot_number: slot,
        source: srcVal,
        type: newType
      }, { onConflict:['user_id','year','slot_number']});
      if(srcVal){
        await supabase.from('income').upsert([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          slot_number: slot,
          source: srcVal,
          type: newType,
          amount: 0
        }], { onConflict:['user_id','year','month','slot_number']});
        loadData();
      }
    }
  });
}

