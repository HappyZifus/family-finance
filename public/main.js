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
  if (!currentPersonId) return;

  // Fetch all family members for the selected month/year
  const { data: allData, error: fetchError } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('year', currentYear)
    .eq('month', currentMonth);

  if (fetchError) {
    console.error(fetchError);
    return;
  }

  if (!allData || allData.length === 0) return;

  // Find the selected person's row
  const personData = allData.find(d => d.user_name === currentPersonId) || {};

  // Safely extract numeric values with fallback to 0
  const startCash = +personData.amount_start || 0;
  const endCash = +personData.amount_end || 0;
  const incomePercent = +personData.income_percent || 0;
  const fairShare = +personData.fair_share || 0;
  const diffExpense = +personData.difference || 0;
  const personIncome = +personData.sum_income || 0;
  const personExpense = +personData.sum_expenses || 0;

  // Calculate total family expense
  const totalFamilyExpense = allData.reduce((sum, d) => sum + (+d.sum_expenses || 0), 0);

  // Update stats in the DOM
  document.getElementById("startCash").textContent = startCash.toFixed(2);
  document.getElementById("endCash").textContent = endCash.toFixed(2);
  document.getElementById("incomePercent").textContent = incomePercent.toFixed(2);
  document.getElementById("fairExpense").textContent = fairShare.toFixed(2);
  document.getElementById("diffExpense").textContent = diffExpense.toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = totalFamilyExpense.toFixed(2);

  // Display selected person's income/expense
  document.getElementById('incomeDisplay').innerHTML = `<div class="income-item">Total Income: ${personIncome.toFixed(2)} €</div>`;
  document.getElementById('expenseDisplay').innerHTML = `<div class="expense-item">Total Expenses: ${personExpense.toFixed(2)} €</div>`;
}


// Initial load
loadData();
