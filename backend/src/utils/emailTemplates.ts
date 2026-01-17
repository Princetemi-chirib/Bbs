import { env } from '../config/env';

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  displayAge?: string;
}

interface OrderConfirmationEmailData {
  customerName: string;
  customerEmail: string;
  orderReference: string;
  items: OrderItem[];
  total: number;
  city: string;
  location: string;
  address?: string;
  phone: string;
  paymentReference?: string;
}

export const emailTemplates = {
  orderConfirmation: (data: OrderConfirmationEmailData): string => {
    const itemsList = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
            ${item.title}${item.displayAge && item.displayAge !== 'Fixed' ? ` (${item.displayAge})` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
            ₦${item.price.toLocaleString()}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600;">
            ₦${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>
      `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${env.APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #39413f; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ${env.APP_NAME}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #39413f; margin: 0 0 20px 0; font-size: 24px;">
                Order Confirmation
              </h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${data.customerName},
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for your booking! We have received your order and payment. Your booking details are below:
              </p>
              
              <!-- Order Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #39413f; font-weight: 600; color: #39413f;">
                    Order Reference
                  </td>
                  <td style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #39413f; text-align: right; font-weight: 600; color: #39413f;">
                    ${data.orderReference}
                  </td>
                </tr>
                ${data.paymentReference ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    Payment Reference
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                    ${data.paymentReference}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    City
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; text-transform: capitalize;">
                    ${data.city}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    Service Location
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                    ${data.location}
                  </td>
                </tr>
                ${data.address ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    Address
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                    ${data.address}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    Phone
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                    ${data.phone}
                  </td>
                </tr>
              </table>
              
              <!-- Order Items -->
              <h3 style="color: #39413f; margin: 0 0 15px 0; font-size: 18px;">
                Order Items
              </h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #39413f; border-bottom: 2px solid #39413f;">
                      Service
                    </th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #39413f; border-bottom: 2px solid #39413f;">
                      Qty
                    </th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #39413f; border-bottom: 2px solid #39413f;">
                      Unit Price
                    </th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #39413f; border-bottom: 2px solid #39413f;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 18px; color: #39413f; border-top: 2px solid #39413f;">
                      Total:
                    </td>
                    <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #39413f; border-top: 2px solid #39413f;">
                      ₦${data.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
              
              <!-- Next Steps -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #39413f; margin: 0 0 15px 0; font-size: 18px;">
                  What's Next?
                </h3>
                <ul style="color: #666666; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Our team will contact you shortly to confirm your appointment</li>
                  <li>A professional barber will arrive at your chosen location</li>
                  <li>You'll receive email updates tracking your barber's location</li>
                  <li>The barber will arrive within 10 minutes of your booking</li>
                </ul>
              </div>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                If you have any questions, please don't hesitate to contact us.
              </p>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                Best regards,<br>
                <strong style="color: #39413f;">${env.APP_NAME} Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                This is an automated email. Please do not reply to this message.
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
  },

  orderConfirmationText: (data: OrderConfirmationEmailData): string => {
    const itemsList = data.items
      .map(
        (item) =>
          `- ${item.title}${item.displayAge && item.displayAge !== 'Fixed' ? ` (${item.displayAge})` : ''} - Qty: ${item.quantity} - ₦${item.price.toLocaleString()} each - Total: ₦${(item.price * item.quantity).toLocaleString()}`
      )
      .join('\n');

    return `
Order Confirmation - ${env.APP_NAME}

Hello ${data.customerName},

Thank you for your booking! We have received your order and payment.

ORDER DETAILS:
Order Reference: ${data.orderReference}
${data.paymentReference ? `Payment Reference: ${data.paymentReference}\n` : ''}City: ${data.city}
Service Location: ${data.location}
${data.address ? `Address: ${data.address}\n` : ''}Phone: ${data.phone}

ORDER ITEMS:
${itemsList}

TOTAL: ₦${data.total.toLocaleString()}

WHAT'S NEXT?
- Our team will contact you shortly to confirm your appointment
- A professional barber will arrive at your chosen location
- You'll receive email updates tracking your barber's location
- The barber will arrive within 10 minutes of your booking

If you have any questions, please don't hesitate to contact us.

Best regards,
${env.APP_NAME} Team

© ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.
    `.trim();
  },
};
