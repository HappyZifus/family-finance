import { supabase } from '../supabase/supabaseClient.js';

let currentPerson = 'me';
const FamilyMembers = ['me','wife'];
let FairSpend = [];

document.getElementById('personMe').addEventListener('click',()=>selectPerson('me'));
document.getElementById('personWife').addEventListener('click',()=>selectPerson('wife'));
document.getElementById('yearSelect').addEventListener('change', loadData);
document.getElementById('monthSelect').addEventListener('change', loadData);

async function selectPerson(person){
    currentPerson = person;
    document.getElementById('personMe').classList.toggle('active', person==='me');
    document.getElementById('personWife').classList.toggle('active', person==='wife');
    await loadData();
}

function createIncomeLine(source='', amount=0, type=0){
    const div = document.createElement('div');
    div.className='income-line';
    div.innerHTML = `
        <input type="text" class="income-source" placeholder="Источник" value="${source}">
        <input type="number" class="income-amount" placeholder="Сумма (€)" value="${amount}">
        <input type="range" class="income-type" min="0" max="1" step="1" value="${type}">
    `;
    document.getElementById('incomeFields').appendChild(div);
}

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

async function loadCash(person, month){
    const { data, error } = await supabase
        .from('Cash')
        .select('amount')
        .eq('person', person)
        .eq('month', month)
        .single();
    if(error) console.warn(error);
    return data?.amount || 0;
}

async function loadData(){
    document.getElementById('incomeFields').innerHTML='';
    const year = +document.getElementById('yearSelect').value;
    const month = +document.getElementById('monthSelect').value;

    // доходы
    const income = await loadIncome(currentPerson, year, month);
    if(income.length===0) createIncomeLine();
    income.forEach(inc => createIncomeLine(inc.source, inc.amount, inc.type));

    // наличные
    const cash = await loadCash(currentPerson, month);
    document.getElementById('cashAvailable').value = cash;

    // TODO: расходы, FairSpend, endCash, статистика
}

createIncomeLine();
selectPerson('me');
