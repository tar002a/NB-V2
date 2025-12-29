import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drcxtyyuhtikrugulkow.supabase.co';
// Using the provided Anon Public Key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyY3h0eXl1aHRpa3J1Z3Vsa293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDI1ODksImV4cCI6MjA4MjU3ODU4OX0.tETAjlnuStEAJ4m4g0OXhhjnM7NHPvGLRdMfq7EuXx8';

export const supabase = createClient(supabaseUrl, supabaseKey);
