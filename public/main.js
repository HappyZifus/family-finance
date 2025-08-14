import { supabase } from './supabase/supabaseClient.js';

let currentPersonId = null;
let currentPersonName = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderUsers();
});

// Fetch users and show them as selection buttons
async function fetchAndRenderUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log('Fetched users:', users); // DEBUG check

    const container = document.getElementById('personSelectors');
    if (!container) {
        console.error('No container with id="personSelectors" found in HTML');
        return;
    }

    container.innerHTML = ''; // clear old

    users.forEach(user => {
        const btn = document.createElement('div');
        btn.classList.add('selector-block');
        btn.textContent = user.name;
        btn.dataset.userId = user.id;

        btn.addEventListener('click', () => {
            // Remove active from all
            document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'));

            // Set active
            btn.classList.add('active');
            currentPersonId = user.id;
            currentPersonName = user.name;

            console.log(`Selected person: ${currentPersonName} (${currentPersonId})`);

            // Later: load their data here
            // loadPersonData();
        });

        container.appendChild(btn);
    });

    // Auto-select first user
    if (users.length > 0) {
        container.firstChild.click();
    }
}
