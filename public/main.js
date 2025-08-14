import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// Populate months and years
document.addEventListener('DOMContentLoaded', async () => {
    setupMonthYearSelectors();
    await loadUsers();  // load user buttons dynamically
});

async function loadUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('idx', { ascending: true });

    if (error) {
        console.error('Error loading users:', error);
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
            // Remove active from all buttons
            document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPersonId = user.id;
            loadData();
        });
        container.appendChild(btn);
    });

    // Select first user by default
    if (users.length > 0) {
        const firstBtn = container.querySelector('.selector-block');
        firstBtn.click();
    }
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    // Months 1-12
    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        if (m === currentMonth) opt.selected = true;
        monthSelect.appendChild(opt);
    }

    // Years: currentYear -1, currentYear, currentYear +1
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
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

    // Fetch income
    const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', currentPersonId)
        .eq('year', currentYear)
        .eq('month', currentMonth);

    if (incomeError) console.error(incomeError);

    // Fetch expenses
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
        div.textContent = `${i.source || 'Unknown'}: ${i.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(items) {
    const container = document.getElementById('expenseList');
    container.innerHTML = '';
    items.forEach(e => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.textContent = `${e.type || 'Unknown'}: ${e.amount}`;
        container.appendChild(div);
    });
}
