import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ixxoaqihthkxupikqmyr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_CoFepmKQ-Hsls_gjcoszWg_ud2kwMLV'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)