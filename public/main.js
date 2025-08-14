import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2tlaGhkeW1ocWN0eGxpb292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTczMzYsImV4cCI6MjA3MDczMzMzNn0.zE3B0Awm6eS3Gw7WdCu8MlsMJf8tqIkQo4ADiEzKi1o';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentPerson = null;
let currentMonth = new Date().getMonth() + 1; // January = 1
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    setupPersonSelectors();
    setupMonthYearSelectors();
    // select first person by default
    const firstBtn = document.querySelector('.selector-block');
    if (firstBtn) firstBtn.click();
});

function setupPersonSelectors() {
    const buttons = document.querySelectorAll('.selector-block');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPerson = btn.textContent.trim();
            await loadData();
        });
    });
}

function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    // populate month
    for (let m = 1; m <= 12; m++) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        if (m === currentMonth) opt.selected = true;
        monthSelect.appendChild(opt);
    }

    // populate year (last 5 years)
    const current = new Date().getFullYear();
    for (let y = current - 4; y <= current; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

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

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('person', currentPerson)
            .eq('month', currentMonth)
            .eq('year', currentYear);

        if (incomeError) throw incomeError;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('person', currentPerson)
            .eq('month', currentMonth)
            .eq('year', currentYear);

        if (expenseError) throw expenseError;

        renderList('incomeList', incomeData, 'source');
        renderList('expenseList', expenseData, 'type');

    } catch (err) {
        console.error('Error loading data:', err.message);
    }
}

function renderList(containerId, list, fieldName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    list.forEach(item => {
        const div = document.createElement('div');
        div.className = containerId === 'incomeList' ? 'income-item' : 'expense-item';
        div.textContent = `${item[fieldName]}: ${item.amount}`;
        container.appendChild(div);
    });
}
