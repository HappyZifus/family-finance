import { supabase } from './supabase/supabaseClient.js';

let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();

    const firstPerson = document.querySelector('.selector-block');
    if(firstPerson){
        firstPerson.click();
    }
});

function setupPersonSelectors() {
    const persons = document.querySelectorAll('.selector-block');
    persons.forEach(btn => {
        btn.addEventListener('click', () => {
            persons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPerson = btn.textContent.trim();
            loadData();
        });
    });
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

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

async function loadData() {
    if(!currentPerson) return;

    try {
        const { data, error } = await supabase
            .from('monthly_finance_2')
            .select('*')
            .eq('user_name', currentPerson)
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .single();

        if(error) throw error;

        if(data){
            document.getElementById('startCash').textContent = data.amount_start ?? 0;
            document.getElementById('endCash').textContent = data.amount_end ?? 0;
            document.getElementById('incomePercent').textContent = data.income_percent?.toFixed(2) ?? 0;
            document.getElementById('fairShare').textContent = data.fair_share?.toFixed(2) ?? 0;
            document.getElementById('difference').textContent = data.difference?.toFixed(2) ?? 0;

            renderIncome(data.income_list || []);
            renderExpenses(data.expense_list || []);
        }
    } catch (err) {
        console.error('Error loading data:', err.message);
    }
}

function renderIncome(list){
    const container = document.getElementById('incomeList');
    container.innerHTML = '<h3>Income</h3>';
    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'income-item';
        div.textContent = `${item.type}: ${item.amount}`;
        container.appendChild(div);
    });
}

function renderExpenses(list){
    const container = document.getElementById('expenseList');
    container.innerHTML = '<h3>Expenses</h3>';
    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.textContent = `${item.type}: ${item.amount}`;
        container.appendChild(div);
    });
}
