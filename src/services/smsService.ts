// SMS Service using Aqilas API
export interface SMSResponse {
  success: boolean;
  message: string;
  bulk_id?: string;
  cost?: number;
  currency?: string;
}

export interface SMSRequest {
  from: string;
  text: string;
  to: string[];
  send_at?: string; // Optional: "13:22 29012021" format
}

export class SMSService {
  private static readonly API_URL = process.env.AQILAS_API_URL || 'https://www.aqilas.com/api/v1/sms';
  private static readonly AUTH_TOKEN = process.env.AQILAS_AUTH_TOKEN || 'your_token_here';
  private static readonly FROM_NAME = 'Bagami';

  /**
   * Generate a 6-digit OTP code
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send SMS using Aqilas API
   */
  static async sendSMS(request: SMSRequest): Promise<SMSResponse> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AUTH-TOKEN': this.AUTH_TOKEN,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: SMSResponse = await response.json();
      return data;
    } catch (error) {
      console.error('SMS Service Error:', error);
      return {
        success: false,
        message: 'Failed to send SMS. Please check your network connection.',
      };
    }
  }

  /**
   * Send OTP SMS to a phone number
   */
  static async sendOTP(phoneNumber: string, otp: string, language: string = 'en'): Promise<SMSResponse> {
    // Clean phone number (remove spaces, ensure + prefix)
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    const message = language === 'fr'
      ? `Votre code de vérification Bagami est : ${otp}. Ce code expirera dans 10 minutes. Ne le partagez avec personne.`
      : `Your Bagami verification code is: ${otp}. This code will expire in 10 minutes. Don't share it with anyone.`;

    return this.sendSMS({
      from: this.FROM_NAME,
      text: message,
      to: [formattedPhone],
    });
  }

  /**
   * Send password reset SMS to a phone number
   */
  static async sendPasswordResetOTP(phoneNumber: string, otp: string, language: string = 'en'): Promise<SMSResponse> {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    const message = language === 'fr'
      ? `Votre code de réinitialisation de mot de passe Bagami est : ${otp}. Ce code expirera dans 10 minutes. Ne le partagez avec personne.`
      : `Your Bagami password reset code is: ${otp}. This code will expire in 10 minutes. Don't share it with anyone.`;

    return this.sendSMS({
      from: this.FROM_NAME,
      text: message,
      to: [formattedPhone],
    });
  }

  /**
   * Validate phone number format (basic validation)
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    // Basic international phone number validation
    return /^\+?[1-9]\d{6,14}$/.test(cleanPhone);
  }
}

// File-based OTP storage (for development - should use Redis/database in production)
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

class OTPStorage {
  private static otps = new Map<string, { otp: string; expiresAt: number; attempts: number }>();
  private static otpFilePath = join(process.cwd(), '.next', 'otp-storage.json');

  // Load OTPs from file on startup
  private static loadFromFile(): void {
    try {
      if (existsSync(this.otpFilePath)) {
        const data = readFileSync(this.otpFilePath, 'utf8');
        const otpData = JSON.parse(data);
        
        // Clean expired OTPs and restore valid ones
        const now = Date.now();
        for (const [phoneNumber, otpInfo] of Object.entries(otpData)) {
          const info = otpInfo as { otp: string; expiresAt: number; attempts: number };
          if (now <= info.expiresAt) {
            this.otps.set(phoneNumber, info);
          }
        }
        console.log('📂 Loaded', this.otps.size, 'active OTPs from file');
      }
    } catch (error) {
      console.error('Error loading OTP storage:', error);
      this.otps.clear();
    }
  }

  // Save OTPs to file
  private static saveToFile(): void {
    try {
      // Ensure directory exists
      const dirPath = join(process.cwd(), '.next');
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      
      const otpData = Object.fromEntries(this.otps);
      writeFileSync(this.otpFilePath, JSON.stringify(otpData, null, 2));
      console.log('💾 Saved', this.otps.size, 'OTPs to file');
    } catch (error) {
      console.error('Error saving OTP storage:', error);
    }
  }

  static store(phoneNumber: string, otp: string): void {
    // Load existing data
    this.loadFromFile();
    
    // Sanitize inputs for consistency
    const sanitizedPhoneNumber = String(phoneNumber).trim();
    const sanitizedOtp = String(otp).trim();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    console.log('📦 Storing OTP:', {
      originalPhone: phoneNumber,
      sanitizedPhone: sanitizedPhoneNumber,
      originalOtp: otp,
      sanitizedOtp: sanitizedOtp,
      otpLength: sanitizedOtp.length,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
    this.otps.set(sanitizedPhoneNumber, { otp: sanitizedOtp, expiresAt, attempts: 0 });
    this.saveToFile();
  }

  static verify(phoneNumber: string, otp: string): { success: boolean; message: string } {
    // Load existing data
    this.loadFromFile();
    
    // Sanitize inputs
    const sanitizedPhoneNumber = String(phoneNumber).trim();
    const sanitizedOtp = String(otp).trim().replace(/\s/g, '');
    
    console.log('🔍 OTP Verification Debug:', {
      originalPhone: phoneNumber,
      sanitizedPhone: sanitizedPhoneNumber,
      originalOTP: otp,
      sanitizedOTP: sanitizedOtp,
      otpLength: sanitizedOtp.length
    });

    const stored = this.otps.get(sanitizedPhoneNumber);
    console.log('📱 Stored OTP data:', stored);

    if (!stored) {
      console.log('❌ No OTP found for phone number:', sanitizedPhoneNumber);
      console.log('📋 All stored OTPs:', Array.from(this.otps.keys()));
      return { success: false, message: 'No OTP found for this phone number. Please request a new code.' };
    }

    if (Date.now() > stored.expiresAt) {
      console.log('⏰ OTP expired for:', sanitizedPhoneNumber);
      this.otps.delete(sanitizedPhoneNumber);
      this.saveToFile();
      return { success: false, message: 'OTP has expired. Please request a new code.' };
    }

    if (stored.attempts >= 3) {
      console.log('🚫 Too many attempts for:', sanitizedPhoneNumber);
      this.otps.delete(sanitizedPhoneNumber);
      this.saveToFile();
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    // Normalize both OTPs for comparison
    const storedOtpNormalized = String(stored.otp).trim().replace(/\s/g, '');
    const providedOtpNormalized = sanitizedOtp;

    console.log('🔐 OTP Comparison:', {
      storedOTP: stored.otp,
      storedNormalized: storedOtpNormalized,
      providedOTP: otp,
      providedNormalized: providedOtpNormalized,
      match: storedOtpNormalized === providedOtpNormalized
    });

    // Compare normalized strings
    if (storedOtpNormalized !== providedOtpNormalized) {
      stored.attempts++;
      this.saveToFile();
      console.log('❌ OTP mismatch, attempts now:', stored.attempts);
      return { success: false, message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.` };
    }

    // Success - remove the OTP
    console.log('✅ OTP verified successfully for:', sanitizedPhoneNumber);
    this.otps.delete(sanitizedPhoneNumber);
    this.saveToFile();
    return { success: true, message: 'OTP verified successfully.' };
  }

  static exists(phoneNumber: string): boolean {
    this.loadFromFile();
    const stored = this.otps.get(phoneNumber);
    return stored !== undefined && Date.now() <= stored.expiresAt;
  }

  static clear(phoneNumber: string): void {
    this.loadFromFile();
    this.otps.delete(phoneNumber);
    this.saveToFile();
  }
}

export { OTPStorage };