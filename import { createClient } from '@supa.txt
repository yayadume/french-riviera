import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npwhfcczhrqgrbtxyaeu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd2hmY2N6aHJxZ3JidHh5YWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjA3MTcsImV4cCI6MjA5NjkzNjcxN30.Ma8retbs2oC9xDFLb6D4VzerPQCKsj1ehFUklAHQjc8'

export const supabase = createClient(supabaseUrl, supabaseKey)