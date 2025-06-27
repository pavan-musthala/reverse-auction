# Resend Email Setup Guide - Fix Email Delivery

## The Problem
Your logs show: **"0 emails sent successfully via Resend"**

This means the email system is working, but Resend is not actually sending emails because the API key is not properly configured.

## Step-by-Step Fix

### 1. Get Your Resend API Key
1. Go to https://resend.com
2. Sign up for a free account (100 emails/day free)
3. Once logged in, go to **API Keys** section
4. Click **"Create API Key"**
5. Copy the key (it starts with `re_`)

### 2. Add API Key to Supabase
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `dtkvzdolpgpmuzitkvgl`
3. Navigate to: **Project Settings** → **Edge Functions** → **Environment Variables**
4. Click **"Add new variable"**
5. Set:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Your actual Resend API key (starts with `re_`)
6. Click **"Save"**

### 3. Restart Edge Functions (Important!)
After adding the environment variable:
1. Go to **Edge Functions** in your Supabase dashboard
2. Find the `send-auction-emails` function
3. Click **"Redeploy"** or wait a few minutes for it to pick up the new environment variable

### 4. Test Again
1. Add a new requirement as admin
2. Watch the console logs
3. You should now see: **"X emails sent successfully via Resend"** (where X > 0)
4. Check `dinesh.befach@gmail.com` inbox (and spam folder)

## What You'll See When It Works

### Console Logs (Success):
```
🚀 Triggering new requirement email notification
📧 Attempting to send NEW_REQUIREMENT email for: Test Product
📡 Calling email API: https://dtkvzdolpgpmuzitkvgl.supabase.co/functions/v1/send-auction-emails
📬 Email API response status: 200
✅ Email notification result: {
  "success": true,
  "message": "1 emails sent successfully via Resend",  // ← This should be > 0
  "recipients": ["dinesh.befach@gmail.com"],
  "provider": "Resend"
}
```

### Browser Notification:
- Green notification: "📧 Emails Sent! 1 recipients notified"

### Email Delivery:
- Email should arrive in `dinesh.befach@gmail.com` within 1-2 minutes
- Check spam folder if not in inbox
- Subject: "🚢 New Shipping Requirement: [Product Name]"

## Troubleshooting

### If Still Getting "0 emails sent":
1. **Double-check API key:** Make sure it's exactly as copied from Resend (no extra spaces)
2. **Verify Resend account:** Log into Resend dashboard and check if account is active
3. **Check Resend limits:** Free accounts have 100 emails/day limit
4. **Wait for deployment:** Environment variables can take a few minutes to propagate

### If Emails Still Don't Arrive:
1. **Check spam folder** in Gmail
2. **Check Promotions tab** in Gmail
3. **Try different email:** Test with another email address
4. **Check Resend logs:** Go to Resend dashboard → Logs to see delivery status

## Alternative Test Email
If you want to test with a different email address, you can temporarily modify the email list in the Edge Function:

```typescript
// In supabase/functions/send-auction-emails/index.ts
const REAL_EMAILS = {
  admin: 'user@befach.com',
  shippers: [
    'dinesh.befach@gmail.com',
    'your-test-email@gmail.com'  // Add your test email here
  ]
};
```

## Expected Timeline
- **Resend setup:** 5 minutes
- **Supabase configuration:** 2 minutes  
- **Environment variable propagation:** 2-5 minutes
- **Email delivery:** 1-2 minutes after sending

Total time to fix: **10-15 minutes**

## Need Help?
If you're still having issues after following this guide:
1. Check your Resend dashboard for any error messages
2. Verify your Supabase project has the correct environment variable
3. Try redeploying the Edge Function manually