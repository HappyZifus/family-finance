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

  document.getElementById("startCash").textContent = (+data.amount_start).toFixed(2);
  document.getElementById("endCash").textContent = (+data.amount_end).toFixed(2);
  document.getElementById("incomePercent").textContent = (+data.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+data.fair_share).toFixed(2);
  document.getElementById("diffExpense").textContent = (+data.difference).toFixed(2);

  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML = `<div class="income-item">Total Income: ${(+data.sum_income).toFixed(2)} €</div>`;

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}
