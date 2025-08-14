import { supabase } from './supabase/supabaseClient.js';

let Income = [];
let Payable = [];
let TotalCash = {};
let FairSpend = [];
let FamilyMembers = ['me','wife'];
let standardComments = ["Voldo Fuel","Volvo Servis","Vadaks utilities","Pension fond","Vadaks Serviss"];

let currentPerson = 'me';

// --- Выбор пользователя ---
document.getElementById('personMe').addEventListener('click', ()=>selectPerson('me'));
document.getElementById('personWife').addEventListener('click', ()=>selectPerson('wife'));

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

// --- Подключение слушателей ---
function attachInputListeners(){
    document.querySelectorAll('#incomeFields input, #personalExpenses input, #personalExpenses select, #extraExpenses input, #extraExpenses select, #manual-total')
        .forEach(input=>input.addEventListener('input', saveData));
}

document.getElementById("addIncome").addEventListener('click',()=>{initIncomeFields();attachInputListeners();});
document.getElementById("yearSelect").addEventListener('change', loadData);
document.getElementById("monthSelect").addEventListener('change', loadData);
document.getElementById("statsYearSelect").addEventListener('change', updateStatistics);
document.getElementById("applyCorrection").addEventListener('click',()=>{
    let val = +document.getElementById("correctionValue").value || 0;
    const month = document.getElementById("monthSelect").selectedIndex+1;
    if(!TotalCash[currentPerson]) TotalCash[currentPerson] = {};
    if(!TotalCash[currentPerson][month]) TotalCash[currentPerson][month] = 0;
    TotalCash[currentPerson][month] += val;
    loadData();
});

// --- Сохранение данных локально ---
function saveData(){
    const year = +document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").selectedIndex+1;

    // Доходы
    document.querySelectorAll('#incomeFields div').forEach(div=>{
        const source = div.querySelector('.income-source').value;
        const amount = +div.querySelector('.income-amount').value || 0;
        const type = +div.querySelector('.income-type').value;
        if(source){
            let exist = Income.find(r=>r.year===year && r.month===month && r.person===currentPerson && r.source===source);
            if(exist) exist.amount=amount, exist.type=type;
            else Income.push({year,month,person:currentPerson,source,amount,type});
        }
    });

    // Расходы
    Payable = Payable.filter(r=>!(r.year===year && r.month===month && r.person===currentPerson));
    const manualTotal = +document.getElementById("manual-total").value || 0;
    Payable.push({year,month,person:currentPerson,type:'manualTotal',amount:manualTotal});
    document.querySelectorAll('#personalExpenses div').forEach((div,i)=>{
        const amount = +div.querySelector('.personal-expense').value || 0;
        let comment = i<5?div.querySelector('select').value:div.querySelector('input').value;
        if(amount>0 || comment) Payable.push({year,month,person:currentPerson,type:'personal',amount,comment});
    });
    document.querySelectorAll('#extraExpenses div').forEach((div,i)=>{
        const amount = +div.querySelector('.extra-expense').value || 0;
        let comment=i<5?div.querySelector('select').value:div.querySelector('input').value;
        if(amount>0 || comment) Payable.push({year,month,person:currentPerson,type:'extra',amount,comment});
    });

    if(!TotalCash[currentPerson]) TotalCash[currentPerson] = {};
    if(!TotalCash[currentPerson][month]) {
        let prevMonthCash = TotalCash[currentPerson][month-1] || 0;
        TotalCash[currentPerson][month] = prevMonthCash;
    }

    updateFairSpend();
    updateFamilyExpense();
    updateMonthStats();
    updateStatistics();
}

// --- FairSpend ---
function updateFairSpend(){
    const year = +document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").selectedIndex+1;
    const totalIncomeYear = Income.filter(r=>r.year===year).reduce((a,b)=>a+b.amount,0);
    const totalFamilyExpense = FamilyMembers.reduce((sum,p)=>{
        const manual = Payable.find(r=>r.year===year && r.month===month && r.person===p && r.type==='manualTotal')?.amount||0;
        const personal = Payable.filter(r=>r.year===year && r.month===month && r.person===p && r.type==='personal').reduce((a,b)=>a+b.amount,0);
        return sum + (manual-personal);
    },0);
    FamilyMembers.forEach(p=>{
        const userIncomeYear = Income.filter(r=>r.year===year && r.person===p).reduce((a,b)=>a+b.amount,0);
        const fair = totalIncomeYear? totalFamilyExpense*(userIncomeYear/totalIncomeYear):0;
        let exist = FairSpend.find(f=>f.year===year && f.month===month && f.person===p);
        if(exist) exist.fair=fair;
        else FairSpend.push({year,month,person:p,fair});
    });
}

// --- Обновление семейных трат ---
function updateFamilyExpense(){
    const manualTotal = +document.getElementById("manual-total").value || 0;
    let personalSum = 0;
    document.querySelectorAll('#personalExpenses .personal-expense').forEach(e=>personalSum+=+e.value||0);
    let userFamilyExpense = manualTotal-personalSum;
    document.getElementById('familyExpenseBlock').textContent = `Семейные траты: ${userFamilyExpense.toFixed(2)} €`;
}

// --- Загрузка данных в интерфейс ---
function loadData(){
    const year = +document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").selectedIndex+1;

    initIncomeFields();
    initPersonalExpenses();
    initExtraExpenses();

    let startCash = TotalCash[currentPerson]?.[month] || (TotalCash[currentPerson]?.[month-1] || 0);
    document.getElementById("cashAvailable").value = startCash;

    // Доходы
    const incomeDivs = document.querySelectorAll('#incomeFields div');
    Income.filter(r=>r.year===year && r.month===month && r.person===currentPerson).forEach((inc,i)=>{
        if(incomeDivs[i]){
            incomeDivs[i].querySelector('.income-source').value = inc.source;
            incomeDivs[i].querySelector('.income-amount').value = inc.amount;
            incomeDivs[i].querySelector('.income-type').value = inc.type;
        }
    });

    // Расходы
    const manualTotal = Payable.find(r=>r.year===year && r.month===month && r.person===currentPerson && r.type==='manualTotal')?.amount||0;
    document.getElementById("manual-total").value = manualTotal;

    const personalRecords = Payable.filter(r=>r.year===year && r.month===month && r.person===currentPerson && r.type==='personal');
    document.querySelectorAll('#personalExpenses div').forEach((div,i)=>{
        if(personalRecords[i]){
            div.querySelector('.personal-expense').value = personalRecords[i].amount;
            if(i<5) div.querySelector('select').value = personalRecords[i].comment;
            else div.querySelector('input').value = personalRecords[i].comment;
        } else {
            div.querySelector('.personal-expense').value='';
            if(i<5) div.querySelector('select').value='';
            else div.querySelector('input').value='';
        }
    });

    const extraRecords = Payable.filter(r=>r.year===year && r.month===month && r.type==='extra' && r.person===currentPerson);
    document.querySelectorAll('#extraExpenses div').forEach((div,i)=>{
        if(extraRecords[i]){
            div.querySelector('.extra-expense').value = extraRecords[i].amount;
            if(i<5) div.querySelector('select').value = extraRecords[i].comment;
            else div.querySelector('input').value = extraRecords[i].comment;
        } else {
            div.querySelector('.extra-expense').value='';
            if(i<5) div.querySelector('select').value='';
            else div.querySelector('input').value='';
        }
    });

    updateFamilyExpense();
    updateMonthStats();
    updateStatistics();
    attachInputListeners();
}

// --- Статистика по месяцу ---
function updateMonthStats(){
    const year = +document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").selectedIndex+1;

    let startCash = TotalCash[currentPerson]?.[month] || (TotalCash[currentPerson]?.[month-1] || 0);
    document.getElementById("startCash").textContent = startCash.toFixed(2);

    const incomeMonth = Income.filter(r=>r.year===year && r.month===month && r.person===currentPerson).reduce((a,b)=>a+b.amount,0);
    const manualTotal = Payable.find(r=>r.year===year && r.month===month && r.person===currentPerson && r.type==='manualTotal')?.amount||0;
    const personalSum = Payable.filter(r=>r.year===year && r.month===month && r.person===currentPerson && r.type==='personal').reduce((a,b)=>a+b.amount,0);

    const endCash = startCash + incomeMonth - (manualTotal - personalSum);
    document.getElementById("endCash").textContent = endCash.toFixed(2);

    const totalIncomeAll = Income.filter(r=>r.year===year).reduce((a,b)=>a+b.amount,0);
    const percentIncome = totalIncomeAll ? (Income.filter(r=>r.year===year && r.person===currentPerson).reduce((a,b)=>a+b.amount,0)/totalIncomeAll*100) : 0;
    document.getElementById("incomePercent").textContent = percentIncome.toFixed(1);

    const totalFamilyExpense = manualTotal-personalSum;
    document.getElementById("totalFamilyExpense").textContent = totalFamilyExpense.toFixed(2);

    const fair = FairSpend.find(f=>f.year===year && f.month===month && f.person===currentPerson)?.fair||0;
    document.getElementById("fairExpense").textContent = fair.toFixed(2);

    document.getElementById("diffExpense").textContent = (totalFamilyExpense-fair).toFixed(2);
}

// --- Статистика за год ---
function updateStatistics(){
    const year = +document.getElementById("statsYearSelect").value;
    const container = document.getElementById("statisticsBlocks");
    container.innerHTML='';

    let totalEndCash = 0, totalIncome=0, totalExpense=0;
    let memberStats = {};
    FamilyMembers.forEach(p=>{
        memberStats[p]={income:0,expense:0,fair:0,diff:0,months:0};
        for(let m=1;m<=12;m++){
            const monthIncome = Income.filter(r=>r.year===year && r.month===m && r.person===p).reduce((a,b)=>a+b.amount,0);
            const manualTotal = Payable.find(r=>r.year===year && r.month===m && r.person===p && r.type==='manualTotal')?.amount||0;
            const personal = Payable.filter(r=>r.year===year && r.month===m && r.person===p && r.type==='personal').reduce((a,b)=>a+b.amount,0);
            const monthEndCash = (TotalCash[p]?.[m] || (TotalCash[p]?.[m-1]||0)) + monthIncome - (manualTotal-personal);
            const fair = FairSpend.find(f=>f.year===year && f.month===m && f.person===p)?.fair||0;
            if(monthIncome || manualTotal){
                memberStats[p].income += monthIncome;
                memberStats[p].expense += (manualTotal-personal);
                memberStats[p].fair += fair;
                memberStats[p].diff += (manualTotal-personal - fair);
                memberStats[p].months++;
            }
            totalEndCash += monthEndCash;
            totalIncome += monthIncome;
            totalExpense += (manualTotal-personal);
        }
    });

    container.innerHTML += `<div class="stat-block">Общий остаток: ${totalEndCash.toFixed(2)} €</div>`;
    container.innerHTML += `<div class="stat-block">Средний доход: ${(totalIncome/12).toFixed(2)} €</div>`;
    container.innerHTML += `<div class="stat-block">Средний расход: ${(totalExpense/12).toFixed(2)} €</div>`;

    FamilyMembers.forEach(p=>{
        container.innerHTML += `<div class="stat-block">
            <b>${p}</b><br>
            Расходы: ${memberStats[p].expense.toFixed(2)} €<br>
            Честные расходы: ${memberStats[p].fair.toFixed(2)} €<br>
            Разница: ${memberStats[p].diff.toFixed(2)} €
        </div>`;
    });
}

// --- Загрузка данных из базы при инициализации ---
async function loadInitialData() {
    const year = +document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").selectedIndex+1;
    await loadDataFromDB(year, month, currentPerson);
}

// --- Запуск ---
loadInitialData();
