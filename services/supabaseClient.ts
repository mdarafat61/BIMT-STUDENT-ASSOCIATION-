
import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://skaizsaeafminxbqgkmb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYWl6c2FlYWZtaW54YnFna21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDM2ODIsImV4cCI6MjA4NjExOTY4Mn0.m45xDq6kBO56Fhg_14xsYGgIsqKqx4bG6l5NnRs9wuk';

export const supabase = createClient(PROJECT_URL, ANON_KEY);
