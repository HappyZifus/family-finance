import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await setupPersonSelectors();
    setupMonthYearSelectors();
});

async function setupPersonSelectors() {
    const { data: users, error } = await supabase.from('users').select('id,name');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

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
            loadData();
        });

        container.appendChild(btn);
    });

    // Automatically select first person
    if (users.length > 0) {
        currentPersonId = users[0].id;
        container.firstChild.classList.add('active');
        loadData();
    }
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

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

    console.log(`Loading data for user ${currentPersonId}, ${currentMonth}/${currentYear}`);

    const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('month', currentMonth);

    if (incomeError) console.error(incomeError);

    const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('month', currentMonth);

    if (expenseError) console.error(expenseError);

    renderIncome(incomeData || []);
    renderExpenses(expenseData || []);
}

function renderIncome(items) {
    const container = document.getElementById('incomeList');
    container.innerHTML = '';
    items.forEach(i => {
        const div = document.createElement('div');
        div.className = 'income-item';
        div.textContent = `${i.source}: ${i.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(items) {
    const container = document.getElementById('expenseList');
    container.innerHTML = '';
    items.forEach(i => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.textContent = `${i.type}: ${i.amount}`;
        container.appendChild(div);
    });
}
