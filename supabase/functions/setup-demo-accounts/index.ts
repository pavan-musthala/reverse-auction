import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Demo accounts to create
    const demoAccounts = [
      {
        email: 'admin@befach.com',
        password: 'Befach@123',
        user_metadata: {
          name: 'Admin User',
          role: 'admin'
        }
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        email: `shipper${i + 1}@befach.com`,
        password: 'Befach@123',
        user_metadata: {
          name: `Shipper ${i + 1}`,
          role: 'supplier'
        }
      }))
    ]

    const results = []

    for (const account of demoAccounts) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseClient.auth.admin.getUserByEmail(account.email)
        
        if (existingUser.user) {
          results.push({
            email: account.email,
            status: 'exists',
            message: 'User already exists'
          })
          continue
        }

        // Create the user
        const { data, error } = await supabaseClient.auth.admin.createUser({
          email: account.email,
          password: account.password,
          user_metadata: account.user_metadata,
          email_confirm: true // Auto-confirm email
        })

        if (error) {
          results.push({
            email: account.email,
            status: 'error',
            message: error.message
          })
        } else {
          results.push({
            email: account.email,
            status: 'created',
            message: 'User created successfully'
          })
        }
      } catch (error) {
        results.push({
          email: account.email,
          status: 'error',
          message: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})