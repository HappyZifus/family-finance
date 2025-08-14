import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentPersonName = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderUsers();
    setupMonthYearSelectors();
});

// Fetch users and render buttons
async function fetchAndRenderUsers() {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) return console.error(error);

    console.log('Users fetched:', users);

    const container = document.getElementById('personSelectors');
    container.innerHTML = '';

    users.forEach(user => {
        const btn = document.createElement('div');
        btn.classList.add('selector-block');
        btn.textContent = user.name;
        btn.dataset.userId = user.id;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPersonId = user.id;
            currentPersonName = user.name;
            console.log(`Selected person: ${currentPersonName} (${currentPersonId})`);
            loadPersonData();
        });

        container.appendChild(btn);
    });

    if (users.length > 0) container.firstChild.click();
}

// Month/year dropdowns
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

    const currentYearValue = new Date().getFullYear();
    for (let y = currentYearValue - 1; y <= currentYearValue + 1; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    monthSelect.addEventListener('change', () => {
        currentMonth = parseInt(monthSelect.value);
        console.log('Month changed:', currentMonth);
        loadPersonData();
    });

    yearSelect.addEventListener('change', () => {
        currentYear = parseInt(yearSelect.value);
        console.log('Year changed:', currentYear);
        loadPersonData();
    });
}

// Fetch person data
async function loadPersonData() {
    if (!currentPersonId) return;

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('user_id', currentPersonId)
            .eq('month', currentMonth)
            .eq('year', currentYear);

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentPersonId)
            .eq('month', currentMonth)
            .eq('year', currentYear);

        if (incomeError) console.error(incomeError);
        if (expenseError) console.error(expenseError);

        renderIncome(incomeData || []);
        renderExpenses(expenseData || []);
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

function renderIncome(list) {
    const container = document.getElementById('incomeList');
    container.innerHTML = '<h3>Income</h3>';
    list.forEach(item => {
        const div = document.createElement('div');
        div.textContent = `${item.source}: ${item.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(list) {
    const container = document.getElementById('expenseList');
    container.innerHTML = '<h3>Expenses</h3>';
    list.forEach(item => {
        const div = document.createElement('div');
        div.textContent = `${item.type}: ${item.amount}`;
        container.appendChild(div);
    });
}
