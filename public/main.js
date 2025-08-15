@ -30,7 +30,7 @@ function selectPerson(name){
  loadData();
}

async function loadData(){
aasync function loadData(){
  if(!currentPersonId) return;

  const { data, error } = await supabase
@ -49,8 +49,11 @@ async function loadData(){

  if(!data) return;

  document.getElementById("startCash").textContent = (+data.amount_start).toFixed(2);
  document.getElementById("endCash").textContent = (+data.amount_end).toFixed(2);
  // ---- ONLY FIXED THESE TWO LINES ----
  document.getElementById("startCash").textContent = ((+data.amount_start) || 0).toFixed(2);
  document.getElementById("endCash").textContent = ((+data.amount_end) || 0).toFixed(2);
  // ------------------------------------

  document.getElementById("incomePercent").textContent = (+data.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+data.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+data.fair_share).toFixed(2);
@ -62,3 +65,4 @@ async function loadData(){
  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+data.sum_expenses).toFixed(2)} €</div>`;
}
