import { supabase } from './supabase';

interface EmailNotificationData {
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
}

export class EmailService {
  private static async sendEmail(type: 'NEW_REQUIREMENT' | 'NEW_BID', data: EmailNotificationData) {
    try {
      console.log(`📧 Attempting to send ${type} email for:`, data.productName);
      
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-auction-emails`;
      
      console.log('📡 Calling email API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data
        })
      });

      console.log('📬 Email API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Email API error response:', errorText);
        throw new Error(`Email service responded with status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Email notification result:', result);
      
      // Show user-friendly notification
      if (result.success) {
        if (result.provider === 'Resend') {
          console.log(`📧 ${result.message} to:`, result.recipients);
          // Show success notification to user
          if (typeof window !== 'undefined') {
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              max-width: 300px;
            `;
            notification.innerHTML = `
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">📧</span>
                <div>
                  <div style="font-weight: 600;">Emails Sent!</div>
                  <div style="opacity: 0.9; font-size: 12px;">${result.recipients.length} recipients notified</div>
                </div>
              </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          }
        } else {
          console.log('⚠️ Emails logged to console (Resend not configured)');
          // Show warning notification
          if (typeof window !== 'undefined') {
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #f59e0b;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              max-width: 300px;
            `;
            notification.innerHTML = `
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">⚠️</span>
                <div>
                  <div style="font-weight: 600;">Email Service Not Configured</div>
                  <div style="opacity: 0.9; font-size: 12px;">Check console for email content</div>
                </div>
              </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 7000);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
      
      // Show error notification to user
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">❌</span>
            <div>
              <div style="font-weight: 600;">Email Failed</div>
              <div style="opacity: 0.9; font-size: 12px;">Check console for details</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
      
      // Don't throw error to prevent blocking the main functionality
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async notifyNewRequirement(requirement: {
    id: string;
    productName: string;
    hsCode: string;
    moq: number;
    description: string;
    startTime: Date;
    endTime: Date;
  }) {
    console.log('🚀 Triggering new requirement email notification');
    return this.sendEmail('NEW_REQUIREMENT', {
      requirementId: requirement.id,
      productName: requirement.productName,
      hsCode: requirement.hsCode,
      moq: requirement.moq,
      description: requirement.description,
      startTime: requirement.startTime.toISOString(),
      endTime: requirement.endTime.toISOString()
    });
  }

  static async notifyNewBid(bid: {
    requirementId: string;
    productName: string;
    hsCode: string;
    moq: number;
    description: string;
    startTime: Date;
    endTime: Date;
    bidAmount: number;
    bidderName: string;
    currentLowestBid?: number;
  }) {
    console.log('🚀 Triggering new bid email notification');
    return this.sendEmail('NEW_BID', {
      requirementId: bid.requirementId,
      productName: bid.productName,
      hsCode: bid.hsCode,
      moq: bid.moq,
      description: bid.description,
      startTime: bid.startTime.toISOString(),
      endTime: bid.endTime.toISOString(),
      bidAmount: bid.bidAmount,
      bidderName: bid.bidderName,
      currentLowestBid: bid.currentLowestBid
    });
  }
}