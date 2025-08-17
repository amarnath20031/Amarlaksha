import { MailService } from '@sendgrid/mail';

// SendGrid email service for budget notifications
class EmailService {
  private mailService: MailService;
  private isConfigured: boolean = false;

  constructor() {
    this.mailService = new MailService();
    this.setupEmailService();
  }

  private setupEmailService() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (apiKey) {
      this.mailService.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('📧 SendGrid email service configured');
    } else {
      console.log('📧 SendGrid API key not found - email notifications disabled');
      this.isConfigured = false;
    }
  }

  async sendBudgetAlert(userEmail: string, alertData: {
    type: 'daily_limit' | 'budget_50' | 'budget_80' | 'budget_100';
    amount: number;
    limit: number;
    percentage?: number;
  }): Promise<boolean> {
    if (!this.isConfigured || !userEmail) {
      console.log('📧 Email service not configured or no email provided');
      return false;
    }

    try {
      const { type, amount, limit, percentage } = alertData;
      let subject = '';
      let html = '';
      
      switch (type) {
        case 'daily_limit':
          subject = '🚨 Daily Spending Limit Exceeded - Laksha Budget Alert';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">⚠️ Daily Limit Exceeded</h2>
              <p>You've exceeded your daily spending limit!</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Daily Spent:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                <p><strong>Daily Limit:</strong> ₹${limit.toLocaleString('en-IN')}</p>
                <p><strong>Over by:</strong> ₹${(amount - limit).toLocaleString('en-IN')}</p>
              </div>
              <p>Consider reviewing your spending to stay within your monthly budget.</p>
              <p style="color: #666; font-size: 12px;">Best regards,<br>Team Laksha</p>
            </div>
          `;
          break;

        case 'budget_50':
          subject = '📊 50% Monthly Budget Used - Laksha Budget Alert';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f39c12;">📊 Budget Checkpoint Reached</h2>
              <p>You've used 50% of your monthly budget.</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Amount Spent:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                <p><strong>Monthly Budget:</strong> ₹${limit.toLocaleString('en-IN')}</p>
                <p><strong>Remaining:</strong> ₹${(limit - amount).toLocaleString('en-IN')}</p>
              </div>
              <p>You're on track! Keep monitoring your expenses to stay within budget.</p>
              <p style="color: #666; font-size: 12px;">Best regards,<br>Team Laksha</p>
            </div>
          `;
          break;

        case 'budget_80':
          subject = '⚠️ 80% Monthly Budget Used - Laksha Budget Alert';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e67e22;">⚠️ Budget Alert - 80% Used</h2>
              <p>You've used 80% of your monthly budget. Time to be more careful!</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Amount Spent:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                <p><strong>Monthly Budget:</strong> ₹${limit.toLocaleString('en-IN')}</p>
                <p><strong>Remaining:</strong> ₹${(limit - amount).toLocaleString('en-IN')}</p>
              </div>
              <p>Consider reducing non-essential spending for the rest of the month.</p>
              <p style="color: #666; font-size: 12px;">Best regards,<br>Team Laksha</p>
            </div>
          `;
          break;

        case 'budget_100':
          subject = '🚨 Monthly Budget Exceeded - Laksha Budget Alert';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">🚨 Budget Exceeded</h2>
              <p>You've exceeded your monthly budget!</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Amount Spent:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                <p><strong>Monthly Budget:</strong> ₹${limit.toLocaleString('en-IN')}</p>
                <p><strong>Over by:</strong> ₹${(amount - limit).toLocaleString('en-IN')}</p>
              </div>
              <p>Time to review your spending habits and adjust your budget for next month.</p>
              <p style="color: #666; font-size: 12px;">Best regards,<br>Team Laksha</p>
            </div>
          `;
          break;
      }

      await this.mailService.send({
        to: userEmail,
        from: 'noreply@laksha.app', // You'll need to verify this domain with SendGrid
        subject,
        html
      });

      console.log(`📧 Budget alert email sent to ${userEmail} for ${type}`);
      return true;
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();