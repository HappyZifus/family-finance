import { supabase } from './supabase/supabaseClient.js';

let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1;

document.addEventListener('DOMContentLoaded', () => {
    setupPersonButtons();
    setupMonthYearSelectors();

    // select first person by default
    const firstBtn = document.querySelector('.user-btn');
    if (firstBtn) firstBtn.click();
});

function setupPersonButtons() {
    const buttons = document.querySelectorAll('.user-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPerson = btn.dataset.name;
            await loadData();
        });
    });
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    monthSelect.addEventListener('change', async () => {
        currentMonth = parseInt(monthSelect.value);
        await loadData();
    });

    yearSelect.addEventListener('change', async () => {
        currentYear = parseInt(yearSelect.value);
        await loadData();
    });
}

async function loadData() {
    if (!currentPerson) return;

    console.log(`Loading data for ${currentPerson} ${currentMonth}/${currentYear}`);

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

        renderIncome(incomeData);
        renderExpenses(expenseData);

    } catch (err) {
        console.error('Error fetching data:', err.message);
    }
}

function renderIncome(list) {
    const container = document.getElementById('incomeList');
    container.innerHTML = '';
    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('income-item');
        div.textContent = `${item.source}: €${item.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(list) {
    const container = document.getElementById('expenseList');
    container.innerHTML = '';
    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.category}: €${item.amount}`;
        container.appendChild(div);
    });
}
