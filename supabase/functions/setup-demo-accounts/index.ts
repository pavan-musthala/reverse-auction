/*
  # Setup Demo Accounts Edge Function

  1. Purpose
    - Creates demo admin and supplier accounts for testing
    - Ensures consistent demo data across environments
    - Handles account creation with proper error handling

  2. Security
    - Uses service role key for user creation
    - Implements proper CORS headers
    - Handles duplicate account scenarios gracefully

  3. Accounts Created
    - Admin: admin@befach.com / admin123
    - Supplier: supplier@befach.com / supplier123
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'supplier';
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@befach.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'supplier@befach.com',
    password: 'supplier123',
    name: 'Demo Supplier',
    role: 'supplier'
  }
];

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    for (const account of demoAccounts) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(account.email);
        
        if (existingUser.user) {
          results.push({
            email: account.email,
            status: 'exists',
            message: 'User already exists'
          });
          continue;
        }

        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            name: account.name,
            role: account.role
          }
        });

        if (createError) {
          results.push({
            email: account.email,
            status: 'error',
            message: createError.message
          });
          continue;
        }

        results.push({
          email: account.email,
          status: 'created',
          message: 'User created successfully',
          userId: newUser.user?.id
        });

      } catch (error) {
        results.push({
          email: account.email,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo accounts setup completed',
        results
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Setup demo accounts error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});