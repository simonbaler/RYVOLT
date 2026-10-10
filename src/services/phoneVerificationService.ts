/**
 * RYVOLT — Phone Verification Service (Twilio Verify Client)
 * Phase 5.1: Mandatory Candidate Onboarding & Mobile Phone OTP Verification
 */

export interface PhoneConfigResponse {
  configured: boolean;
  service: string;
  message: string;
}

export interface SendOtpResult {
  success: boolean;
  error?: string;
  simulated?: boolean;
  devCode?: string;
  message?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  simulated?: boolean;
  phoneNumber?: string;
  verifiedAt?: string;
  message?: string;
}

class PhoneVerificationService {
  /**
   * Retrieve Twilio service configuration state from backend
   */
  async getConfig(): Promise<PhoneConfigResponse> {
    try {
      const res = await fetch('/api/auth/phone/config');
      if (!res.ok) {
        throw new Error(`Failed to query phone config: ${res.statusText}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        configured: false,
        service: 'simulated-fallback',
        message: err?.message || 'Twilio config unavailable.',
      };
    }
  }

  /**
   * Format and validate E.164 phone number
   */
  validateE164(phone: string): { valid: boolean; normalized: string; error?: string } {
    if (!phone) {
      return { valid: false, normalized: '', error: 'Phone number is required.' };
    }
    const cleaned = phone.replace(/[\s\(\)\-\.]/g, '');
    if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      return {
        valid: false,
        normalized: cleaned,
        error: 'Phone number must start with a valid country code (e.g. +14155552671).',
      };
    }
    return { valid: true, normalized: cleaned };
  }

  /**
   * Dispatch OTP SMS via Twilio Verify backend
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResult> {
    const check = this.validateE164(phoneNumber);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    try {
      const response = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: check.normalized }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to dispatch verification code.',
        };
      }

      return {
        success: true,
        simulated: data.simulated,
        devCode: data.devCode,
        message: data.message,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Network error sending SMS: ${err?.message || 'Connection failure'}`,
      };
    }
  }

  /**
   * Verify candidate-provided OTP code
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<VerifyOtpResult> {
    const check = this.validateE164(phoneNumber);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    try {
      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: check.normalized,
          code: cleanCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Verification code failed.',
        };
      }

      return {
        success: true,
        verified: data.verified,
        simulated: data.simulated,
        phoneNumber: data.phoneNumber,
        verifiedAt: data.verifiedAt,
        message: data.message,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Network error verifying code: ${err?.message || 'Connection failure'}`,
      };
    }
  }
}

export const phoneVerificationService = new PhoneVerificationService();
