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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-auction-emails`;
      
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

      if (!response.ok) {
        throw new Error(`Email service responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Email notification sent:', result);
      return result;
    } catch (error) {
      console.error('Failed to send email notification:', error);
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