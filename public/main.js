import { supabase } from '.supabase/supabaseClient.js';

let currentPerson = 'me';
let FamilyMembers = ['me','wife'];
let standardComments = ["Voldo Fuel","Volvo Servis","Vadaks utilities","Pension fond","Vadaks Serviss"];

// --- Инициализация интерфейса ---
function initInterface(){
  document.getElementById('personMe').addEventListener('click',()=>selectPerson('me'));
  document.getElementById('personWife').addEventListener('click',()=>selectPerson('wife'));
  document.getElementById("yearSelect").addEventListener('change', loadData);
  document.getElementById("monthSelect").addEventListener('change', loadData);
  document.getElementById("statsYearSelect").addEventListener('change', updateStatistics);
  document.getElementById("applyCorrection").addEventListener('click', applyCorrection);
  document.getElementById("addIncome").addEventListener('click',()=>{ initIncomeFields(); attachInputListeners(); });
}

// --- Выбор пользователя ---
function selectPerson(person){
  currentPerson = person;
  document.getElementById('personMe').classList.toggle('active', person==='me');
  document.getElementById('personWife').classList.toggle('active', person==='wife');
  loadData();
}

// --- Поля доходов и расходов ---
function initIncomeFields(){
  const container = document.getElementById("incomeFields");
  container.innerHTML='';
  for(let i=0;i<3;i++){
    const div = document.createElement('div');
    div.classList.add('income-line');
    div.innerHTML = `<input type="text" class="income-source" placeholder="Источник">
                     <input type="number" class="income-amount" placeholder="Сумма (€)">
                     <input type="range" class="income-type" min="0" max="1" step="1">`;
    container.appendChild(div);
  }
}
function initPersonalExpenses(){
  const container = document.getElementById("personalExpenses");
  container.innerHTML='';
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
function initExtraExpenses(){
  const container = document.getElementById("extraExpenses");
  container.innerHTML='';
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

// --- Применение корректировки наличности ---
async function applyCorrection(){
  let val = +document.getElementById("correctionValue").value || 0;
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex+1;

  let { data: existing } = await supabase
    .from('total_cash')
    .select('*')
    .eq('person', currentPerson)
    .eq('year', year)
    .eq('month', month);

  if(existing.length>0){
    await supabase.from('total_cash').update({cash: existing[0].cash+val})
      .eq('id', existing[0].id);
  } else {
    await supabase.from('total_cash').insert([{person:currentPerson, year, month, cash:val}]);
  }
  loadData();
}

// --- Слушатели полей ---
function attachInputListeners(){
  document.querySelectorAll('#incomeFields input, #personalExpenses input, #personalExpenses select, #extraExpenses input, #extraExpenses select, #manual-total')
    .forEach(input=>input.addEventListener('input', saveData));
}
async function saveDataToSupabase() {
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex + 1;

  // --- Доходы ---
  for (const incDiv of document.querySelectorAll('#incomeFields .income-line')) {
    const source = incDiv.querySelector('.income-source').value;
    const amount = +incDiv.querySelector('.income-amount').value || 0;
    const type = +incDiv.querySelector('.income-type').value;

    if (!source) continue;

    // Проверка, есть ли запись
    const existing = Income.find(r => r.year === year && r.month === month && r.person === currentPerson && r.source === source);
    if (existing) {
      // Обновляем в Supabase
      await supabase.from('Income').update({ amount, type }).eq('id', existing.id);
    } else {
      // Вставляем новую запись
      const { data, error } = await supabase.from('Income').insert([{ year, month, person: currentPerson, source, amount, type }]);
      if (!error) loadDataFromDB(+yearSelect.value, monthSelect.selectedIndex+1, currentPerson);
    }
  }

  // --- Расходы ---
  for (const expDiv of document.querySelectorAll('#personalExpenses .expense-line, #extraExpenses .extra-line')) {
    const amount = +expDiv.querySelector('input').value || 0;
    const commentInput = expDiv.querySelector('select, input');
    const comment = commentInput ? commentInput.value : '';
    const type = expDiv.closest('#personalExpenses') ? 'personal' : 'extra';

    if (amount === 0 && !comment) continue;

    const existing = Payable.find(r => r.year === year && r.month === month && r.person === currentPerson && r.type === type && r.comment === comment);
    if (existing) {
      await supabase.from('Payable').update({ amount }).eq('id', existing.id);
    } else {
      const { data, error } = await supabase.from('Payable').insert([{ year, month, person: currentPerson, type, amount, comment }]);
      if (!error) loadDataFromDB(+yearSelect.value, monthSelect.selectedIndex+1, currentPerson);
    }
  }

  // --- Наличные ---
  const startCash = +document.getElementById('cashAvailable').value || 0;
  if (!TotalCash[currentPerson]) TotalCash[currentPerson] = {};
  TotalCash[currentPerson][month] = startCash;

  const existingCash = (await supabase.from('TotalCash').select('*').eq('year', year).eq('month', month).eq('person', currentPerson)).data[0];
  if (existingCash) {
    await supabase.from('TotalCash').update({ amount: startCash }).eq('id', existingCash.id);
  } else {
    await supabase.from('TotalCash').insert([{ year, month, person: currentPerson, amount: startCash }]);
  }
}

// --- Сохранение данных ---
async function saveDataLocal(){
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex+1;

  // Доходы
  const incomeDivs = document.querySelectorAll('#incomeFields div');
  for(let div of incomeDivs){
    const source = div.querySelector('.income-source').value;
    const amount = +div.querySelector('.income-amount').value || 0;
    const type = +div.querySelector('.income-type').value;
    if(source){
      let { data: exist } = await supabase
        .from('income')
        .select('*')
        .eq('person', currentPerson)
        .eq('year', year)
        .eq('month', month)
        .eq('source', source);
      if(exist.length>0){
        await supabase.from('income').update({amount,type}).eq('id', exist[0].id);
      } else {
        await supabase.from('income').insert([{person:currentPerson,year,month,source,amount,type}]);
      }
    }
  }

  // Расходы
  const manualTotal = +document.getElementById("manual-total").value || 0;
  await supabase.from('payable').delete()
    .eq('person',currentPerson).eq('year',year).eq('month',month);
  await supabase.from('payable').insert([{person:currentPerson,year,month,type:'manualTotal',amount:manualTotal}]);

  const personalDivs = document.querySelectorAll('#personalExpenses div');
  for(let i=0;i<personalDivs.length;i++){
    const div = personalDivs[i];
    const amount = +div.querySelector('.personal-expense').value || 0;
    let comment = i<5 ? div.querySelector('select').value : div.querySelector('input').value;
    if(amount>0 || comment){
      await supabase.from('payable').insert([{person:currentPerson,year,month,type:'personal',amount,comment}]);
    }
  }

  const extraDivs = document.querySelectorAll('#extraExpenses div');
  for(let i=0;i<extraDivs.length;i++){
    const div = extraDivs[i];
    const amount = +div.querySelector('.extra-expense').value || 0;
    let comment = i<5 ? div.querySelector('select').value : div.querySelector('input').value;
    if(amount>0 || comment){
      await supabase.from('payable').insert([{person:currentPerson,year,month,type:'extra',amount,comment}]);
    }
  }

  updateStatistics();
  updateMonthStats();
}

// --- Загрузка данных ---
async function loadData(){
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex+1;

  initIncomeFields();
  initPersonalExpenses();
  initExtraExpenses();
  attachInputListeners();

  // Наличные
  const { data: cashData } = await supabase.from('total_cash')
    .select('*')
    .eq('person', currentPerson)
    .eq('year', year)
    .eq('month', month);
  const startCash = cashData.length>0 ? cashData[0].cash : 0;
  document.getElementById("cashAvailable").value = startCash;

  // Доходы
  const { data: incomes } = await supabase.from('income')
    .select('*').eq('person', currentPerson).eq('year', year).eq('month', month);
  const incomeDivs = document.querySelectorAll('#incomeFields div');
  incomes.forEach((inc,i)=>{
    if(incomeDivs[i]){
      incomeDivs[i].querySelector('.income-source').value = inc.source;
      incomeDivs[i].querySelector('.income-amount').value = inc.amount;
      incomeDivs[i].querySelector('.income-type').value = inc.type;
    }
  });

  // Расходы
  const { data: payables } = await supabase.from('payable')
    .select('*').eq('person', currentPerson).eq('year', year).eq('month', month);
  const manualTotalObj = payables.find(p=>p.type==='manualTotal');
  document.getElementById("manual-total").value = manualTotalObj ? manualTotalObj.amount : 0;

  const personalRecords = payables.filter(p=>p.type==='personal');
  document.querySelectorAll('#personalExpenses div').forEach((div,i)=>{
    if(personalRecords[i]){
      div.querySelector('.personal-expense').value = personalRecords[i].amount;
      if(i<5) div.querySelector('select').value = personalRecords[i].comment;
      else div.querySelector('input').value = personalRecords[i].comment;
    }
  });

  updateMonthStats();
  updateStatistics();
}

// --- Верхняя статистика (месячная) ---
async function updateMonthStats(){
  const year = +document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").selectedIndex+1;

  // StartCash
  const { data: cashData } = await supabase.from('total_cash')
    .select('*').eq('person', currentPerson).eq('year', year).eq('month', month);
  const startCash = cashData.length>0 ? cashData[0].cash : 0;
  document.getElementById("startCash").textContent = startCash.toFixed(2);

  // Доходы текущего пользователя
  const { data: incomes } = await supabase.from('income')
    .select('*').eq('person', currentPerson).eq('year', year).eq('month', month);
  const incomeMonth = incomes.reduce((a,b)=>a+b.amount,0);

  // Общие семейные расходы
  let totalFamilyExpense = 0;
  for(let p of FamilyMembers){
    const { data: payables } = await supabase.from('payable')
      .select('*').eq('person', p).eq('year', year).eq('month', month);
    const manualTotal = payables.find(x=>x.type==='manualTotal')?.amount || 0;
    const personalSum = payables.filter(x=>x.type==='personal').reduce((a,b)=>a+b.amount,0);
    totalFamilyExpense += (manualTotal - personalSum);
  }
  document.getElementById("totalFamilyExpense").textContent = totalFamilyExpense.toFixed(2);

  // Процент дохода
  let totalIncomeAll = 0;
  for(let p of FamilyMembers){
    const { data: incomesAll } = await supabase.from('income')
      .select('*').eq('person',p).eq('year',year);
    totalIncomeAll += incomesAll.reduce((a,b)=>a+b.amount,0);
  }
  const incomePercent = totalIncomeAll ? (incomeMonth/totalIncomeAll*100) : 0;
  document.getElementById("incomePercent").textContent = incomePercent.toFixed(1);

  // Честная доля и разница
  const fair = totalFamilyExpense * (incomePercent/100);
  document.getElementById("fairExpense").textContent = fair.toFixed(2);
  document.getElementById("diffExpense").textContent = (totalFamilyExpense - fair).toFixed(2);

  // endCash
  const endCash = startCash + incomeMonth - (totalFamilyExpense);
  document.getElementById("endCash").textContent = endCash.toFixed(2);
}

// --- Нижняя статистика (годовая) ---
async function updateStatistics(){
  const year = +document.getElementById("statsYearSelect").value;
  const container = document.getElementById("statisticsBlocks");
  container.innerHTML='';

  let totalEndCash = 0, totalIncome=0, totalExpense=0;
  for(let p of FamilyMembers){
    let incomeP=0, expenseP=0;
    for(let m=1;m<=12;m++){
      const { data: incomes } = await supabase.from('income').select('*').eq('person',p).eq('year',year).eq('month',m);
      const { data: payables } = await supabase.from('payable').select('*').eq('person',p).eq('year',year).eq('month',m);
      const monthIncome = incomes.reduce((a,b)=>a+b.amount,0);
      const manualTotal = payables.find(x=>x.type==='manualTotal')?.amount || 0;
      const personalSum = payables.filter(x=>x.type==='personal').reduce((a,b)=>a+b.amount,0);
      incomeP += monthIncome;
      expenseP += (manualTotal - personalSum);
      totalEndCash += monthIncome - (manualTotal - personalSum);
    }
    totalIncome += incomeP;
    totalExpense += expenseP;

    const fair = totalExpense * (incomeP/totalIncome || 0);
    const diff = expenseP - fair;

    container.innerHTML += `<div class="stat-block">
      <b>${p}</b><br>
      Доход за год: ${incomeP.toFixed(2)} €<br>
      Расходы за год: ${expenseP.toFixed(2)} €<br>
      Честная доля: ${fair.toFixed(2)} €<br>
      Разница: ${diff.toFixed(2)} €
    </div>`;
  }

  container.innerHTML = `<div class="stat-block">Общий остаток семьи: ${totalEndCash.toFixed(2)} €</div>
                         <div class="stat-block">Средний доход семьи: ${(totalIncome/12).toFixed(2)} €</div>
                         <div class="stat-block">Средний расход семьи: ${(totalExpense/12).toFixed(2)} €</div>` + container.innerHTML;
}

import { supabase } from './supabase/supabaseClient.js';

async function loadDataFromDB(year, month, currentPerson) {
    // Загрузка доходов
    const { data: incomeData, error: incomeError } = await supabase
        .from('Income')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .eq('person', currentPerson);

    if (incomeError) {
        console.error('Ошибка загрузки доходов:', incomeError);
        return;
    }

    Income = incomeData || [];

    // Загрузка расходов
    const { data: payableData, error: payableError } = await supabase
        .from('Payable')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .eq('person', currentPerson);

    if (payableError) {
        console.error('Ошибка загрузки расходов:', payableError);
        return;
    }

    Payable = payableData || [];

    // Загрузка наличных
    const { data: cashData, error: cashError } = await supabase
        .from('TotalCash')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .eq('person', currentPerson);

    if (cashError) {
        console.error('Ошибка загрузки наличности:', cashError);
        return;
    }

    TotalCash[currentPerson] = {};
    if (cashData.length > 0) {
        TotalCash[currentPerson][month] = cashData[0].amount;
    } else {
        TotalCash[currentPerson][month] = 0;
    }

    // После загрузки подгружаем данные в интерфейс
    loadData();
}

// --- Запуск ---
initInterface();
loadData();
