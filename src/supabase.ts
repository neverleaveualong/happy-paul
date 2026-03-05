import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yaasyswywrcchtvsfcxd.supabase.co';
const supabaseAnonKey = 'sb_publishable_TRvFX6uGJScPsYaujxolbg_8-1uIqrS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
