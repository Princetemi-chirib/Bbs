import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // If SMTP credentials are provided, use SMTP
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const isSecure = env.SMTP_PORT === 465;
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: isSecure, // true for 465 (SSL), false for 587 (TLS)
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // For development/testing
        },
        // Additional options for Hostinger
        debug: env.NODE_ENV === 'development',
        logger: env.NODE_ENV === 'development',
      });
      console.log(`✅ Email service initialized with SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT} (${isSecure ? 'SSL' : 'TLS'})`);
      console.log(`   From: ${env.EMAIL_FROM}`);
    } else {
      // For development, use ethereal.email (test emails)
      console.warn('⚠️  SMTP credentials not provided. Using test email service (Ethereal).');
      this.createTestTransporter();
    }
  }

  private async createTestTransporter() {
    // Create a test account for development
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
    console.log('📧 Test email account created:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email transporter not initialized',
      };
    }

    try {
      const mailOptions = {
        from: options.from || env.EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text || options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // For test emails, get preview URL
      let previewUrl: string | undefined;
      if (env.NODE_ENV === 'development' && env.SMTP_HOST?.includes('ethereal')) {
        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        if (previewUrl) {
          console.log('📧 Email preview URL:', previewUrl);
        }
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
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
