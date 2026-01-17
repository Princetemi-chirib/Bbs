import { Request, Response } from 'express';
import { emailService } from '../services/emailService';
import { emailTemplates } from '../utils/emailTemplates';

interface SendOrderConfirmationRequest extends Request {
  body: {
    customerName: string;
    customerEmail: string;
    orderReference: string;
    items: Array<{
      title: string;
      quantity: number;
      price: number;
      displayAge?: string;
    }>;
    total: number;
    city: string;
    location: string;
    address?: string;
    phone: string;
    paymentReference?: string;
  };
}

export const emailController = {
  sendOrderConfirmation: async (
    req: SendOrderConfirmationRequest,
    res: Response
  ) => {
    try {
      const {
        customerName,
        customerEmail,
        orderReference,
        items,
        total,
        city,
        location,
        address,
        phone,
        paymentReference,
      } = req.body;

      // Validate required fields
      if (
        !customerName ||
        !customerEmail ||
        !orderReference ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0 ||
        !total ||
        !city ||
        !location ||
        !phone
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Missing required fields',
          },
        });
      }

      // Generate email content
      const html = emailTemplates.orderConfirmation({
        customerName,
        customerEmail,
        orderReference,
        items,
        total,
        city,
        location,
        address,
        phone,
        paymentReference,
      });

      const text = emailTemplates.orderConfirmationText({
        customerName,
        customerEmail,
        orderReference,
        items,
        total,
        city,
        location,
        address,
        phone,
        paymentReference,
      });

      // Send email
      const result = await emailService.sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - ${orderReference}`,
        html,
        text,
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Order confirmation email sent successfully',
          data: {
            messageId: result.messageId,
            previewUrl: result.previewUrl,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error: {
            message: result.error || 'Failed to send email',
          },
        });
      }
    } catch (error: any) {
      console.error('Error sending order confirmation email:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Internal server error',
        },
      });
    }
  },

  testEmail: async (req: Request, res: Response) => {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email address is required',
          },
        });
      }

      const result = await emailService.sendEmail({
        to,
        subject: 'Test Email from BBS',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from the Barber Booking System.</p>
          <p>If you received this email, your email service is configured correctly!</p>
        `,
        text: 'This is a test email from the Barber Booking System.',
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Test email sent successfully',
          data: {
            messageId: result.messageId,
            previewUrl: result.previewUrl,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error: {
            message: result.error || 'Failed to send email',
          },
        });
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Internal server error',
        },
      });
    }
  },
};
