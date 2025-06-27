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
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
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

// Test connection function with better error handling and retry logic
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      if (!isSupabaseConfigured()) {
        console.error('Supabase configuration invalid');
        return false;
      }

      // Test with a simple query that should always work
      const { data, error } = await supabase
        .from('requirements')
        .select('count')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        console.error(`Supabase connection test failed (attempt ${attempt}):`, error);
        if (attempt === retries) {
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      console.log('Supabase connection test successful');
      return true;
    } catch (err) {
      console.error(`Supabase connection test error (attempt ${attempt}):`, err);
      if (attempt === retries) {
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
};

// Initialize connection test on module load with delay and retry
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    if (isSupabaseConfigured()) {
      const connected = await testSupabaseConnection();
      if (!connected) {
        console.warn('Supabase connection failed after multiple attempts');
        // Show user notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">⚠️</span>
            <div>
              <div style="font-weight: 600;">Connection Issue</div>
              <div style="opacity: 0.9; font-size: 12px;">Database connection unstable</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 8000);
      }
    }
  }, 3000); // Increased delay to avoid race conditions
}