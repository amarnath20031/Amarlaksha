import { MailService } from '@sendgrid/mail';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private mailService: MailService;
  private isConfigured: boolean = false;

  constructor() {
    this.mailService = new MailService();
    this.configure();
  }

  private configure() {
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      console.log('📧 SendGrid email service configured');
    } else {
      console.log('📧 SendGrid API key not found - email notifications disabled');
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(email: string, otp: string, resetToken: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`📧 Email service not configured - would send reset email to ${email}`);
      console.log(`📧 Reset OTP: ${otp}`);
      console.log(`📧 Reset Link: https://${process.env.DOMAIN || 'localhost:5000'}/reset-password?token=${resetToken}`);
      return true; // Return true for development
    }

    const resetUrl = `https://${process.env.DOMAIN || 'lakshacoach.com'}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Laksha Coach Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #6366f1;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .otp-code {
            background: #6366f1;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            letter-spacing: 2px;
          }
          .reset-button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">₹ Laksha Coach</div>
            <h2 style="color: #374151; margin: 0;">Reset Your Password</h2>
          </div>
          
          <p>Hi there,</p>
          
          <p>We received a request to reset your Laksha Coach password. Use the OTP below to reset your password, or click the link directly.</p>
          
          <div class="otp-code">${otp}</div>
          
          <p style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </p>
          
          <div class="warning">
            <strong>⏰ Important:</strong> This OTP and link will expire in 10 minutes for your security.
          </div>
          
          <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Laksha Coach Team</p>
            <p><small>This is an automated message from noreply@lakshacoach.com</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailService.send({
        to: email,
        from: {
          email: 'noreply@lakshacoach.com',
          name: 'Laksha Coach'
        },
        subject: 'Reset your Laksha Coach password',
        html: htmlContent,
      });

      console.log(`📧 Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('📧 Failed to send password reset email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();