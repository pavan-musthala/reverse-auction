# Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account
3. Have your Supabase credentials ready

### Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Follow the CLI prompts**:
   - Link to existing project or create new one
   - Confirm project settings
   - Deploy

4. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Alternative: Deploy via Vercel Dashboard

1. Connect your GitHub repository to Vercel
2. Import the project
3. Set the environment variables
4. Deploy

### Configuration

The `vercel.json` file is already configured with:
- Vite framework detection
- Proper build settings
- SPA routing support
- Asset caching headers

### Environment Variables Required

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Post-Deployment

After deployment:
1. Test all functionality
2. Verify Supabase connection
3. Test authentication flows
4. Verify real-time updates work

## Current Netlify Deployment

The application is currently deployed at: https://reverse-auction.netlify.app

If you prefer to keep using Netlify, no additional setup is required.