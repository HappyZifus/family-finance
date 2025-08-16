import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;

const personButtons = {
  'person1': null,
  'person2': null
};

document.addEventListener('DOMContentLoaded', async () => {
  personButtons['person1'] = document.getElementById('person1');
  personButtons['person2'] = document.getElementById('person2');

  personButtons['person1'].addEventListener('click', ()=>selectPerson('Lesha'));
  personButtons['person2'].addEventListener('click', ()=>selectPerson('Lena'));

  document.getElementById('yearSelect').addEventListener('change', ()=>{ currentYear=+document.getElementById('yearSelect').value; loadData(); });
  document.getElementById('monthSelect').addEventListener('change', ()=>{ currentMonth=document.getElementById('monthSelect').selectedIndex+1; loadData(); });

  selectPerson('Lesha');
});

function selectPerson(name){
  currentPersonId = name;
  Object.keys(personButtons).forEach(k=>{
    personButtons[k].classList.toggle('active', personButtons[k].textContent===name);
  });
  loadData();
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

  document.getElementById("startCash").textContent = (+data.start_cash).toFixed(2);
  document.getElementById("endCash").textContent   = (+data.end_cash).toFixed(2);
  document.getElementById("incomePercent").textContent = (+data.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+data.fair_share).toFixed(2);
  document.getElementById("diffExpense").textContent = (+data.difference).toFixed(2);

  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML = `<div class="income-item">Total Income: ${(+data.sum_income).toFixed(2)} €</div>`;

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}

async function renderIncomeInputs() {
  const container = document.getElementById('incomeDisplay');
  container.innerHTML = ''; // очистка

  // Шаблон источников по user_id + year
  const { data: templateData } = await supabase
    .from('income_sources_template')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .order('slot_number', { ascending: true });

  let sources = [];
  if (!templateData || templateData.length === 0) {
    for (let i = 1; i <= 6; i++) {
      sources.push({ slot_number: i, source: '', type: true });
      await supabase.from('income_sources_template').insert([{
        user_id: currentPersonId,
        year: currentYear,
        slot_number: i,
        source: '',
        type: true
      }]);
    }
  } else {
    sources = templateData;
  }

  // Создаем 6 полей
  for (let i = 0; i < 6; i++) {
    const s = sources[i];
    const div = document.createElement('div');
    div.classList.add('income-item');

    div.innerHTML = `
      <input type="text" value="${s.source}" placeholder="Source" data-slot="${s.slot_number}" class="income-source">
      <input type="number" value="0" placeholder="Amount" data-slot="${s.slot_number}" class="income-amount">
      <label>
        <input type="checkbox" ${s.type ? 'checked' : ''} data-slot="${s.slot_number}" class="income-type-toggle">
        Income
      </label>
    `;
    container.appendChild(div);
  }

  // События изменения
  container.querySelectorAll('.income-source').forEach(input => {
    input.addEventListener('input', async e => {
      const slot = +e.target.dataset.slot;
      const val = e.target.value;
      await supabase.from('income_sources_template')
        .update({ source: val })
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('slot_number', slot);
    });
  });

  container.querySelectorAll('.income-type-toggle').forEach(input => {
    input.addEventListener('change', async e => {
      const slot = +e.target.dataset.slot;
      const val = e.target.checked;
      await supabase.from('income_sources_template')
        .update({ type: val })
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('slot_number', slot);
    });
  });

  container.querySelectorAll('.income-amount').forEach(input => {
    input.addEventListener('input', async e => {
      const slot = +e.target.dataset.slot;
      const amount = parseFloat(e.target.value) || 0;

      // подтягиваем Source и Type
      const { data: srcData } = await supabase
        .from('income_sources_template')
        .select('*')
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('slot_number', slot)
        .single();

      if (!srcData) return;

      // вставляем/обновляем запись в income для текущего месяца
      await supabase.from('income')
        .upsert([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          source: srcData.source,
          type: srcData.type,
          amount: amount
        }], { onConflict: ['user_id','year','month','source'] });
    });
  });
}
