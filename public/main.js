const SUPABASE_URL = "https://mlkkehhdymhqctxlioov.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY"; // замените на ваш anon key

let currentPersonId = null;
let currentYear = 2025;
let currentMonth = 1;

const personButtons = {
  'person1': null,
  'person2': null
};

let usersList = []; // [{id,name},...]

document.addEventListener('DOMContentLoaded', async () => {
  await loadUsers();

  // Инициализация кнопок
  personButtons['person1'] = document.getElementById('person1');
  personButtons['person2'] = document.getElementById('person2');

  usersList.forEach((u, idx) => {
    const btn = personButtons['person' + (idx+1)];
    btn.textContent = u.name;
    btn.dataset.userid = u.id;
    btn.addEventListener('click', () => selectPersonById(u.id));
  });

  document.getElementById('yearSelect').addEventListener('change', () => {
    currentYear = +document.getElementById('yearSelect').value;
    loadData();
    renderIncomeInputs();
  });

  document.getElementById('monthSelect').addEventListener('change', () => {
    currentMonth = document.getElementById('monthSelect').selectedIndex + 1;
    loadData();
    renderIncomeInputs();
  });

  selectPersonById(usersList[0].id);
});

async function fetchSupabase(endpoint, filters={}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  for (const key in filters) {
    const val = typeof filters[key] === 'string' && key === 'user_id' 
                  ? `eq."${filters[key]}"` 
                  : `eq.${filters[key]}`;
    url.searchParams.set(key, val);
  }
  const resp = await fetch(url.toString(), {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Accept": "application/json"
    }
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
  return await resp.json();
}

async function loadUsers() {
  const data = await fetchSupabase('users');
  usersList = data;
}

function selectPersonById(id) {
  currentPersonId = id;
  Object.keys(personButtons).forEach(k => {
    personButtons[k].classList.toggle(
      'active',
      personButtons[k].dataset.userid === id
    );
  });
  loadData();
  renderIncomeInputs();
}

// ----------------- Load Monthly Finance -----------------
async function loadData() {
  if (!currentPersonId) return;

  const data = await fetchSupabase('monthly_finance_2', {
    user_id: currentPersonId,
    year: currentYear,
    month: currentMonth,
    limit: 1
  });

  const record = data[0];
  if (!record) return;

  document.getElementById("startCash").textContent = (+record.start_cash).toFixed(2);
  document.getElementById("endCash").textContent = (+record.end_cash).toFixed(2);
  document.getElementById("incomePercent").textContent = (+record.income_percent).toFixed(2);
  document.getElementById("totalFamilyExpense").textContent = (+record.sum_expenses).toFixed(2);
  document.getElementById("fairExpense").textContent = (+record.fair_share).toFixed(2);
  document.getElementById("diffExpense").textContent = (+record.difference).toFixed(2);

  const incomeDiv = document.getElementById('incomeDisplay');
  incomeDiv.innerHTML = `<div class="income-item">Total Income: ${(+record.sum_income).toFixed(2)} €</div>
                         <div class="income-item">Family Income: ${(+record.family_income).toFixed(2)} €</div>`;

  const expenseDiv = document.getElementById('expenseDisplay');
  expenseDiv.innerHTML = `<div class="expense-item">Total Expenses: ${(+record.sum_expenses).toFixed(2)} €</div>`;
}

// ----------------- Income Inputs -----------------
async function renderIncomeInputs() {
  const container = document.getElementById('incomeInputs');
  container.innerHTML = "";

  // 1. Шаблон источников
  let templateData = await fetchSupabase('income_sources_template', {
    user_id: currentPersonId,
    year: currentYear
  });
  
  if (!templateData || templateData.length === 0) {
    // создаем 6 строк
    for (let i=1; i<=6; i++) {
      await fetch(`${SUPABASE_URL}/rest/v1/income_sources_template`, {
        method: 'POST',
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{user_id: currentPersonId, year: currentYear, slot_number: i, source:"", type:true}])
      });
    }
    templateData = await fetchSupabase('income_sources_template', {
      user_id: currentPersonId,
      year: currentYear
    });
  }

  // 2. Реальные суммы
  const incomeRows = await fetchSupabase('income', {
    user_id: currentPersonId,
    year: currentYear,
    month: currentMonth
  });

  for (const row of templateData) {
    let amountVal = 0;
    const rec = incomeRows?.find(r => r.source === row.source);
    if (rec) amountVal = rec.amount;

    const div = document.createElement('div');
    div.classList.add('income-item');
    div.innerHTML = `
      <input type="text" class="income-source" data-slot="${row.slot_number}" value="${row.source||""}" placeholder="Source">
      <input type="number" class="income-amount" data-slot="${row.slot_number}" value="${amountVal}" placeholder="Amount">
      <label class="switch">
         <input type="checkbox" class="income-type-toggle" data-slot="${row.slot_number}" ${row.type?"checked":""}>
         <span class="slider"></span>
      </label>
    `;
    container.appendChild(div);
  }

  // --- события ---
  container.querySelectorAll('.income-source').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot = +e.target.dataset.slot;
      const val = e.target.value;
      await fetch(`${SUPABASE_URL}/rest/v1/income_sources_template?user_id=eq."${currentPersonId}"&year=eq.${currentYear}&slot_number=eq.${slot}`, {
        method: 'PATCH',
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({source: val})
      });
    });
  });

  container.querySelectorAll('.income-amount').forEach(inp=>{
    inp.addEventListener('input', async(e)=>{
      const slot = +e.target.dataset.slot;
      const amount = parseFloat(e.target.value) || 0;
      const srcRow = templateData.find(r=>r.slot_number===slot);
      if(!srcRow || !srcRow.source) return;

      await fetch(`${SUPABASE_URL}/rest/v1/income`, {
        method: 'POST',
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          source: srcRow.source,
          type: srcRow.type,
          amount: amount
        }])
      });
    });
  });

  container.querySelectorAll('.income-type-toggle').forEach(inp=>{
    inp.addEventListener('change', async(e)=>{
      const slot = +e.target.dataset.slot;
      const val = inp.checked;
      const srcRow = templateData.find(r=>r.slot_number===slot);
      if(!srcRow || !srcRow.source) return;

      // обновляем шаблон
      await fetch(`${SUPABASE_URL}/rest/v1/income_sources_template?user_id=eq."${currentPersonId}"&year=eq.${currentYear}&slot_number=eq.${slot}`, {
        method: 'PATCH',
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({type: val})
      });

      // обновляем income
      await fetch(`${SUPABASE_URL}/rest/v1/income`, {
        method: 'POST',
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify([{
          user_id: currentPersonId,
          year: currentYear,
          month: currentMonth,
          source: srcRow.source,
          type: val,
          amount: 0
        }])
      });
    });
  });
}
