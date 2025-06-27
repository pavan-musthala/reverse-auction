import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error handling and logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
  });
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format. Must start with https://');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const isConfigured = !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    supabaseAnonKey.length > 20);
  
  if (!isConfigured) {
    console.warn('Supabase is not properly configured:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlFormat: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
      keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
    });
  }
  
  return isConfigured;
};

// Test connection function with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    if (!isSupabaseConfigured()) {
      console.error('Supabase configuration invalid');
      return false;
    }

    const { data, error } = await supabase
      .from('requirements')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return false;
  }
};

// Initialize connection test on module load with delay
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection();
    }
  }, 2000); // Increased delay to avoid race conditions
}