# Email System Troubleshooting Guide

## Current Status
The email system is configured to send notifications to:
- **Admin:** `user@befach.com`
- **Shippers:** `dinesh.befach@gmail.com`

## Why Emails Might Not Be Delivered

### 1. Resend API Key Not Configured
**Most Likely Issue:** The Resend API key is not set in Supabase environment variables.

**To Fix:**
1. Go to your Supabase Dashboard
2. Navigate to Project Settings → Edge Functions → Environment Variables
3. Add: `RESEND_API_KEY` with your actual Resend API key
4. If you don't have a Resend account:
   - Sign up at https://resend.com
   - Get your API key from the dashboard
   - Add it to Supabase environment variables

### 2. Domain Verification (For Production)
If using a custom domain for emails, you need to verify it in Resend:
- Add DNS records as specified by Resend
- Verify domain ownership

### 3. Email Provider Blocking
Gmail might be filtering emails:
- Check **Spam/Junk** folder
- Check **Promotions** tab in Gmail
- Add `noreply@befach.com` to contacts

### 4. Rate Limiting
Resend has rate limits for free accounts:
- Free: 100 emails/day
- Check Resend dashboard for usage

## How to Test Email System

### 1. Check Console Logs
When you add a requirement, look for these console messages:
```
🚀 Triggering new requirement email notification
📧 Attempting to send NEW_REQUIREMENT email for: [Product Name]
📡 Calling email API: [API URL]
📬 Email API response status: 200
✅ Email notification result: [Result Object]
```

### 2. Check Browser Notifications
The system now shows visual notifications:
- ✅ **Green:** Emails sent successfully via Resend
- ⚠️ **Yellow:** Email service not configured (check console)
- ❌ **Red:** Email sending failed

### 3. Fallback Mode
If Resend is not configured, emails are logged to console:
```
📧 FALLBACK: RESEND_API_KEY not configured, logging emails to console
📧 WOULD SEND TO: dinesh.befach@gmail.com
📋 SUBJECT: 🚢 New Shipping Requirement: [Product Name]
📄 CONTENT: [Full HTML Email Content]
```

## Quick Setup Steps

### 1. Get Resend API Key
```bash
# 1. Sign up at https://resend.com
# 2. Go to API Keys section
# 3. Create new API key
# 4. Copy the key (starts with 're_')
```

### 2. Add to Supabase
```bash
# In Supabase Dashboard:
# Project Settings → Edge Functions → Environment Variables
# Add: RESEND_API_KEY = your_actual_api_key_here
```

### 3. Test the System
```bash
# 1. Add a new requirement as admin
# 2. Check browser console for logs
# 3. Check browser notifications
# 4. Check dinesh.befach@gmail.com inbox (including spam)
```

## Email Content Preview
The emails include:
- Professional Befach International branding
- Product details (name, HS code, MOQ, description)
- Auction timeline (start/end times)
- Call-to-action buttons
- Mobile-responsive design

## Support
If emails still don't work after following this guide:
1. Check Supabase Edge Function logs
2. Verify Resend account status
3. Test with a different email address
4. Contact Resend support if needed

## Current Email Recipients
- **New Requirements:** All shippers (`dinesh.befach@gmail.com`)
- **New Bids:** All shippers + admin (`dinesh.befach@gmail.com`, `user@befach.com`)