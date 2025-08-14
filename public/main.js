import { supabase } from './supabase/supabaseClient.js';

let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1; // January default

document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();
    // select first person by default
    const firstPerson = document.querySelector('.selector-block');
    if (firstPerson) firstPerson.click();
});

function setupPersonSelectors() {
    const persons = document.querySelectorAll('.selector-block[id^="person"]');
    persons.forEach(btn => {
        btn.addEventListener('click', () => {
            // remove active from all
            persons.forEach(b => b.classList.remove('active'));
            // set active for current
            btn.classList.add('active');
            currentPerson = btn.dataset.name || btn.textContent.trim();
            console.log('Selected person:', currentPerson);
            loadData();
        });
    });
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            currentMonth = monthSelect.selectedIndex + 1;
            console.log('Month:', currentMonth);
            loadData();
        });
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            console.log('Year:', currentYear);
            loadData();
        });
    }
}

async function loadData() {
    if (!currentPerson || !currentYear || !currentMonth) return;

    console.log(`Loading data for ${currentPerson} - ${currentMonth}/${currentYear}`);

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
        console.error('Data load error:', err.message);
    }
}

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

function renderExpenses(list) {
    const container = document.getElementById('expenseList');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.type}: €${item.amount}`;
        container.appendChild(div);
    });
}
