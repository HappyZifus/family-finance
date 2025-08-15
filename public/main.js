import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // January = 1

document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();
    // Select first person by default
    const firstPersonBtn = document.querySelector('.selector-block');
    if (firstPersonBtn) firstPersonBtn.click();
});

function setupPersonSelectors() {
    const personBtns = document.querySelectorAll('.selector-block[id^="person"]');
    personBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            personBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPersonId = btn.dataset.userid; // use user_id
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
            loadData();
        });
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            currentYear = parseInt(yearSelect.value);
            loadData();
        });
    }
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
            .single(); // we expect one row per user per month

        if (error) throw error;

        renderFinanceData(data);
    } catch (err) {
        console.error('Error fetching finance data:', err.message);
    }
}

function renderFinanceData(row) {
    // Example: Update fields in your HTML
    document.getElementById('startCash').textContent = row.start_cash ?? 0;
    document.getElementById('endCash').textContent = row.end_cash ?? 0;
    document.getElementById('income').textContent = row.income ?? 0;
    document.getElementById('expenses').textContent = row.expenses ?? 0;
    document.getElementById('fairShare').textContent = row.fair_share ?? 0;
    document.getElementById('difference').textContent = row.difference ?? 0;
}
