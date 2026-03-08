import { createClient } from '@supabase/supabase-js'
const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const valid = URL && KEY && URL.startsWith('https://')
export const supabase = valid ? createClient(URL, KEY) : null
export const CLIENT = 'accrease'
