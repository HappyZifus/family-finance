import { supabase } from './supabase/supabaseClient.js';

let currentUserId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-12

// Initialize after DOM loaded
document.addEventListener('DOMContentLoaded', async () => {
    await setupPersonButtons();
    setupMonthYearSelectors();
});

// Set up person buttons dynamically from users table
async function setupPersonButtons() {
    const container = document.getElementById('personButtons');
    if (!container) return;

    try {
        const { data: users, error } = await supabase.from('users').select('id,name');
        if (error) throw error;

        container.innerHTML = '';
        users.forEach(user => {
            const btn = document.createElement('div');
            btn.classList.add('selector-block');
            btn.textContent = user.name;
            btn.dataset.userId = user.id;

            btn.addEventListener('click', () => {
                // Remove active from all buttons
                container.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentUserId = user.id;
                loadData();
            });

            container.appendChild(btn);
        });

        // Select first user by default
        const firstBtn = container.querySelector('.selector-block');
        if (firstBtn) firstBtn.click();

    } catch (err) {
        console.error('Error fetching users:', err.message);
    }
}

// Month and year selectors
function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect) {
        for (let m = 1; m <= 12; m++) {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if (m === currentMonth) opt.selected = true;
            monthSelect.appendChild(opt);
        }
        monthSelect.addEventListener('change', () => {
            currentMonth = parseInt(monthSelect.value);
            loadData();
        });
    }

    if (yearSelect) {
        const startYear = 2020;
        const endYear = new Date().getFullYear() + 1;
        for (let y = startYear; y <= endYear; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === currentYear) opt.selected = true;
            yearSelect.appendChild(opt);
        }
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            loadData();
        });
    }
}

// Load income, expenses, total_cash
async function loadData() {
    if (!currentUserId) return;

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (incomeError) throw incomeError;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (expenseError) throw expenseError;

        const { data: totalCashData, error: cashError } = await supabase
            .from('total_cash')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .single();

        if (cashError && cashError.code !== 'PGRST116') throw cashError; // PGRST116 = no row found

        renderIncome(incomeData);
        renderExpenses(expenseData);
        renderTotalCash(totalCashData);

    } catch (err) {
        console.error('Error loading data:', err.message);
    }
}

// Render helpers
function renderIncome(list) {
    const container = document.getElementById('incomeList');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('income-item');
        div.textContent = `${item.source}: ${item.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(list) {
    const container = document.getElementById('expenseList');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.type}: ${item.amount}`;
        container.appendChild(div);
    });
}

function renderTotalCash(data) {
    const container = document.getElementById('totalCash');
    if (!container) return;
    container.textContent = data ? `Cash: ${data.amount}` : 'Cash: 0';
}
