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

  // 1. Шаблон источников (income_sources_template)
  let {data:templateData} = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id',currentPersonId)
    .eq('year',currentYear);

  if(!templateData || templateData.length === 0){
    // создаём локально 6 слотов (без insert)
    templateData = [];
    for(let i=1;i<=6;i++){
      templateData.push({slot_number:i,source:"",type:true});
    }
  } else {
    // Если записей <6 – заполним недостающие
    for(let i=1;i<=6;i++){
      if(!templateData.find(t=>t.slot_number===i)){
        templateData.push({slot_number:i,source:"",type:true});
      }
    }
  }

  // 2. Реальные суммы по нужному месяцу
  const {data:incomeRows} = await supabase
    .from('income')
    .select('*')
    .eq('user_id',currentPersonId)
    .eq('year',currentYear)
    .eq('month',currentMonth);

  // 3. Рисуем 6 строк
  templateData.sort((a,b)=>a.slot_number-b.slot_number);
  for(const row of templateData){
    const rec = incomeRows?.find(r=>r.slot_number === row.slot_number) || {};
    const sourceVal = (rec.source || row.source || "");
    const amountVal = rec.amount ?? 0;

    const div = document.createElement('div');
    div.classList.add('income-item');
    div.innerHTML = `
      <input type="text"  class="income-source"     data-slot="${row.slot_number}" value="${sourceVal}" placeholder="Source">
      <input type="number" class="income-amount"    data-slot="${row.slot_number}" value="${amountVal}" placeholder="Amount">
      <label class="switch">
         <input type="checkbox" class="income-type-toggle" data-slot="${row.slot_number}" ${row.type?"checked":""}>
         <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  // === DELEGATED EVENTS ===
  container.addEventListener('input', async (e)=>{
    const slot = +e.target.dataset.slot;
    if(!slot) return;

    // Source changed -> update template
    if(e.target.classList.contains('income-source')){
      const newSource = e.target.value;
      await supabase.from('income_sources_template').upsert({
        user_id: currentPersonId,
        year: currentYear,
        slot_number: slot,
        source: newSource,
        type: true
      }, {onConflict:['user_id','year','slot_number']});
      return;
    }

    // Amount changed -> update income
    if(e.target.classList.contains('income-amount')){
      const amount = parseFloat(e.target.value)||0;
      const tmpl = templateData.find(r=>r.slot_number===slot);
      if(!tmpl || !tmpl.source) return;
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        slot_number: slot,
        source: tmpl.source,
        type: tmpl.type,
        amount: amount
      }], {onConflict:['user_id','year','month','slot_number']});
      loadData(); // refresh top stats
    }
  });

  container.addEventListener('change', async (e)=>{
    const slot = +e.target.dataset.slot;
    if(!slot) return;

    if(e.target.classList.contains('income-type-toggle')){
      const newType = e.target.checked;
      const tmpl = templateData.find(r=>r.slot_number===slot);
      const src  = tmpl.source;

      // update template type
      await supabase.from('income_sources_template').upsert({
        user_id: currentPersonId,
        year: currentYear,
        slot_number: slot,
        source: src,
        type: newType
      }, {onConflict:['user_id','year','slot_number']});

      // upsert income type
      if(src){
        await supabase.from('income').upsert([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          slot_number: slot,
          source: src,
          type: newType,
          amount: 0
        }], {onConflict:['user_id','year','month','slot_number']});
      }
      loadData();
    }
  });
}


