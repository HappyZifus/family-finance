import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2tlaGhkeW1ocWN0eGxpb292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTczMzYsImV4cCI6MjA3MDczMzMzNn0.zE3B0Awm6eS3Gw7WdCu8MlsMJf8tqIkQo4ADiEzKi1o';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentPerson = null;

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.selector-block');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remove active from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            currentPerson = btn.textContent.trim();
            console.log('Selected person:', currentPerson);

            // Load income and expenses for selected person
            await loadData(currentPerson);
        });
    });
});

async function loadData(person) {
    if (!person) return;

    try {
        const { data: incomeData, error: incomeError } = await supabase
            .from('income')
            .select('*')
            .eq('person', person);

        if (incomeError) throw incomeError;

        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('person', person);

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
