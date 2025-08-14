import { supabase } from './supabase/supabaseClient.js';

let currentUserId = null;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// Containers
const personContainer = document.getElementById('personSelectors');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const incomeContainer = document.getElementById('incomeList');
const expenseContainer = document.getElementById('expenseList');
const totalCashContainer = document.getElementById('totalCash');

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    setupMonthYearSelectors();
});

// Load users and create buttons
async function loadUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name');

    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }

    personContainer.innerHTML = '';
    users.forEach(user => {
        const btn = document.createElement('div');
        btn.className = 'selector-block';
        btn.textContent = user.name;
        btn.dataset.userId = user.id;
        btn.addEventListener('click', () => selectUser(user.id, btn));
        personContainer.appendChild(btn);
    });

    // Select first user by default
    if (users.length > 0) selectUser(users[0].id, personContainer.firstChild);
}

// Handle user selection
function selectUser(userId, btn) {
    currentUserId = userId;
    // Highlight
    personContainer.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Load data
    loadData();
}

// Setup month/year selectors
function setupMonthYearSelectors() {
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    monthSelect.addEventListener('change', () => {
        currentMonth = parseInt(monthSelect.value);
        loadData();
    });

    yearSelect.addEventListener('change', () => {
        currentYear = parseInt(yearSelect.value);
        loadData();
    });
}

// Load income and expenses
async function loadData() {
    if (!currentUserId) return;

    // Income
    const { data: incomes, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

    if (incomeError) {
        console.error('Income fetch error:', incomeError.message);
        return;
    }

    // Expenses
    const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

    if (expenseError) {
        console.error('Expenses fetch error:', expenseError.message);
        return;
    }

    renderIncome(incomes);
    renderExpenses(expenses);
    renderTotals(incomes, expenses);
}

// Render income
function renderIncome(incomes) {
    incomeContainer.innerHTML = '';
    incomes.forEach(i => {
        const div = document.createElement('div');
        div.className = 'income-item';
        div.textContent = `${i.source}: ${i.amount}`;
        incomeContainer.appendChild(div);
    });
}

// Render expenses
function renderExpenses(expenses) {
    expenseContainer.innerHTML = '';
    expenses.forEach(e => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.textContent = `${e.type}: ${e.amount}`;
        expenseContainer.appendChild(div);
    });
}

// Render totals
function renderTotals(incomes, expenses) {
    const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const endCash = totalIncome - totalExpense;

    totalCashContainer.textContent = `Total Cash: ${endCash.toFixed(2)}`;
}
