import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Email service configuration
export class EmailService {
  private transporter: nodemailer.Transporter;
  private logoBase64: string = '';

  constructor() {
    // Create Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Load and encode logo
    this.loadLogo();
  }

  // Load logo and convert to base64
  private loadLogo() {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'bagamilogo_transparent2.png');
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('⚠️ Could not load email logo:', error);
      this.logoBase64 = ''; // Fallback to no logo
    }
  }

  // Send OTP email for signup
  async sendSignupOTP(email: string, otp: string, language: string = 'en'): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Bagami" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: language === 'fr' ? 'Votre code de vérification Bagami' : 'Your Bagami Verification Code',
        html: this.generateSignupEmailTemplate(otp, language),
        text: language === 'fr' 
          ? `Votre code de vérification Bagami est : ${otp}. Ce code expirera dans 10 minutes.`
          : `Your Bagami verification code is: ${otp}. This code will expire in 10 minutes.`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Signup OTP email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send signup OTP email:', error);
      return false;
    }
  }

  // Send OTP email for password reset
  async sendPasswordResetOTP(email: string, otp: string, language: string = 'en'): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Bagami" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: language === 'fr' ? 'Bagami - Code de réinitialisation du mot de passe' : 'Bagami - Password Reset Code',
        html: this.generatePasswordResetEmailTemplate(otp, language),
        text: language === 'fr'
          ? `Votre code de réinitialisation de mot de passe Bagami est : ${otp}. Ce code expirera dans 10 minutes.`
          : `Your Bagami password reset code is: ${otp}. This code will expire in 10 minutes.`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset OTP email:', error);
      return false;
    }
  }

  // Generate professional signup email template
  private generateSignupEmailTemplate(otp: string, language: string = 'en'): string {
    const content = language === 'fr' ? {
      title: 'Vérifiez votre adresse e-mail',
      greeting: 'Bienvenue sur Bagami !',
      message: 'Merci de vous être inscrit. Pour compléter votre inscription, veuillez utiliser le code de vérification ci-dessous :',
      codeLabel: 'Votre code de vérification',
      expiryNote: 'Ce code expirera dans 10 minutes',
      securityNote: "Vous n'avez pas demandé ce code ?",
      securityAction: "Si vous n'avez pas créé de compte, veuillez ignorer cet e-mail en toute sécurité.",
      copyright: `© ${new Date().getFullYear()} Bagami. Tous droits réservés.`
    } : {
      title: 'Verify Your Email Address',
      greeting: 'Welcome to Bagami!',
      message: 'Thank you for signing up. To complete your registration, please use the verification code below:',
      codeLabel: 'Your Verification Code',
      expiryNote: 'This code will expire in 10 minutes',
      securityNote: "Didn't request this code?",
      securityAction: "If you didn't create an account, you can safely ignore this email.",
      copyright: `© ${new Date().getFullYear()} Bagami. All rights reserved.`
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bagami - Verification Code</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 30px 15px !important; }
              .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
              .logo { width: 80px !important; height: 80px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 50px 30px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">${content.title}</h1>
                      <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 16px; font-weight: 400;">${content.greeting}</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td class="content" style="padding: 50px 40px;">
                      
                      <p style="color: #4a5568; line-height: 1.7; margin: 0 0 32px 0; font-size: 16px;">
                        ${content.message}
                      </p>
                      
                      <!-- OTP Code Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 40px 0;">
                        <tr>
                          <td align="center" style="background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%); border: 2px dashed #ff6b35; border-radius: 12px; padding: 40px 20px;">
                            <p style="color: #718096; margin: 0 0 12px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">${content.codeLabel}</p>
                            <div class="otp-code" style="color: #ff6b35; font-size: 42px; font-weight: 700; letter-spacing: 10px; font-family: 'Courier New', Consolas, monospace; margin: 8px 0;">
                              ${otp}
                            </div>
                            <p style="color: #718096; margin: 12px 0 0 0; font-size: 14px;">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;">
                                <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM8 13.8125C4.79062 13.8125 2.1875 11.2094 2.1875 8C2.1875 4.79062 4.79062 2.1875 8 2.1875C11.2094 2.1875 13.8125 4.79062 13.8125 8C13.8125 11.2094 11.2094 13.8125 8 13.8125Z" fill="#718096"/>
                                <path d="M8 4C7.65625 4 7.375 4.28125 7.375 4.625V8.625C7.375 8.96875 7.65625 9.25 8 9.25C8.34375 9.25 8.625 8.96875 8.625 8.625V4.625C8.625 4.28125 8.34375 4 8 4Z" fill="#718096"/>
                                <path d="M8 10.5C7.58594 10.5 7.25 10.8359 7.25 11.25C7.25 11.6641 7.58594 12 8 12C8.41406 12 8.75 11.6641 8.75 11.25C8.75 10.8359 8.41406 10.5 8 10.5Z" fill="#718096"/>
                              </svg>
                              ${content.expiryNote}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Info Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border-left: 4px solid #4299e1; border-radius: 8px; padding: 20px;">
                            <p style="color: #2d3748; margin: 0; font-size: 14px; line-height: 1.6;">
                              <strong style="color: #1a202c;">${content.securityNote}</strong><br/>
                              ${content.securityAction}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #a0aec0; margin: 0; font-size: 12px; text-align: center;">
                        ${content.copyright}
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  // Generate HTML email template for password reset
  private generatePasswordResetEmailTemplate(otp: string, language: string = 'en'): string {
    const content = language === 'fr' ? {
      title: 'Réinitialisation du mot de passe',
      subtitle: 'Sécurisez votre compte en quelques étapes',
      message: 'Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Bagami. Utilisez le code ci-dessous pour continuer :',
      codeLabel: 'Votre code de réinitialisation',
      expiryNote: 'Expire dans 10 minutes',
      securityTitle: 'Avertissement de sécurité',
      securityMessage: "Si vous n'avez pas demandé cette réinitialisation de mot de passe, veuillez ignorer cet e-mail. Votre mot de passe actuel restera inchangé.",
      tipsTitle: 'Conseils pour un mot de passe sécurisé',
      tip1: 'Utilisez au moins 8 caractères',
      tip2: 'Mélangez lettres majuscules et minuscules',
      tip3: 'Incluez des chiffres et des symboles',
      tip4: 'Évitez les informations personnelles évidentes',
      copyright: `© ${new Date().getFullYear()} Bagami. Tous droits réservés.`
    } : {
      title: 'Password Reset',
      subtitle: 'Secure your account in a few steps',
      message: 'We received a request to reset your Bagami account password. Use the code below to proceed:',
      codeLabel: 'Your Reset Code',
      expiryNote: 'Expires in 10 minutes',
      securityTitle: 'Security Notice',
      securityMessage: "If you didn't request this password reset, please ignore this email. Your current password will remain unchanged.",
      tipsTitle: 'Tips for a Secure Password',
      tip1: 'Use at least 8 characters',
      tip2: 'Mix uppercase and lowercase letters',
      tip3: 'Include numbers and symbols',
      tip4: 'Avoid obvious personal information',
      copyright: `© ${new Date().getFullYear()} Bagami. All rights reserved.`
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bagami - Password Reset Code</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 30px 15px !important; }
              .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
              .logo { width: 80px !important; height: 80px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 50px 30px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">${content.title}</h1>
                      <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 16px; font-weight: 400;">${content.subtitle}</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td class="content" style="padding: 50px 40px;">
                      
                      <p style="color: #4a5568; line-height: 1.7; margin: 0 0 32px 0; font-size: 16px;">
                        ${content.message}
                      </p>
                      
                      <!-- OTP Code Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 40px 0;">
                        <tr>
                          <td align="center" style="background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%); border: 2px dashed #ff6b35; border-radius: 12px; padding: 40px 20px;">
                            <p style="color: #718096; margin: 0 0 12px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">${content.codeLabel}</p>
                            <div class="otp-code" style="color: #ff6b35; font-size: 42px; font-weight: 700; letter-spacing: 10px; font-family: 'Courier New', Consolas, monospace; margin: 8px 0;">
                              ${otp}
                            </div>
                            <p style="color: #718096; margin: 12px 0 0 0; font-size: 14px;">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 6px;">
                                <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM8 13.8125C4.79062 13.8125 2.1875 11.2094 2.1875 8C2.1875 4.79062 4.79062 2.1875 8 2.1875C11.2094 2.1875 13.8125 4.79062 13.8125 8C13.8125 11.2094 11.2094 13.8125 8 13.8125Z" fill="#718096"/>
                                <path d="M8 4C7.65625 4 7.375 4.28125 7.375 4.625V8.625C7.375 8.96875 7.65625 9.25 8 9.25C8.34375 9.25 8.625 8.96875 8.625 8.625V4.625C8.625 4.28125 8.34375 4 8 4Z" fill="#718096"/>
                                <path d="M8 10.5C7.58594 10.5 7.25 10.8359 7.25 11.25C7.25 11.6641 7.58594 12 8 12C8.41406 12 8.75 11.6641 8.75 11.25C8.75 10.8359 8.41406 10.5 8 10.5Z" fill="#718096"/>
                              </svg>
                              ${content.expiryNote}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Warning -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                            <table cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="padding-right: 12px; vertical-align: top;">
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM9 5H11V11H9V5ZM10 15C9.45 15 9 14.55 9 14C9 13.45 9.45 13 10 13C10.55 13 11 13.45 11 14C11 14.55 10.55 15 10 15Z" fill="#f59e0b"/>
                                  </svg>
                                </td>
                                <td>
                                  <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong style="color: #78350f; display: block; margin-bottom: 4px;">${content.securityTitle}</strong>
                                    ${content.securityMessage}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Tips -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border-radius: 8px; padding: 20px;">
                            <p style="color: #2d3748; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
                              💡 ${content.tipsTitle}
                            </p>
                            <ul style="color: #4a5568; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
                              <li>${content.tip1}</li>
                              <li>${content.tip2}</li>
                              <li>${content.tip3}</li>
                              <li>${content.tip4}</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #a0aec0; margin: 0; font-size: 12px; text-align: center;">
                        ${content.copyright}
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  // Send admin notification for ID verification submission
  async sendIdVerificationNotification(userData: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    documentType: string;
    documentUrl: string;
    submittedAt: string;
  }): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'guetinp@gmail.com';
      const mailOptions = {
        from: `"Bagami Notifications" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `🆔 New ID Verification Submission - ${userData.name}`,
        html: this.generateIdVerificationEmailTemplate(userData),
        text: `New ID verification submitted by ${userData.name} (${userData.email}). Document type: ${userData.documentType}. Time: ${userData.submittedAt}.`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ ID verification admin notification sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send ID verification notification:', error);
      return false;
    }
  }

  // Send admin notification for contact form submission
  async sendContactFormNotification(contactData: {
    userId?: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
    submittedAt: string;
    isAuthenticated: boolean;
  }): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'guetinp@gmail.com';
      const mailOptions = {
        from: `"Bagami Notifications" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `📬 New Contact Form Message - ${contactData.subject}`,
        html: this.generateContactFormEmailTemplate(contactData),
        text: `New contact message from ${contactData.senderName} (${contactData.senderEmail}). Subject: ${contactData.subject}. Message: ${contactData.message}`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Contact form admin notification sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send contact form notification:', error);
      return false;
    }
  }

  // Send admin notification for withdrawal request
  async sendWithdrawalNotification(withdrawalData: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    amount: number;
    currency: string;
    phoneNumber: string;
    transactionId: string;
    submittedAt: string;
    currentBalance: number;
  }): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'guetinp@gmail.com';
      const mailOptions = {
        from: `"Bagami Notifications" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `💰 New Withdrawal Request - ${withdrawalData.amount} ${withdrawalData.currency} - ${withdrawalData.userName}`,
        html: this.generateWithdrawalEmailTemplate(withdrawalData),
        text: `New withdrawal request from ${withdrawalData.userName} (${withdrawalData.userEmail}). Amount: ${withdrawalData.amount} ${withdrawalData.currency}. Phone: ${withdrawalData.phoneNumber}. Transaction ID: ${withdrawalData.transactionId}.`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Withdrawal admin notification sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send withdrawal notification:', error);
      return false;
    }
  }

  // Generate ID verification notification email template
  private generateIdVerificationEmailTemplate(userData: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    documentType: string;
    documentUrl: string;
    submittedAt: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New ID Verification Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px;">
                      <div style="font-size: 48px; margin-bottom: 12px;">🆔</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">New ID Verification</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Requires admin review</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <p style="color: #4a5568; line-height: 1.6; margin: 0 0 24px 0; font-size: 15px;">
                        A user has submitted their ID documents for verification. Please review the details below:
                      </p>
                      
                      <!-- User Information -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border-radius: 8px; padding: 24px;">
                            <h3 style="color: #1a202c; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">👤 User Details</h3>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 140px;">Name:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${userData.name}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Email:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${userData.email}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Phone:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${userData.phone}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">User ID:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-family: monospace;">${userData.userId}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Document Information -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px;">
                            <h3 style="color: #78350f; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📄 Document Information</h3>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 8px 0; color: #92400e; font-size: 14px; width: 140px;">Document Type:</td>
                                <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600; text-transform: uppercase;">${userData.documentType}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Submitted:</td>
                                <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 500;">${userData.submittedAt}</td>
                              </tr>
                              <tr>
                                <td style="padding: 16px 0 0 0;" colspan="2">
                                  <a href="${userData.documentUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">📥 View Document</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Action Required -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
                            <p style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.6;">
                              <strong style="display: block; margin-bottom: 8px;">⚡ Action Required</strong>
                              Please log in to the admin panel to review and approve or reject this ID verification request.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                        This is an automated notification from Bagami Admin System
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  // Generate contact form notification email template
  private generateContactFormEmailTemplate(contactData: {
    userId?: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
    submittedAt: string;
    isAuthenticated: boolean;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Message</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 40px 30px;">
                      <div style="font-size: 48px; margin-bottom: 12px;">📬</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">New Contact Message</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${contactData.isAuthenticated ? 'From registered user' : 'From guest visitor'}</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Subject -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 24px 0;">
                        <tr>
                          <td style="background-color: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px;">
                            <p style="color: #6b21a8; margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Subject</p>
                            <h2 style="color: #4c1d95; margin: 0; font-size: 20px; font-weight: 600;">${contactData.subject}</h2>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Sender Information -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border-radius: 8px; padding: 24px;">
                            <h3 style="color: #1a202c; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">👤 Sender Details</h3>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 140px;">Name:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${contactData.senderName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Email:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">
                                  <a href="mailto:${contactData.senderEmail}" style="color: #3b82f6; text-decoration: none;">${contactData.senderEmail}</a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Account Status:</td>
                                <td style="padding: 8px 0;">
                                  <span style="display: inline-block; background-color: ${contactData.isAuthenticated ? '#d1fae5' : '#fee2e2'}; color: ${contactData.isAuthenticated ? '#065f46' : '#991b1b'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                    ${contactData.isAuthenticated ? '✓ Registered User' : '✗ Guest'}
                                  </span>
                                </td>
                              </tr>
                              ${contactData.userId ? `
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">User ID:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-family: monospace;">${contactData.userId}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Submitted:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${contactData.submittedAt}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Message Content -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #fffbeb; border-radius: 8px; padding: 24px;">
                            <h3 style="color: #78350f; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">💬 Message</h3>
                            <div style="color: #92400e; font-size: 14px; line-height: 1.8; white-space: pre-wrap; background-color: #ffffff; padding: 16px; border-radius: 6px; border: 1px solid #fde68a;">
                              ${contactData.message}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Action -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
                            <p style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.6;">
                              <strong style="display: block; margin-bottom: 8px;">📋 Next Steps</strong>
                              Review this message in the admin panel and update the status after responding to the sender.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                        This is an automated notification from Bagami Admin System
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  // Generate withdrawal notification email template
  private generateWithdrawalEmailTemplate(withdrawalData: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    amount: number;
    currency: string;
    phoneNumber: string;
    transactionId: string;
    submittedAt: string;
    currentBalance: number;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Withdrawal Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9fc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px;">
                      <div style="font-size: 48px; margin-bottom: 12px;">💰</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Withdrawal Request</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Pending admin approval</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <p style="color: #4a5568; line-height: 1.6; margin: 0 0 24px 0; font-size: 15px;">
                        A user has requested to withdraw funds from their Bagami wallet. Please review and process this request.
                      </p>
                      
                      <!-- Amount Highlight -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td align="center" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; border-radius: 12px; padding: 32px 20px;">
                            <p style="color: #065f46; margin: 0 0 8px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Withdrawal Amount</p>
                            <div style="color: #047857; font-size: 36px; font-weight: 700; margin: 4px 0;">
                              ${withdrawalData.amount.toLocaleString()} ${withdrawalData.currency}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- User Information -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #f7fafc; border-radius: 8px; padding: 24px;">
                            <h3 style="color: #1a202c; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">👤 User Details</h3>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 160px;">Name:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${withdrawalData.userName}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Email:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">
                                  <a href="mailto:${withdrawalData.userEmail}" style="color: #3b82f6; text-decoration: none;">${withdrawalData.userEmail}</a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Phone:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500;">${withdrawalData.userPhone}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">User ID:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-family: monospace;">${withdrawalData.userId}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #718096; font-size: 14px;">Current Balance:</td>
                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">${withdrawalData.currentBalance.toLocaleString()} ${withdrawalData.currency}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Transaction Details -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px;">
                            <h3 style="color: #78350f; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📱 Transaction Details</h3>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 8px 0; color: #92400e; font-size: 14px; width: 160px;">Mobile Money Number:</td>
                                <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 600; font-family: monospace;">${withdrawalData.phoneNumber}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Transaction ID:</td>
                                <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 500; font-family: monospace;">${withdrawalData.transactionId}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Request Time:</td>
                                <td style="padding: 8px 0; color: #78350f; font-size: 14px; font-weight: 500;">${withdrawalData.submittedAt}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #92400e; font-size: 14px;">Status:</td>
                                <td style="padding: 8px 0;">
                                  <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                    ⏳ PENDING
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Action Required -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                        <tr>
                          <td style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px;">
                            <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.6;">
                              <strong style="display: block; margin-bottom: 8px;">⚡ Urgent Action Required</strong>
                              Please process this withdrawal request promptly. Log in to the admin panel to approve or reject this transaction.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f7fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                        This is an automated notification from Bagami Admin System
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();