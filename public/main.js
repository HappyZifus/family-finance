// main.js
import { supabase } from '../supabase/supabaseClient.js';

let Income = [];
let Payable = [];
let TotalCash = {};
let FairSpend = [];
let currentPerson = 'me';
const FamilyMembers = ['me', 'wife'];
const standardComments = ["Voldo Fuel","Volvo Servis","Vadaks utilities","Pension fond","Vadaks Serviss"];

// --- Инициализация интерфейса ---
document.getElementById('personMe').addEventListener('click', ()=>selectPerson('me'));
document.getElementById('personWife').addEventListener('click', ()=>selectPerson('wife'));
document.getElementById("yearSelect").addEventListener('change', loadData);
document.getElementById("monthSelect").addEventListener('change', loadData);
document.getElementById("statsYearSelect").addEventListener('change', updateStatistics);
document.getElementById("addIncome").addEventListener('click',()=>{initIncomeFields();attachInputListeners();});
document.getElementById("applyCorrection").addEventListener('click', applyCorrection);

// --- Выбор пользователя ---
function selectPerson(person){
  currentPerson = person;
  document.getElementById('personMe').classList.toggle('active', person==='me');
  document.getElementById('personWife').classList.toggle('active', person==='wife');
  loadData();
}

// --- Инициализация полей ---
function initIncomeFields() {
  const container = document.getElementById("incomeFields");
  container.innerHTML = '';
  for(let i=0;i<3;i++){
    const div = document.createElement('div');
    div.classList.add('income-line');
    div.innerHTML = `<input type="text" class="income-source" placeholder="Источник">
                     <input type="number" class="income-amount" placeholder="Сумма (€)">
                     <input type="range" class="income-type" min="0" max="1" step="1">`;
    container.appendChild(div);
  }
}

function initPersonalExpenses() {
  const container = document.getElementById("personalExpenses");
  container.innerHTML = '';
  for(let i=0;i<10;i++){
    const div = document.createElement('div');
    div.classList.add('expense-line');
    if(i<5){
      div.innerHTML = `<input type="number" class="personal-expense individual-expense" placeholder="Индивидуальная трата (€)">
                       <select class="personal-comment comment-black"><option value="">--</option>${standardComments.map(c=>`<option>${c}</option>`).join('')}</select>`;
    } else {
      div.innerHTML = `<input type="number" class="personal-expense individual-expense" placeholder="Индивидуальная трата (€)">
                       <input type="text" class="personal-comment" placeholder="Комментарий">`;
    }
    container.appendChild(div);
  }
}

function initExtraExpenses() {
  const container = document.getElementById("extraExpenses");
  container.innerHTML = '';
  for(let i=0;i<10;i++){
    const div = document.createElement('div');
    div.classList.add('extra-line');
    if(i<5){
      div.innerHTML = `<input type="number" class="extra-expense" placeholder="Сумма (€)">
                       <select class="extra-comment comment-black"><option value="">--</option>${standardComments.map(c=>`<option>${c}</option>`).join('')}</select>`;
    } else {
      div.innerHTML = `<input type="number" class="extra-expense" placeholder="Сумма (€)">
                       <input type="text" class="extra-comment" placeholder="Комментарий">`;
    }
    container.appendChild(div);
  }
}

// --- Слушатели полей ---
function attachInputListeners(){
  document.querySelectorAll('#incomeFields input, #personalExpenses input, #personalExpenses select, #extraExpenses input, #extraExpenses select, #manual-total')
    .forEach(input=>input.addEventListener('input', saveData));
}

// --- Применение коррекции наличности ---
function applyCorrection(){
  let val = +document.getElementById("correctionValue").value || 0;
  const month = document.getElementById("monthSelect").selectedIndex+1;
  if(!TotalCash[currentPerson]) TotalCash[currentPerson] = {};
  if(!TotalCash[currentPerson][month]) TotalCash[currentPerson][month] = 0;
  TotalCash[currentPerson][month] += val;
  saveTotalCashToDB(currentPerson, month, TotalCash[currentPerson][month]);
  loadData();
}

// --- Загрузка данных из Supabase ---
async function loadData(){
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex+1;

  // Подгружаем доходы
  let { data: incomeData } = await supabase
    .from('Income')
    .select('*')
    .eq('year', year)
    .eq('month', month);

  Income = incomeData || [];

  // Подгружаем расходы
  let { data: payableData } = await supabase
    .from('Payable')
    .select('*')
    .eq('year', year)
    .eq('month', month);

  Payable = payableData || [];

  // Подгружаем наличность
  let { data: cashData } = await supabase
    .from('TotalCash')
    .select('*')
    .eq('month', month);

  TotalCash = {};
  cashData.forEach(c=>{
    if(!TotalCash[c.person]) TotalCash[c.person] = {};
    TotalCash[c.person][c.month] = c.amount;
  });

  // Инициализация интерфейса
  initIncomeFields();
  initPersonalExpenses();
  initExtraExpenses();
  attachInputListeners();

  updateAllCalculations();
}

// --- Сохранение данных ---
async function saveData(){
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex+1;

  // Доходы
  document.querySelectorAll('#incomeFields div').forEach(async (div)=>{
    const source = div.querySelector('.income-source').value;
    const amount = +div.querySelector('.income-amount').value || 0;
    const type = +div.querySelector('.income-type').value;
    if(source){
      await supabase.from('Income').upsert({
        year, month, person: currentPerson, source, amount, type
      }, { onConflict: ['year','month','person','source'] });
    }
  });

  // Расходы
  await supabase.from('Payable').delete()
    .eq('year', year).eq('month', month).eq('person', currentPerson);

  const manualTotal = +document.getElementById("manual-total").value || 0;
  if(manualTotal>0){
    await supabase.from('Payable').insert([{year, month, person: currentPerson, type:'manualTotal', amount:manualTotal}]);
  }

  document.querySelectorAll('#personalExpenses div').forEach(async (div,i)=>{
    const amount = +div.querySelector('.personal-expense').value || 0;
    let comment = i<5?div.querySelector('select').value:div.querySelector('input').value;
    if(amount>0 || comment){
      await supabase.from('Payable').insert([{year, month, person: currentPerson, type:'personal', amount, comment}]);
    }
  });

  document.querySelectorAll('#extraExpenses div').forEach(async (div,i)=>{
    const amount = +div.querySelector('.extra-expense').value || 0;
    let comment = i<5?div.querySelector('select').value:div.querySelector('input').value;
    if(amount>0 || comment){
      await supabase.from('Payable').insert([{year, month, person: currentPerson, type:'extra', amount, comment}]);
    }
  });

  updateAllCalculations();
}

// --- Сохранение наличности ---
async function saveTotalCashToDB(person, month, amount){
  await supabase.from('TotalCash').upsert({person, month, amount}, { onConflict:['person','month'] });
}

// --- Расчёты ---
function updateAllCalculations(){
  updateFairSpend();
  updateFamilyExpense();
  updateMonthStats();
  updateStatistics();
}

// --- FairSpend ---
function updateFairSpend(){
  const year = +document.getElementById("yearSelect").value;
  const totalIncomeYear = Income.filter(r=>r.year===year).reduce((a,b)=>a+b.amount,0);
  const currentIncomeYear = Income.filter(r=>r.year===year && r.person===currentPerson).reduce((a,b)=>a+b.amount,0);

  document.getElementById("incomePercent").textContent = totalIncomeYear ? ((currentIncomeYear/totalIncomeYear)*100).toFixed(1) : 0;

  const month = document.getElementById("monthSelect").selectedIndex+1;
  const totalManual = Payable.filter(r=>r.year===year && r.month===month && r.type==='manualTotal').reduce((a,b)=>a+b.amount,0);
  const totalPersonal = Payable.filter(r=>r.year===year && r.month===month && r.type==='personal').reduce((a,b)=>a+b.amount,0);
  const totalFamily = totalManual - totalPersonal;

  const fair = totalFamily * (+document.getElementById("incomePercent").textContent)/100;
  document.getElementById("fairExpense").textContent = fair.toFixed(2);
}

// --- Обновление семейных трат ---
function updateFamilyExpense(){
  const manualTotal = +document.getElementById("manual-total").value || 0;
  let personalSum = 0;
  document.querySelectorAll('#personalExpenses .personal-expense').forEach(e=>personalSum+=+e.value||0);
  let userFamilyExpense = manualTotal-personalSum;
  document.getElementById('familyExpenseBlock').textContent = `Семейные траты: ${userFamilyExpense.toFixed(2)} €`;
}

// --- Обновление верхней статистики ---
function updateMonthStats(){
  const month = document.getElementById("monthSelect").selectedIndex+1;
  let startCash = TotalCash[currentPerson]?.[month] || 0;
  document.getElementById("startCash").textContent = startCash.toFixed(2);

  const incomeMonth = Income.filter(r=>r.month===month && r.person===currentPerson).reduce((a,b)=>a+b.amount,0);
  const manualTotal = +document.getElementById("manual-total").value || 0;
  const personalSum = Array.from(document.querySelectorAll('#personalExpenses .personal-expense')).reduce((a,b)=>a+(+b.value||0),0);

  const endCash = startCash + incomeMonth - (manualTotal-personalSum);
  document.getElementById("endCash").textContent = endCash.toFixed(2);

  const fair = +document.getElementById("fairExpense").textContent;
  document.getElementById("totalFamilyExpense").textContent = (manualTotal-personalSum).toFixed(2);
  document.getElementById("diffExpense").textContent = ((manualTotal-personalSum)-fair).toFixed(2);
}

// --- Нижняя статистика по году ---
function updateStatistics(){
  const year = +document.getElementById("statsYearSelect").value;
  const container = document.getElementById("statisticsBlocks");
  container.innerHTML='';

  let totalEndCash=0, totalIncome=0, totalExpense=0;
  FamilyMembers.forEach(p=>{
    let memberIncome = Income.filter(r=>r.year===year && r.person===p).reduce((a,b)=>a+b.amount,0);
    let memberExpense = Payable.filter(r=>r.year===year && r.person===p).reduce((a,b)=>b.type!=='personal'?a+b.amount:a,0);
    let fair = (memberExpense * memberIncome / Income.filter(r=>r.year===year).reduce((a,b)=>a+b.amount,0)) || 0;
    container.innerHTML += `<div class="stat-block">
      <b>${p}</b><br>
      Доход: ${memberIncome.toFixed(2)} €<br>
      Расходы: ${memberExpense.toFixed(2)} €<br>
      Честная доля: ${fair.toFixed(2)} €<br>
      Разница: ${(memberExpense-fair).toFixed(2)} €
    </div>`;
    totalIncome += memberIncome;
    totalExpense += memberExpense;
    totalEndCash += TotalCash[p]?.[12]||0; // упрощённо конец года
  });

  container.innerHTML = `<div class="stat-block">Общий остаток: ${totalEndCash.toFixed(2)} €</div>
                         <div class="stat-block">Средний доход: ${(totalIncome/12).toFixed(2)} €</div>
                         <div class="stat-block">Средний расход: ${(totalExpense/12).toFixed(2)} €</div>` + container.innerHTML;
}

// --- Инициализация ---
loadData();
