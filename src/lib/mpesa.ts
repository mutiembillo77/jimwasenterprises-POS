// M-Pesa STK PUSH Integration
// Handles API communication with M-Pesa for STK PUSH payments

import type { MpesaSettings } from './settings-types';

export interface STKPushRequest {
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc?: string;
}

export interface STKPushResponse {
  success: boolean;
  checkout_request_id?: string;
  request_id?: string;
  response_code?: string;
  response_description?: string;
  error?: string;
}

export interface STKStatusResponse {
  checkout_request_id: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Timeout';
  result_code?: string;
  result_desc?: string;
  amount?: number;
  mpesa_receipt_number?: string;
  phone_number?: string;
  transaction_timestamp?: string;
}

class MpesaClient {
  private settings: MpesaSettings | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private baseUrl: string = '';

  constructor(settings?: MpesaSettings) {
    if (settings) {
      this.initialize(settings);
    }
  }

  initialize(settings: MpesaSettings) {
    this.settings = settings;
    this.baseUrl = settings.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Get OAuth2 access token from M-Pesa
   */
  private async getAccessToken(): Promise<string> {
    if (!this.settings) {
      throw new Error('M-Pesa settings not initialized');
    }

    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.settings.consumer_key}:${this.settings.consumer_secret}`
      ).toString('base64');

      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OAuth failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      this.accessToken = data.access_token;
      // Token expires in 3600 seconds, cache for 3500 seconds
      this.tokenExpiry = Date.now() + (3500 * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('[v0] Failed to get M-Pesa access token:', error);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Format phone number to international format (254...)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove common formatting characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    }

    // If doesn't start with country code, add it
    if (!cleaned.startsWith('254') && !cleaned.startsWith('+254')) {
      cleaned = '254' + cleaned;
    }

    // Remove + if present
    cleaned = cleaned.replace('+', '');

    return cleaned;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    const formatted = this.formatPhoneNumber(phone);

    if (!/^254\d{9}$/.test(formatted)) {
      return {
        valid: false,
        error: 'Invalid phone number. Please enter a valid Kenyan phone number.',
      };
    }

    return { valid: true };
  }

  /**
   * Initiate STK PUSH payment
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    if (!this.settings || !this.settings.is_enabled) {
      return {
        success: false,
        error: 'M-Pesa is not enabled',
      };
    }

    // Validate phone number
    const phoneValidation = this.validatePhoneNumber(request.phone_number);
    if (!phoneValidation.valid) {
      return {
        success: false,
        error: phoneValidation.error,
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(request.phone_number);

      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[:\-.]/g, '').slice(0, 14);

      // Generate password (Base64 encode: ShortCode + Passkey + Timestamp)
      const passwordString = `${this.settings.short_code}${this.settings.passkey}${timestamp}`;
      const password = Buffer.from(passwordString).toString('base64');

      const payload = {
        BusinessShortCode: this.settings.short_code,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(request.amount),
        PartyA: formattedPhone,
        PartyB: this.settings.short_code,
        PhoneNumber: formattedPhone,
        CallBackURL: this.settings.callback_url || 'https://your-domain.com/api/mpesa/callback',
        AccountReference: request.account_reference || 'POS_PAYMENT',
        TransactionDesc: request.transaction_desc || 'Payment',
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (data.ResponseCode === '0') {
        return {
          success: true,
          checkout_request_id: data.CheckoutRequestID,
          request_id: data.RequestId,
          response_code: data.ResponseCode,
          response_description: data.ResponseDescription,
        };
      } else {
        return {
          success: false,
          response_code: data.ResponseCode,
          error: data.ResponseDescription || 'STK PUSH request failed',
        };
      }
    } catch (error) {
      console.error('[v0] STK PUSH error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate STK PUSH',
      };
    }
  }

  /**
   * Query transaction status
   */
  async queryTransactionStatus(checkoutRequestId: string): Promise<STKStatusResponse | null> {
    if (!this.settings || !this.settings.is_enabled) {
      return null;
    }

    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[:\-.]/g, '').slice(0, 14);

      const passwordString = `${this.settings.short_code}${this.settings.passkey}${timestamp}`;
      const password = Buffer.from(passwordString).toString('base64');

      const payload = {
        BusinessShortCode: this.settings.short_code,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await fetch(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json() as any;

      if (data.ResponseCode === '0') {
        return {
          checkout_request_id: checkoutRequestId,
          status: data.ResultCode === '0' ? 'Completed' : data.ResultCode === '1037' ? 'Pending' : 'Failed',
          result_code: data.ResultCode,
          result_desc: data.ResultDesc,
          amount: data.CallbackMetadata?.item?.find((i: any) => i.name === 'Amount')?.value,
          mpesa_receipt_number: data.CallbackMetadata?.item?.find((i: any) => i.name === 'MpesaReceiptNumber')?.value,
          phone_number: data.CallbackMetadata?.item?.find((i: any) => i.name === 'PhoneNumber')?.value,
          transaction_timestamp: data.CallbackMetadata?.item?.find((i: any) => i.name === 'TransactionTimestamp')?.value,
        };
      } else {
        return {
          checkout_request_id: checkoutRequestId,
          status: 'Failed',
          result_code: data.ResponseCode,
          result_desc: data.ResponseDescription,
        };
      }
    } catch (error) {
      console.error('[v0] Status query error:', error);
      return null;
    }
  }
}

// Singleton instance
let mpesaClient: MpesaClient | null = null;

export function initializeMpesa(settings: MpesaSettings) {
  mpesaClient = new MpesaClient(settings);
  return mpesaClient;
}

export function getMpesaClient(): MpesaClient | null {
  return mpesaClient;
}

export function setMpesaClient(client: MpesaClient) {
  mpesaClient = client;
}
