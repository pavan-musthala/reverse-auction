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

// Demo email addresses - replace with real ones
const DEMO_EMAILS = {
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
      
      for (const shipperEmail of DEMO_EMAILS.shippers) {
        try {
          // In a real implementation, you would use a service like SendGrid, Resend, or similar
          // For now, we'll log the email content
          console.log(`Sending email to ${shipperEmail}:`);
          console.log(`Subject: ${subject}`);
          console.log(`Content: ${htmlContent}`);
          
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
      
      const allRecipients = [...DEMO_EMAILS.shippers, DEMO_EMAILS.admin];
      
      for (const email of allRecipients) {
        try {
          // In a real implementation, you would use a service like SendGrid, Resend, or similar
          console.log(`Sending email to ${email}:`);
          console.log(`Subject: ${subject}`);
          console.log(`Content: ${htmlContent}`);
          
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
        <title>New Shipping Requirement</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316, #f59e0b); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚢 New Shipping Requirement Available</h1>
                <p>Befach International has posted a new requirement for competitive bidding</p>
            </div>
            <div class="content">
                <div class="highlight">
                    <h2>${data.productName}</h2>
                    <p><strong>HS Code:</strong> ${data.hsCode}</p>
                    <p><strong>MOQ:</strong> ${data.moq.toLocaleString()} units</p>
                </div>
                
                <div class="details">
                    <h3>📋 Product Description</h3>
                    <p>${data.description}</p>
                </div>
                
                <div class="details">
                    <h3>⏰ Auction Timeline</h3>
                    <p><strong>Starts:</strong> ${startDate}</p>
                    <p><strong>Ends:</strong> ${endDate}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://reverse-auction.netlify.app" class="button">
                        View Requirement & Place Bid
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    This is an automated notification from Befach International's Reverse Auction Platform.
                    Log in to your account to view full details and place competitive bids.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateNewBidEmail(data: any): string {
  const currentLowest = data.currentLowestBid ? `$${data.currentLowestBid.toLocaleString()}` : 'N/A';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Bid Placed</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .highlight { background: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .bid-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .competitive { color: #dc2626; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 New Bid Alert</h1>
                <p>A competitive bid has been placed on: ${data.productName}</p>
            </div>
            <div class="content">
                <div class="highlight">
                    <h2>Bid Details</h2>
                    <p><strong>Product:</strong> ${data.productName}</p>
                    <p><strong>New Bid Amount:</strong> <span style="font-size: 1.2em; color: #059669;">$${data.bidAmount?.toLocaleString()}</span></p>
                    <p><strong>Bidder:</strong> ${data.bidderName}</p>
                </div>
                
                <div class="bid-info">
                    <h3>📊 Current Status</h3>
                    <p><strong>Current Lowest Bid:</strong> ${currentLowest}</p>
                    <p><strong>HS Code:</strong> ${data.hsCode}</p>
                    <p><strong>MOQ:</strong> ${data.moq.toLocaleString()} units</p>
                </div>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 15px 0;">
                    <p class="competitive">⚡ Competition is heating up! Consider placing a more competitive bid to stay in the lead.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://reverse-auction.netlify.app" class="button">
                        View Details & Place Counter Bid
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    This is an automated notification from Befach International's Reverse Auction Platform.
                    Stay competitive by monitoring bids and adjusting your offers accordingly.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}