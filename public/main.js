import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1;

// DOM Elements
const startCashEl = document.getElementById('startCash');
const endCashEl = document.getElementById('endCash');
const incomePercentEl = document.getElementById('incomePercent');
const totalExpensesEl = document.getElementById('totalExpenses');
const fairShareEl = document.getElementById('fairShare');
const differenceEl = document.getElementById('difference');

const incomeListEl = document.getElementById('incomeList');
const expenseListEl = document.getElementById('expenseList');
const yearlySummaryEl = document.getElementById('yearlySummary');

// Setup selectors
document.addEventListener('DOMContentLoaded', () => {
    setupPersonButtons();
    setupMonthYearSelectors();
    document.querySelector('.person-btn')?.click();
});

function setupPersonButtons() {
    const buttons = document.querySelectorAll('.person-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPersonId = btn.dataset.id;
            loadData();
        });
    });
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
    if (!currentPersonId) return;

    try {
        const { data, error } = await supabase
            .from('monthly_finance_2')
            .select('*')
            .eq('user_id', currentPersonId)
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .single();

        if (error) throw error;

        // Top stats
        startCashEl.textContent = data.amount_start ?? 0;
        endCashEl.textContent = data.amount_end ?? 0;
        incomePercentEl.textContent = `${data.income_percent?.toFixed(1) ?? 0}%`;
        totalExpensesEl.textContent = data.sum_expenses ?? 0;
        fairShareEl.textContent = data.fair_share ?? 0;
        differenceEl.textContent = data.difference ?? 0;

        // Income & Expenses
        renderList(incomeListEl, data.sum_income, 'Income');
        renderList(expenseListEl, data.sum_expenses, 'Expense');

        // Yearly summary placeholder
        yearlySummaryEl.textContent = `Income %: ${data.income_percent?.toFixed(1) ?? 0}%, Fair Share: ${data.fair_share ?? 0}`;

    } catch (err) {
        console.error('Error fetching data:', err.message);
    }
}

function renderList(container, value, type) {
    container.innerHTML = '';
    const div = document.createElement('div');
    div.textContent = `${type}: ${value}`;
    container.appendChild(div);
}
