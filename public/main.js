@ -30,51 +30,7 @@ function selectPerson(name){
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

async function loadData(){
  if(!currentPersonId) return;

  const { data, error } = await supabase
@ -105,4 +61,4 @@ async function loadData() {

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;

}