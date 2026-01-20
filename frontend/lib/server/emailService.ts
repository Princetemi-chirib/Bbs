import nodemailer, { Transporter } from 'nodemailer';

// Environment variables from Vercel
const getEnv = () => ({
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@bbs.com',
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: process.env.APP_NAME || 'Barber Booking System',
});

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const env = getEnv();
    
    // If SMTP credentials are provided, use SMTP
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const isSecure = env.SMTP_PORT === 465;
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: isSecure,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      // For development, use ethereal.email (test emails)
      console.warn('⚠️  SMTP credentials not provided. Using test email service (Ethereal).');
      this.createTestTransporter();
    }
  }

  private async createTestTransporter() {
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email transporter not initialized',
      };
    }

    const env = getEnv();

    try {
      const mailOptions = {
        from: options.from || env.EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text || options.subject,
        html: options.html,
        replyTo: options.replyTo,
      };

      const info = await this.transporter.sendMail(mailOptions);

      let previewUrl: string | undefined;
      if (env.NODE_ENV === 'development' && env.SMTP_HOST?.includes('ethereal')) {
        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
      };
    } catch (error: any) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
