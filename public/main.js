import { supabase } from './supabaseClient.js';

let currentUserId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    setupMonthYearSelectors();
});

async function loadUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const userContainer = document.getElementById('personSelectors');
    userContainer.innerHTML = '';

    users.forEach(user => {
        const btn = document.createElement('div');
        btn.classList.add('selector-block');
        btn.textContent = user.name;
        btn.dataset.userId = user.id;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUserId = user.id;
            loadData();
        });

        userContainer.appendChild(btn);
    });

    // Select first user by default
    if (users.length > 0) {
        currentUserId = users[0].id;
        userContainer.firstChild.classList.add('active');
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
    if (!currentUserId) return;

    try {
        // Fetch income
        const { data: income, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('month', currentMonth)
            .eq('year', currentYear);

        if (incomeError) throw incomeError;

        // Fetch expenses
        const { data: expenses, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('month', currentMonth)
            .eq('year', currentYear);

        if (expenseError) throw expenseError;

        renderIncome(income);
        renderExpenses(expenses);

    } catch (err) {
        console.error('Error loading data:', err);
    }
}

function renderIncome(incomeList) {
    const container = document.getElementById('incomeList');
    container.innerHTML = '';
    incomeList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'income-item';
        div.textContent = `${item.source}: ${item.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(expenseList) {
    const container = document.getElementById('expenseList');
    container.innerHTML = '';
    expenseList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.textContent = `${item.type}: ${item.amount}`;
        container.appendChild(div);
    });
}
