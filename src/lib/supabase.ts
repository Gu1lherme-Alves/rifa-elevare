import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ybnwbhhdwxxwphdzwupv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibndiaGhkd3h4d3BoZHp3dXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3ODEyNDksImV4cCI6MjEwOTM1NzI0OX0.bGX0KWcB91Dd1b5x21LK7E22nFOd5FT-FQ477-wo53U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
