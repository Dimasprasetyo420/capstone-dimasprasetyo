import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cazbelaeqaejrgqnzqsc.supabase.co'
const supabaseAnonKey = 'sb_publishable_E2Nz_4sa-qIfj8yPHXGCGw_dt70ywBV'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)