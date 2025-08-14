import { supabase } from './supabase/supabaseClient.js';

let currentPerson = 'me';
const FamilyMembers = ['me','wife'];

document.getElementById('personMe').addEventListener('click', ()=>selectPerson('me'));
document.getElementById('personWife').addEventListener('click', ()=>selectPerson('wife'));
document.getElementById('addIncome').addEventListener('click', initIncomeFields);
document.getElementById('yearSelect').addEventListener('change', loadData);
document.getElementById('monthSelect').addEventListener('change', loadData);
document.getElementById('statsYearSelect').addEventListener('change', updateStatistics);
document.getElementById('applyCorrection').addEventListener('click', applyCorrection);

function selectPerson(person){
    currentPerson = person;
    document.getElementById('personMe').classList.toggle('active', person==='me');
    document.getElementById('personWife').classList.toggle('active', person==='wife');
    loadData();
}

// --- Загрузка доходов из Supabase ---
async function loadIncome(person, year, month){
    const { data, error } = await supabase
        .from('Income')
        .select('*')
        .eq('person', person)
        .eq('year', year)
        .eq('month', month);
    if(error) console.error(error);
    return data || [];
}

// --- Загрузка расходов из Supabase ---
async function loadPayable(person, year, month){
    const { data, error } = await supabase
        .from('Payable')
        .select('*')
        .eq('person', person)
        .eq('year', year)
        .eq('month', month);
    if(error) console.error(error);
    return data || [];
}

// --- Загрузка наличности ---
async function loadCash(person, month){
    const { data, error } = await supabase
        .from('TotalCash')
        .select('*')
        .eq('person', person)
        .eq('month', month);
    if(error) console.error(error);
    return (data[0]?.amount || 0);
}

// --- Создание полей дохода ---
function initIncomeFields(){
    const container = document.getElementById("incomeFields");
    const div = document.createElement('div');
    div.classList.add('income-line');
    div.innerHTML = `<input type="text" class="income-source" placeholder="Источник">
                     <input type="number" class="income-amount" placeholder="Сумма (€)">
                     <input type="range" class="income-type" min="0" max="1" step="1">`;
    container.appendChild(div);
}

// --- Применение корректировки наличности ---
async function applyCorrection(){
    const val = +document.getElementById("correctionValue").value || 0;
    const month = document.getElementById("monthSelect").selectedIndex+1;
    await supabase.from('TotalCash').upsert({person:currentPerson, month, amount: val});
    loadData();
}

// --- Основная загрузка данных ---
async function loadData(){
    const year = +document.getElementById("yearSelect").value;
    const month = document.getElementById("monthSelect").selectedIndex+1;

    // Очистка
    document.getElementById('incomeFields').innerHTML='';
    document.getElementById('personalExpenses').innerHTML='';
    document.getElementById('extraExpenses').innerHTML='';

    // Доходы
    const income = await loadIncome(currentPerson, year, month);
    income.forEach(inc=>{
        initIncomeFields();
        const divs = document.querySelectorAll('#incomeFields div');
        const div = divs[divs.length-1];
        div.querySelector('.income-source').value = inc.source;
        div.querySelector('.income-amount').value = inc.amount;
        div.querySelector('.income-type').value = inc.type;
    });

    // TODO: добавить загрузку расходов и вычисления endCash, FairSpend, процент дохода
}

// --- Статистика ---
function updateStatistics(){
    // TODO: рассчитать общие значения за год
}

// --- Инициализация ---
selectPerson('me');
