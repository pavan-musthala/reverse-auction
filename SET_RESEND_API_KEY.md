# Setting Resend API Key in Supabase

## You Need to Provide Your Resend API Key

Please provide your Resend API key so I can guide you through setting it up.

## If You Don't Have a Resend API Key Yet:

### 1. Get Resend API Key (5 minutes)
```bash
# 1. Go to: https://resend.com
# 2. Sign up for free account (100 emails/day)
# 3. Go to "API Keys" section
# 4. Click "Create API Key"
# 5. Copy the key (starts with 're_')
```

### 2. Set in Supabase Dashboard (Cannot be done via terminal)
Unfortunately, Supabase Edge Function environment variables **must be set through the web dashboard**:

1. **Go to:** https://supabase.com/dashboard
2. **Select your project:** `dtkvzdolpgpmuzitkvgl`
3. **Navigate to:** Project Settings → Edge Functions → Environment Variables
4. **Click:** "Add new variable"
5. **Set:**
   - Name: `RESEND_API_KEY`
   - Value: `your_actual_resend_api_key_here`
6. **Click:** "Save"

### 3. Verify Setup
After setting the API key, we can test it:

```bash
# Test the email function
curl -X POST "https://dtkvzdolpgpmuzitkvgl.supabase.co/functions/v1/send-auction-emails" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NEW_REQUIREMENT",
    "data": {
      "requirementId": "test-123",
      "productName": "Test Product",
      "hsCode": "1234.56",
      "moq": 1000,
      "description": "Test description",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-08T10:00:00Z"
    }
  }'
```

## What Happens Next

Once you set the API key:
1. **Environment variable propagates** (2-5 minutes)
2. **Edge function picks up the key** automatically
3. **Emails start sending** via Resend instead of console logging
4. **You'll see:** "X emails sent successfully via Resend" (where X > 0)

## Current Status
- ✅ Email system is working
- ✅ Edge function is deployed
- ❌ Resend API key not configured
- ❌ 0 emails being sent

## After Setting API Key
- ✅ Email system working
- ✅ Edge function deployed  
- ✅ Resend API key configured
- ✅ Emails being sent to recipients

---

**Please provide your Resend API key and I'll help you verify the setup!**