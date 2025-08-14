import { supabase } from './supabase/supabaseClient.js';

let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1; // January by default

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();
    // select first person by default
    const firstPersonBtn = document.querySelector('.selector-block[id^="person"]');
    if (firstPersonBtn) firstPersonBtn.click();
});

// Setup person selection buttons
function setupPersonSelectors() {
    const persons = document.querySelectorAll('.selector-block[id^="person"]');
    persons.forEach(btn => {
        btn.addEventListener('click', () => {
            // remove active from all
            persons.forEach(b => b.classList.remove('active'));
            // highlight current
            btn.classList.add('active');
            currentPerson = btn.textContent.trim();
            console.log(`Selected person: ${currentPerson}`);
            loadData();
        });
    });
}

// Setup month/year selectors
function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            currentMonth = parseInt(monthSelect.value);
            console.log(`Month: ${currentMonth}`);
            loadData();
        });
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            console.log(`Year: ${currentYear}`);
            loadData();
        });
    }
}

// Fetch income and expenses from Supabase
async function loadData() {
    if (!currentPerson || !currentYear || !currentMonth) return;

    console.log(`Loading data for ${currentPerson} — ${currentMonth}/${currentYear}`);

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('person', currentPerson)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (incomeError) throw incomeError;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('person', currentPerson)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (expenseError) throw expenseError;

        console.log('Income:', incomeData);
        console.log('Expenses:', expenseData);

        renderIncome(incomeData);
        renderExpenses(expenseData);

    } catch (err) {
        console.error('Error loading data:', err.message);
    }
}

// Render income
function renderIncome(incomeList) {
    const incomeContainer = document.getElementById('incomeList');
    if (!incomeContainer) return;
    incomeContainer.innerHTML = '';

    incomeList.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('income-item');
        div.textContent = `${item.source}: ${item.amount} €`;
        incomeContainer.appendChild(div);
    });
}

// Render expenses
function renderExpenses(expenseList) {
    const expenseContainer = document.getElementById('expenseList');
    if (!expenseContainer) return;
    expenseContainer.innerHTML = '';

    expenseList.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.type}: ${item.amount} €`;
        expenseContainer.appendChild(div);
    });
}
