# Configure Resend API Key - Step by Step

## Your Resend API Key
```
re_UGTV5TZz_CbipSEgUUnEu964xQzDkd91y
```

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Log into your account
3. Select your project: `dtkvzdolpgpmuzitkvgl`

### 2. Navigate to Environment Variables
1. Click on **"Project Settings"** (gear icon in sidebar)
2. Click on **"Edge Functions"** in the left menu
3. Click on **"Environment Variables"** tab

### 3. Add the Resend API Key
1. Click **"Add new variable"** button
2. Fill in the form:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_UGTV5TZz_CbipSEgUUnEu964xQzDkd91y`
3. Click **"Save"** or **"Add Variable"**

### 4. Wait for Propagation
- Environment variables take **2-5 minutes** to propagate to Edge Functions
- You don't need to redeploy anything - it happens automatically

### 5. Test the Email System
1. **Add a new requirement** as admin in your app
2. **Watch the console logs** - you should see:
   ```
   ✅ Email notification result: {
     "message": "1 emails sent successfully via Resend",  // ← Should be > 0 now
     "provider": "Resend"
   }
   ```
3. **Check email inbox:** `dinesh.befach@gmail.com` (including spam folder)
4. **Look for browser notification:** Green popup saying "📧 Emails Sent!"

## What You Should See After Setup

### Console Logs (Success):
```
🚀 Triggering new requirement email notification
📧 Attempting to send NEW_REQUIREMENT email for: [Product Name]
📬 Email API response status: 200
✅ Email notification result: {
  "success": true,
  "message": "1 emails sent successfully via Resend",
  "recipients": ["dinesh.befach@gmail.com"],
  "provider": "Resend"
}
📧 1 emails sent successfully via Resend to: ["dinesh.befach@gmail.com"]
```

### Browser Notification:
- **Green notification:** "📧 Emails Sent! 1 recipients notified"

### Email Delivery:
- **To:** dinesh.befach@gmail.com
- **Subject:** "🚢 New Shipping Requirement: [Product Name]"
- **From:** Befach International <noreply@befach.com>
- **Content:** Professional HTML email with product details

## Troubleshooting

### If Still Getting "0 emails sent":
1. **Wait 5 minutes** for environment variable to propagate
2. **Double-check the API key** in Supabase dashboard (no extra spaces)
3. **Try adding another requirement** to test again

### If Emails Don't Arrive:
1. **Check spam/junk folder** in Gmail
2. **Check Promotions tab** in Gmail  
3. **Add noreply@befach.com to contacts**
4. **Check Resend dashboard** at https://resend.com for delivery logs

## Current Email Recipients
- **New Requirements:** `dinesh.befach@gmail.com`
- **New Bids:** `dinesh.befach@gmail.com` + `user@befach.com`

---

## Next Steps
1. **Set the API key** in Supabase dashboard (steps above)
2. **Wait 5 minutes** for propagation
3. **Test by adding a requirement**
4. **Check dinesh.befach@gmail.com inbox**
5. **Confirm you see "X emails sent successfully via Resend" where X > 0**

The email system is fully configured and ready - it just needs the API key to be set in the Supabase dashboard!