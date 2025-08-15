import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

document.addEventListener('DOMContentLoaded', async () => {
  // create two test buttons manually
  const persons = [
    { id: 'a833b039-f440-4474-b566-3333e73398c8', name: 'Lesha' },
    { id: '5148e3c8-adab-484c-975c-f2f5b494fb4f', name: 'Lena' }
  ];

  const container = document.getElementById('personSelectors');
  persons.forEach((p, idx) => {
    const btn = document.createElement('div');
    btn.classList.add('selector-block');
    btn.textContent = p.name;
    btn.dataset.userid = p.id;
    btn.addEventListener('click', () => {
      currentPersonId = p.id;
      container.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadData();
    });
    container.appendChild(btn);
    if (idx === 0) btn.click(); // select first by default
  });

  setupMonthYearSelectors();
});

function setupMonthYearSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  const startYear = 2023;
  const endYear = new Date().getFullYear();
  for (let y = startYear; y <= endYear; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  monthSelect.addEventListener('change', () => {
    currentMonth = parseInt(monthSelect.value);
    loadData();
  });
  yearSelect.addEventListener('change', () => {
    currentYear = parseInt(yearSelect.value);
    loadData();
  });
}

async function loadData() {
  if (!currentPersonId) return;

  console.log('Fetching data for:', currentPersonId, currentMonth, currentYear);

  const { data, error } = await supabase
    .from('monthly_finance_2')
    .select('*')
    .eq('user_id', currentPersonId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .single();

  if (error) {
    console.error('Fetch error:', error);
  } else {
    console.log('Data fetched:', data);
  }
}
