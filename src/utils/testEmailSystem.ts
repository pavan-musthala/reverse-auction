// Email System Test Utility
export class EmailSystemTester {
  private static readonly RESEND_API_URL = 'https://api.resend.com/emails';
  
  static async testResendAPIKey(): Promise<{
    isConfigured: boolean;
    isValid: boolean;
    error?: string;
    details: any;
  }> {
    try {
      console.log('🔍 Testing Resend API configuration...');
      
      // Test the Edge Function first
      const edgeFunctionResult = await this.testEdgeFunction();
      
      // Test direct Resend API if we can get the key
      const directAPIResult = await this.testDirectResendAPI();
      
      return {
        isConfigured: edgeFunctionResult.hasAPIKey,
        isValid: edgeFunctionResult.success || directAPIResult.success,
        details: {
          edgeFunction: edgeFunctionResult,
          directAPI: directAPIResult
        }
      };
    } catch (error) {
      console.error('❌ Email system test failed:', error);
      return {
        isConfigured: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { error }
      };
    }
  }
  
  private static async testEdgeFunction() {
    try {
      console.log('📡 Testing Edge Function...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-auction-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'NEW_REQUIREMENT',
          data: {
            requirementId: 'test-api-check',
            productName: 'API Test Product',
            hsCode: 'TEST.123',
            moq: 1,
            description: 'Testing if Resend API is working',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        })
      });
      
      const result = await response.json();
      console.log('📬 Edge Function Response:', result);
      
      return {
        success: response.ok && result.success,
        hasAPIKey: result.provider === 'Resend',
        emailsSent: result.message?.includes('emails sent') ? parseInt(result.message) : 0,
        provider: result.provider,
        response: result
      };
    } catch (error) {
      console.error('❌ Edge Function test failed:', error);
      return {
        success: false,
        hasAPIKey: false,
        emailsSent: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private static async testDirectResendAPI() {
    try {
      console.log('🔑 Testing direct Resend API access...');
      
      // We can't access the API key directly from the client
      // But we can check if the Edge Function is using it properly
      return {
        success: false,
        note: 'Direct API test not available from client-side'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  static async runFullDiagnostic() {
    console.log('🔍 Running full email system diagnostic...');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'
      },
      apiTest: await this.testResendAPIKey()
    };
    
    console.log('📊 Full Diagnostic Results:', results);
    
    // Show user-friendly summary
    this.showDiagnosticSummary(results);
    
    return results;
  }
  
  private static showDiagnosticSummary(results: any) {
    const isWorking = results.apiTest.isValid && results.apiTest.isConfigured;
    
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isWorking ? '#10b981' : '#dc2626'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        max-width: 400px;
        line-height: 1.4;
      `;
      
      if (isWorking) {
        notification.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px; font-size: 18px;">✅</span>
            <div style="font-weight: 600;">Email System Working!</div>
          </div>
          <div style="opacity: 0.9; font-size: 13px;">
            • Resend API configured<br>
            • Edge Function operational<br>
            • Emails will be delivered
          </div>
        `;
      } else {
        notification.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px; font-size: 18px;">❌</span>
            <div style="font-weight: 600;">Email System Issue</div>
          </div>
          <div style="opacity: 0.9; font-size: 13px;">
            ${!results.apiTest.isConfigured ? '• Resend API key not configured<br>' : ''}
            ${!results.apiTest.isValid ? '• API key may be invalid<br>' : ''}
            • Check console for details
          </div>
        `;
      }
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 8000);
    }
  }
}