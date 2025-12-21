// frontend/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// PHẢI CÓ CHỮ 'export' Ở ĐÂY
export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;