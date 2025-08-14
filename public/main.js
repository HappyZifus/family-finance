import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1; // January by default

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await setupPersonButtons();
    setupMonthYearSelectors();
});

// Load person buttons dynamically
async function setupPersonButtons() {
    const container = document.querySelector('.top-selectors');
    if (!container) return;

    // Fetch two people from Supabase
    const { data: persons, error } = await supabase
        .from('persons')
        .select('*')
        .order('idx', { ascending: false });

    if (error) {
        console.error('Error loading persons:', error.message);
        return;
    }

    container.innerHTML = ''; // clear any placeholders

    persons.forEach(person => {
        const btn = document.createElement('div');
        btn.classList.add('selector-block');
        btn.textContent = person.name;
        btn.dataset.id = person.id;

        btn.addEventListener('click', () => {
            // Remove active from all
            document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentPersonId = person.id;
            loadData();
        });

        container.appendChild(btn);
    });

    // Auto-select first person
    if (persons.length > 0) {
        const firstBtn = container.querySelector('.selector-block');
        firstBtn.click();
    }
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    monthSelect?.addEventListener('change', () => {
        currentMonth = parseInt(monthSelect.value);
        loadData();
    });

    yearSelect?.addEventListener('change', () => {
        currentYear = parseInt(yearSelect.value);
        loadData();
    });
}

async function loadData() {
    if (!currentPersonId) return;

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('person', currentPersonId)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (incomeError) throw incomeError;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('person', currentPersonId)
            .eq('year', currentYear)
            .eq('month', currentMonth);

        if (expenseError) throw expenseError;

        renderIncome(incomeData);
        renderExpenses(expenseData);
    } catch (err) {
        console.error('Error loading data:', err.message);
    }
}

function renderIncome(incomeList) {
    const container = document.getElementById('incomeList');
    if (!container) return;
    container.innerHTML = '';

    incomeList.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('income-item');
        div.textContent = `${item.source}: ${item.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(expenseList) {
    const container = document.getElementById('expenseList');
    if (!container) return;
    container.innerHTML = '';

    expenseList.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.type}: ${item.amount}`;
        container.appendChild(div);
    });
}
