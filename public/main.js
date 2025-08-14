// main.js
import { createClient } from '@supabase/supabase-js';

// --- Supabase setup ---
const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2tlaGhkeW1ocWN0eGxpb292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTczMzYsImV4cCI6MjA3MDczMzMzNn0.zE3B0Awm6eS3Gw7WdCu8MlsMJf8tqIkQo4ADiEzKi1o';
export const supabase = createClient(supabaseUrl, supabaseKey);

// --- State ---
let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1;

// --- Initialize after DOM loads ---
document.addEventListener('DOMContentLoaded', () => {
    setupPersonButtons();
    setupMonthYearSelectors();

    // Default select first person
    const firstPersonBtn = document.querySelector('.selector-block');
    if (firstPersonBtn) firstPersonBtn.click();
});

// --- Person Buttons ---
function setupPersonButtons() {
    const buttons = document.querySelectorAll('.selector-block[id^="person"]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentPerson = btn.dataset.name; // we'll use data-name attribute
            console.log('Selected person:', currentPerson);
            loadData();
        });
    });
}

// --- Month/Year selectors ---
function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            currentMonth = parseInt(monthSelect.value);
            console.log('Month selected:', currentMonth);
            loadData();
        });
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            console.log('Year selected:', currentYear);
            loadData();
        });
    }
}

// --- Load Data ---
async function loadData() {
    if (!currentPerson) return;

    console.log(`Loading data for ${currentPerson}, ${currentMonth}/${currentYear}`);

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('name', currentPerson)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (incomeError) throw incomeError;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('name', currentPerson)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (expenseError) throw expenseError;

        console.log('Income:', incomeData);
        console.log('Expenses:', expenseData);

        renderIncome(incomeData);
        renderExpenses(expenseData);

    } catch (err) {
        console.error('Error fetching data:', err.message);
    }
}

// --- Render Income ---
function renderIncome(list) {
    const container = document.getElementById('incomeList');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('income-item');
        div.textContent = `${item.source}: €${item.amount}`;
        container.appendChild(div);
    });
}

// --- Render Expenses ---
function renderExpenses(list) {
    const container = document.getElementById('expenseList');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.type}: €${item.amount}`; // use type instead of category
        container.appendChild(div);
    });
}
