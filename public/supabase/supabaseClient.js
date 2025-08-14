// public/supabase/supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2tlaGhkeW1ocWN0eGxpb292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNTczMzYsImV4cCI6MjA3MDczMzMzNn0.zE3B0Awm6eS3Gw7WdCu8MlsMJf8tqIkQo4ADiEzKi1o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
