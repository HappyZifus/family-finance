import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;

const personButtons = {
  'person1': null,
  'person2': null
};

document.addEventListener('DOMContentLoaded', async () => {
  // инициализация кнопок выбора пользователя
  personButtons['person1'] = document.getElementById('person1');
  personButtons['person2'] = document.getElementById('person2');

  personButtons['person1'].addEventListener('click', ()=>selectPerson('Lesha'));
  personButtons['person2'].addEventListener('click', ()=>selectPerson('Lena'));

  // выбор года
  document.getElementById('yearSelect').addEventListener('change', ()=>{
    currentYear = +document.getElementById('yearSelect').value;
    loadData();
    renderIncomeInputs();
  });

  // выбор месяца
  document.getElementById('monthSelect').addEventListener('change', ()=>{
    currentMonth = document.getElementById('monthSelect').selectedIndex + 1;
    loadData();
    renderIncomeInputs();
  });

  // первый запуск с дефолтным пользователем
  selectPerson('Lesha');
});

function selectPerson(name){
  currentPersonId = name;
  Object.keys(personButtons).forEach(k=>{
    personButtons[k].classList.toggle('active', personButtons[k].textContent===name);
  });
  loadData();
  renderIncomeInputs();
}


function selectPerson(name){
  currentPersonId = name;
  Object.keys(personButtons).forEach(k=>{
    personButtons[k].classList.toggle('active', personButtons[k].textContent===name);
  });
  loadData();
  renderIncomeInputs();
}

async function loadData(){
  if(!currentPersonId) return;

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_name', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .limit(1)
    .single();

  if(error){
    console.error(error);
    return;
  }

  if(!data) return;

  // safe print
  document.getElementById("startCash").textContent = ((+data.start_cash) || 0).toFixed(2);
  document.getElementById("endCash").textContent   = ((+data.end_cash) || 0).toFixed(2);
  document.getElementById("incomePercent").textContent = (+data.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+data.fair_share).toFixed(2);
  document.getElementById("diffExpense").textContent = (+data.difference).toFixed(2);

  // income section now shows family_income too
  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML = `
    <div class="income-item">Total Income: ${(+data.sum_income).toFixed(2)} €</div>
    <div class="income-item">Family Income: ${(+data.family_income).toFixed(2)} €</div>
  `;

  // expenses block untouched
  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}

async function renderIncomeInputs(){
  const container = document.getElementById('incomeInputs');
  container.innerHTML = "";

  const { data: templateData } = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .order('slot_number', { ascending: true });

  let sources = [];
  if (!templateData || templateData.length === 0) {
    for (let i = 1; i <= 6; i++) {
      let rec = {
        user_id: currentPersonId,
        year: currentYear,
        slot_number: i,
        source: "",
        type: true
      };
      sources.push(rec);
      await supabase.from('income_sources_template').insert(rec);
    }
  } else {
    sources = templateData;
  }

  for (const row of sources) {
    const div = document.createElement("div");
    div.classList.add("income-item");
    div.innerHTML = `
      <input type="text" class="income-source" data-slot="${row.slot_number}" value="${row.source ?? ""}" placeholder="Source"/>
      <input type="number" class="income-amount" data-slot="${row.slot_number}" value="0" placeholder="Amount"/>
      <label class="switch">
        <input type="checkbox" class="income-type-toggle" data-slot="${row.slot_number}" ${row.type ? "checked":""}/>
        <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  container.querySelectorAll('.income-source').forEach(inp=>{
    inp.addEventListener('input', async (e)=>{
      const slot = +e.target.dataset.slot;
      const val  = e.target.value;
      await supabase.from('income_sources_template')
        .update({source: val})
        .eq('user_id', currentPersonId)
        .eq('slot_number', slot)
        .eq('year', currentYear);
    })
  });

  container.querySelectorAll('.income-type-toggle').forEach(inp=>{
    inp.addEventListener('change', async (e)=>{
      const slot = +e.target.dataset.slot;
      const val  = e.target.checked;
      await supabase.from('income_sources_template')
        .update({type: val})
        .eq('user_id', currentPersonId)
        .eq('slot_number', slot)
        .eq('year', currentYear);
    });
  });

  container.querySelectorAll('.income-amount').forEach(inp=>{
    inp.addEventListener('input', async (e)=>{
      const slot   = +e.target.dataset.slot;
      const amount = parseFloat(e.target.value) || 0;
      const { data: src } = await supabase
        .from('income_sources_template')
        .select('*')
        .eq('user_id', currentPersonId)
        .eq('slot_number', slot)
        .eq('year', currentYear)
        .single();
      if(!src || !src.source) return;
      await supabase.from('income').upsert([{
        user_id: currentPersonId,
        year: currentYear,
        month: currentMonth,
        source: src.source,
        type: src.type,
        amount: amount
      }], {
        onConflict: ['user_id','year','month','source']
      });
    });
  });
}


