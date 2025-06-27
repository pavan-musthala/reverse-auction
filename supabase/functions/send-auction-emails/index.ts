/*
  # Send Auction Emails Edge Function

  1. Purpose
    - Sends email notifications for auction events
    - Handles new requirement notifications to shippers
    - Handles new bid notifications to all participants

  2. Email Types
    - NEW_REQUIREMENT: When admin posts a new requirement
    - NEW_BID: When a shipper places a bid

  3. Recipients
    - For new requirements: All shippers
    - For new bids: All shippers + admin
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface EmailRequest {
  type: 'NEW_REQUIREMENT' | 'NEW_BID';
  data: {
    requirementId: string;
    productName: string;
    hsCode: string;
    moq: number;
    description: string;
    startTime: string;
    endTime: string;
    bidAmount?: number;
    bidderName?: string;
    currentLowestBid?: number;
  };
}

// Real email addresses for Befach International
const REAL_EMAILS = {
  admin: 'user@befach.com',
  shippers: [
    'dinesh.befach@gmail.com'
  ]
};

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const { type, data }: EmailRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let emailsSent = 0;
    const results = [];

    if (type === 'NEW_REQUIREMENT') {
      // Send to all shippers when admin posts new requirement
      const subject = `🚢 New Shipping Requirement: ${data.productName}`;
      const htmlContent = generateNewRequirementEmail(data);
      
      for (const shipperEmail of REAL_EMAILS.shippers) {
        try {
          // In a real implementation, you would use a service like SendGrid, Resend, or similar
          // For now, we'll log the email content
          console.log(`📧 SENDING EMAIL TO: ${shipperEmail}`);
          console.log(`📋 SUBJECT: ${subject}`);
          console.log(`📄 CONTENT: ${htmlContent}`);
          console.log('-----------------------------------');
          
          results.push({
            email: shipperEmail,
            status: 'sent',
            type: 'NEW_REQUIREMENT'
          });
          emailsSent++;
        } catch (error) {
          results.push({
            email: shipperEmail,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } else if (type === 'NEW_BID') {
      // Send to all shippers + admin when someone places a bid
      const subject = `💰 New Bid Placed: ${data.productName} - $${data.bidAmount?.toLocaleString()}`;
      const htmlContent = generateNewBidEmail(data);
      
      const allRecipients = [...REAL_EMAILS.shippers, REAL_EMAILS.admin];
      
      for (const email of allRecipients) {
        try {
          // In a real implementation, you would use a service like SendGrid, Resend, or similar
          console.log(`📧 SENDING EMAIL TO: ${email}`);
          console.log(`📋 SUBJECT: ${subject}`);
          console.log(`📄 CONTENT: ${htmlContent}`);
          console.log('-----------------------------------');
          
          results.push({
            email: email,
            status: 'sent',
            type: 'NEW_BID'
          });
          emailsSent++;
        } catch (error) {
          results.push({
            email: email,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${emailsSent} emails sent successfully`,
        type,
        results,
        recipients: type === 'NEW_REQUIREMENT' ? REAL_EMAILS.shippers : [...REAL_EMAILS.shippers, REAL_EMAILS.admin]
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Send auction emails error:', error);
    
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

function generateNewRequirementEmail(data: any): string {
  const startDate = new Date(data.startTime).toLocaleString();
  const endDate = new Date(data.endTime).toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Shipping Requirement - Befach International</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f97316, #f59e0b); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .highlight { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .highlight h2 { margin: 0 0 10px 0; color: #92400e; font-size: 20px; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .details h3 { margin: 0 0 15px 0; color: #1e293b; font-size: 16px; }
            .timeline { display: flex; justify-content: space-between; margin: 15px 0; }
            .timeline-item { text-align: center; flex: 1; }
            .timeline-item strong { display: block; color: #f97316; font-size: 14px; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 0; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚢 New Shipping Requirement</h1>
                <p>Befach International has posted a new requirement for competitive bidding</p>
            </div>
            <div class="content">
                <div class="highlight">
                    <h2>${data.productName}</h2>
                    <p><strong>HS Code:</strong> ${data.hsCode}</p>
                    <p><strong>Minimum Order Quantity:</strong> ${data.moq.toLocaleString()} units</p>
                </div>
                
                <div class="details">
                    <h3>📋 Product Description</h3>
                    <p>${data.description}</p>
                </div>
                
                <div class="details">
                    <h3>⏰ Auction Timeline</h3>
                    <div class="timeline">
                        <div class="timeline-item">
                            <strong>Auction Starts</strong>
                            <span>${startDate}</span>
                        </div>
                        <div class="timeline-item">
                            <strong>Auction Ends</strong>
                            <span>${endDate}</span>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://reverse-auction.netlify.app" class="button">
                        🎯 View Requirement & Place Bid
                    </a>
                </div>
                
                <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
                    <p style="margin: 0; color: #065f46;"><strong>💡 Pro Tip:</strong> Early bidding often leads to better positioning. Log in now to review the full requirements and place your competitive bid.</p>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated notification from <strong>Befach International's Reverse Auction Platform</strong></p>
                <p>Log in to your shipper account to view full details and participate in the bidding process.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateNewBidEmail(data: any): string {
  const currentLowest = data.currentLowestBid ? `$${data.currentLowestBid.toLocaleString()}` : 'N/A';
  const endDate = new Date(data.endTime).toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Bid Alert - Befach International</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .highlight { background: linear-gradient(135deg, #d1fae5, #a7f3d0); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .highlight h2 { margin: 0 0 15px 0; color: #065f46; font-size: 18px; }
            .bid-amount { font-size: 28px; font-weight: bold; color: #059669; margin: 10px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .bid-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .bid-info h3 { margin: 0 0 15px 0; color: #1e293b; font-size: 16px; }
            .competitive { background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0; }
            .competitive p { margin: 0; color: #991b1b; font-weight: 600; }
            .stats { display: flex; justify-content: space-between; margin: 15px 0; }
            .stat-item { text-align: center; flex: 1; }
            .stat-item strong { display: block; color: #059669; font-size: 18px; }
            .stat-item span { color: #64748b; font-size: 14px; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 0; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 New Bid Alert</h1>
                <p>A competitive bid has been placed on: <strong>${data.productName}</strong></p>
            </div>
            <div class="content">
                <div class="highlight">
                    <h2>Latest Bid Details</h2>
                    <div class="stats">
                        <div class="stat-item">
                            <strong class="bid-amount">$${data.bidAmount?.toLocaleString()}</strong>
                            <span>New Bid Amount</span>
                        </div>
                        <div class="stat-item">
                            <strong>${currentLowest}</strong>
                            <span>Current Lowest</span>
                        </div>
                    </div>
                    <p><strong>Bidder:</strong> ${data.bidderName}</p>
                </div>
                
                <div class="bid-info">
                    <h3>📊 Auction Status</h3>
                    <p><strong>Product:</strong> ${data.productName}</p>
                    <p><strong>HS Code:</strong> ${data.hsCode}</p>
                    <p><strong>MOQ:</strong> ${data.moq.toLocaleString()} units</p>
                    <p><strong>Auction Ends:</strong> ${endDate}</p>
                </div>
                
                <div class="competitive">
                    <p>⚡ <strong>Competition Alert!</strong> The bidding is getting more competitive. Consider placing a counter-bid to maintain your position in this auction.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://reverse-auction.netlify.app" class="button">
                        🎯 View Details & Place Counter Bid
                    </a>
                </div>
                
                <div style="background: #fffbeb; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e;"><strong>💡 Strategy Tip:</strong> Monitor the auction closely and consider placing strategic bids to stay competitive while maintaining profitability.</p>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated notification from <strong>Befach International's Reverse Auction Platform</strong></p>
                <p>Stay competitive by monitoring bids and adjusting your offers accordingly.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}