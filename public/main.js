import { supabase } from './supabase/supabaseClient.js';

async function testFetch() {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            console.error('Error fetching users:', error);
        } else {
            console.log('Users fetched from Supabase:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

document.addEventListener('DOMContentLoaded', testFetch);
