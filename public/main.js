import { supabase } from './supabase/supabaseClient.js';

let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1; // январь по умолчанию

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();
    // по умолчанию выберем первого человека
    const firstPerson = document.querySelector('.selector-block');
    if (firstPerson) {
        firstPerson.click();
    }
});

function setupPersonSelectors() {
    const persons = document.querySelectorAll('.selector-block[id^="person"]');
    persons.forEach(btn => {
        btn.addEventListener('click', () => {
            // снять выделение со всех
            persons.forEach(b => b.classList.remove('active'));
            // выделить текущего
            btn.classList.add('active');
            currentPerson = btn.textContent.trim();
            console.log(`Выбран человек: ${currentPerson}`);
            loadData();
        });
    });
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            currentMonth = parseInt(monthSelect.value);
            console.log(`Месяц: ${currentMonth}`);
            loadData();
        });
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            console.log(`Год: ${currentYear}`);
            loadData();
        });
    }
}

async function loadData() {
    if (!currentPerson || !currentYear || !currentMonth) return;

    console.log(`Загрузка данных для ${currentPerson} — ${currentMonth}/${currentYear}`);

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

        console.log('Доходы:', incomeData);
        console.log('Расходы:', expenseData);

        renderIncome(incomeData);
        renderExpenses(expenseData);

    } catch (err) {
        console.error('Ошибка загрузки данных:', err.message);
    }
}

function renderIncome(incomeList) {
    const incomeContainer = document.getElementById('incomeList');
    if (!incomeContainer) return;
    incomeContainer.innerHTML = '';

    incomeList.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('income-item');
        div.textContent = `${item.source}: ${item.amount}`;
        incomeContainer.appendChild(div);
    });
}

function renderExpenses(expenseList) {
    const expenseContainer = document.getElementById('expenseList');
    if (!expenseContainer) return;
    expenseContainer.innerHTML = '';

    expenseList.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.textContent = `${item.category}: ${item.amount}`;
        expenseContainer.appendChild(div);
    });
}
