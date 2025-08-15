import { supabase } from './supabase/supabaseClient.js';

let currentPerson = null;
let currentYear = new Date().getFullYear();
let currentMonth = 1; // default January

document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();

    // select first person by default
    const firstPerson = document.querySelector('.selector-block');
    if (firstPerson) firstPerson.click();

    document.getElementById('manualTotal').addEventListener('change', updateManualTotal);
});

function setupPersonSelectors() {
    const persons = document.querySelectorAll('.selector-block[id^="person"]');
    persons.forEach(btn => {
        btn.addEventListener('click', () => {
            persons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPerson = btn.dataset.userid; // using user_id from DB
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
    if (!currentPerson) return;

    const { data, error } = await supabase
        .from('monthly_finance_2')
        .select('*')
        .eq('user_id', currentPerson)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

    if (error) {
        console.error('Error loading data:', error);
        return;
    }

    renderCards(data);
}

function renderCards(data) {
    document.getElementById('sumIncome').textContent = data.sum_income || 0;
    document.getElementById('manualTotal').value = data.sum_expenses || 0;
    document.getElementById('startCash').textContent = data.amount_start || 0;
    document.getElementById('endCash').textContent = data.amount_end || 0;
    document.getElementById('incomePercent').textContent = (data.income_percent || 0).toFixed(2) + '%';
    document.getElementById('fairShare').textContent = (data.fair_share || 0).toFixed(2);
    document.getElementById('difference').textContent = (data.difference || 0).toFixed(2);
}

async function updateManualTotal(e) {
    const newTotal = parseFloat(e.target.value) || 0;

    const { error } = await supabase
        .from('expenses')
        .update({ amount: newTotal })
        .eq('user_id', currentPerson)
        .eq('year', currentYear)
        .eq('month', currentMonth);

    if (error) console.error('Error updating total expenses:', error);
    else loadData(); // refresh cards after update
}
