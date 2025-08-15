import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY_HERE'; // replace with anon key if RLS allows read
const supabase = createClient(supabaseUrl, supabaseKey);

let currentPerson = 'me'; // 'me' = Lesha, 'wife' = Lena

const peopleMap = { me: 'Lesha', wife: 'Lena' };

document.getElementById('personMe').addEventListener('click', () => selectPerson('me'));
document.getElementById('personWife').addEventListener('click', () => selectPerson('wife'));
document.getElementById('yearSelect').addEventListener('change', loadData);
document.getElementById('monthSelect').addEventListener('change', loadData);

function selectPerson(person) {
    currentPerson = person;
    document.getElementById('personMe').classList.toggle('active', person === 'me');
    document.getElementById('personWife').classList.toggle('active', person === 'wife');
    loadData();
}

async function loadData() {
    const year = +document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').selectedIndex + 1;

    // Fetch monthly finance for all users
    let { data: financeData, error: financeErr } = await supabase
        .from('monthly_finance_2')
        .select('*')
        .eq('year', year)
        .eq('month', month);

    if (financeErr) { console.error(financeErr); return; }

    // Fetch start/end cash
    let { data: cashData, error: cashErr } = await supabase
        .from('total_cash')
        .select('*')
        .eq('year', year)
        .eq('month', month);

    if (cashErr) { console.error(cashErr); return; }

    const personData = financeData.find(r => r.user_name === peopleMap[currentPerson]);
    const cashPerson = cashData.find(c => c.user_id === personData?.user_id);

    // Populate stats
    document.getElementById('startCash').textContent = cashPerson?.amount_start?.toFixed(2) ?? '0';
    const endCash = (cashPerson?.amount_start ?? 0) + (personData?.sum_income ?? 0) - (personData?.sum_expenses ?? 0);
    document.getElementById('endCash').textContent = endCash.toFixed(2);
    document.getElementById('incomePercent').textContent = personData?.income_percent?.toFixed(2) ?? '0';
    document.getElementById('totalFamilyExpense').textContent = personData?.family_total_expense?.toFixed(2) ?? '0';
    document.getElementById('fairExpense').textContent = personData?.fair_share?.toFixed(2) ?? '0';
    const difference = (personData?.fair_share ?? 0) - (personData?.sum_expenses ?? 0);
    document.getElementById('diffExpense').textContent = difference.toFixed(2);

    // Populate income lines
    const incomeContainer = document.getElementById('incomeFields');
    incomeContainer.innerHTML = '';
    if (personData) {
        const div = document.createElement('div');
        div.classList.add('income-line');
        div.innerHTML = `<input type="text" readonly value="Income" class="income-source">
                         <input type="number" readonly value="${personData.sum_income.toFixed(2)}" class="income-amount">`;
        incomeContainer.appendChild(div);
    }

    // Populate expenses
    const expenseContainer = document.getElementById('personalExpenses');
    expenseContainer.innerHTML = '';
    if (personData) {
        const div = document.createElement('div');
        div.classList.add('expense-line');
        div.innerHTML = `<input type="number" readonly value="${personData.sum_expenses.toFixed(2)}" class="personal-expense">`;
        expenseContainer.appendChild(div);
    }

    // Extra expenses (for display)
    const extraContainer = document.getElementById('extraExpenses');
    extraContainer.innerHTML = '';
    if (personData) {
        const div = document.createElement('div');
        div.classList.add('extra-line');
        div.innerHTML = `<input type="number" readonly value="0" class="extra-expense">`;
        extraContainer.appendChild(div);
    }
}

// Initial load
loadData();
