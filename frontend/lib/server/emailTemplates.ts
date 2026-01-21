// Environment variables
const getEnv = () => ({
  APP_NAME: process.env.APP_NAME || 'BBS Limited',
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || 'http://localhost:3000',
});

// Brand colors
const BRAND_COLORS = {
  primary: '#39413f', // Dark green-gray
  bgLight: '#f5f5f5',
  bgCard: '#ffffff',
  textPrimary: '#39413f',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e0e0e0',
  accent: '#dcd2cc', // Light beige
};

// Helper to get logo URL (Cloudinary or fallback)
const getLogoUrl = (): string => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL?.match(/@([^.]+)/)?.[1] || 'dqigh6mt2');
  const env = getEnv();
  
  // Priority 1: Use Cloudinary if configured (RECOMMENDED for emails)
  // Upload your logo to Cloudinary and set CLOUDINARY_LOGO_PUBLIC_ID in .env.local
  if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
    const logoPublicId = process.env.CLOUDINARY_LOGO_PUBLIC_ID;
    if (logoPublicId) {
      // Use Cloudinary logo - publicly accessible, optimized for emails
      return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,q_auto,w_200/${logoPublicId}`;
    }
  }
  
  // Priority 2: Use production site URL (if deployed to Vercel/production)
  // Email clients need absolute HTTPS URLs - localhost won't work
  const productionUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  
  if (productionUrl && !productionUrl.includes('localhost')) {
    // Ensure HTTPS
    const baseUrl = productionUrl.startsWith('http') ? productionUrl : `https://${productionUrl}`;
    const logoPath = '/images/WhatsApp%20Image%202025-07-26%20at%2020.20.08_a40e3183%20-%20Edited.png';
    return `${baseUrl}${logoPath}`;
  }
  
  // Priority 3: Use bbslimited.online domain (if your Next.js site is deployed there)
  // This will work once deployed
  const logoFilename = encodeURIComponent('WhatsApp Image 2025-07-26 at 20.20.08_a40e3183 - Edited.png');
  
  // For now, use bbslimited.online domain if logo is hosted on WordPress
  // Or use Cloudinary with default path (you need to upload logo to Cloudinary)
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,q_auto,w_200/bbs/logo.png`;
};

// Shared email header with logo
const getEmailHeader = (title: string = ''): string => {
  const env = getEnv();
  const logoUrl = getLogoUrl();
  
  return `
    <tr>
      <td style="background-color: ${BRAND_COLORS.primary}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <img 
          src="${logoUrl}" 
          alt="${env.APP_NAME}" 
          style="max-width: 180px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" 
          width="180"
        />
        ${title ? `<h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${title}</h1>` : ''}
      </td>
    </tr>
  `;
};

// Shared email footer
const getEmailFooter = (): string => {
  const env = getEnv();
  
  return `
    <tr>
      <td style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; text-align: center; border-top: 1px solid ${BRAND_COLORS.border}; border-radius: 0 0 8px 8px;">
        <p style="color: ${BRAND_COLORS.textMuted}; font-size: 14px; margin: 0 0 10px 0;">
          © ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.
        </p>
        <p style="color: ${BRAND_COLORS.textMuted}; font-size: 12px; margin: 0 0 8px 0;">
          Need help? Contact us: <a href="mailto:support@bbslimited.online" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">support@bbslimited.online</a> | <a href="tel:02013306086" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">02013306086</a>
        </p>
        <p style="color: ${BRAND_COLORS.textMuted}; font-size: 12px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </td>
    </tr>
  `;
};

// Shared email wrapper
const wrapEmail = (content: string, title?: string): string => {
  const env = getEnv();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || env.APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${BRAND_COLORS.bgLight};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.bgLight}; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.bgCard}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          ${getEmailHeader(title)}
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

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
    const env = getEnv();
    const itemsList = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">
            ${item.title}${item.displayAge && item.displayAge !== 'Fixed' ? ` (${item.displayAge})` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">
            ₦${item.price.toLocaleString()}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right; font-weight: 600;">
            ₦${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>
      `
      )
      .join('');

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Order Confirmation
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.customerName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for your booking! We have received your order and payment. Your booking details are below:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
        <tr>
          <td style="padding: 12px; background-color: ${BRAND_COLORS.bgLight}; border-bottom: 2px solid ${BRAND_COLORS.primary}; font-weight: 600; color: ${BRAND_COLORS.primary};">
            Order Reference
          </td>
          <td style="padding: 12px; background-color: ${BRAND_COLORS.bgLight}; border-bottom: 2px solid ${BRAND_COLORS.primary}; text-align: right; font-weight: 600; color: ${BRAND_COLORS.primary};">
            ${data.orderReference}
          </td>
        </tr>
        ${data.paymentReference ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">
            Payment Reference
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">
            ${data.paymentReference}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">
            City
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right; text-transform: capitalize;">
            ${data.city}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">
            Service Location
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">
            ${data.location}
          </td>
        </tr>
        ${data.address ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">
            Address
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">
            ${data.address}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border};">
            Phone
          </td>
          <td style="padding: 12px; border-bottom: 1px solid ${BRAND_COLORS.border}; text-align: right;">
            ${data.phone}
          </td>
        </tr>
      </table>
      <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">
        Order Items
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; border: 1px solid ${BRAND_COLORS.border}; border-radius: 4px; overflow: hidden;">
        <thead>
          <tr style="background-color: ${BRAND_COLORS.bgLight};">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: ${BRAND_COLORS.primary}; border-bottom: 2px solid ${BRAND_COLORS.primary};">
              Service
            </th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: ${BRAND_COLORS.primary}; border-bottom: 2px solid ${BRAND_COLORS.primary};">
              Qty
            </th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: ${BRAND_COLORS.primary}; border-bottom: 2px solid ${BRAND_COLORS.primary};">
              Unit Price
            </th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: ${BRAND_COLORS.primary}; border-bottom: 2px solid ${BRAND_COLORS.primary};">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 18px; color: ${BRAND_COLORS.primary}; border-top: 2px solid ${BRAND_COLORS.primary};">
              Total:
            </td>
            <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 18px; color: ${BRAND_COLORS.primary}; border-top: 2px solid ${BRAND_COLORS.primary};">
              ₦${data.total.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">
          What's Next?
        </h3>
        <ul style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Our team will contact you shortly to confirm your appointment</li>
          <li>A professional barber will arrive at your chosen location</li>
          <li>You'll receive email updates tracking your barber's location</li>
          <li>The barber will arrive within 10 minutes of your booking</li>
        </ul>
      </div>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
        If you have any questions, please don't hesitate to contact us.
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'Order Confirmation');
  },

  orderConfirmationText: (data: OrderConfirmationEmailData): string => {
    const env = getEnv();
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

  // Barber Assignment Email
  barberAssignment: (data: {
    barberName: string;
    barberEmail: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    city: string;
    location: string;
    address?: string;
    items: Array<{ title: string; quantity: number }>;
    totalAmount: number;
  }): string => {
    const env = getEnv();
    const itemsList = data.items.map(item => `- ${item.title} (x${item.quantity})`).join('<br>');

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        New Order Assigned
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.barberName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        A new order has been assigned to you. Please review the details below and accept or decline the assignment.
      </p>
      
      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary};">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Order Number:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Customer:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Phone:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;"><a href="tel:${data.customerPhone}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${data.customerPhone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Location:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.city}, ${data.location}</td>
          </tr>
          ${data.address ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Address:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.address}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Services:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${itemsList}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Total Amount:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.primary}; text-align: right; font-weight: 700; font-size: 18px;">₦${data.totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
        <ol style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the order details</li>
          <li>Accept the order if you're available</li>
          <li>Update your status as you progress (On The Way → Arrived → Completed)</li>
          <li>Arrive at the customer's location within 10 minutes</li>
        </ol>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
        Please log into your barber dashboard to accept or decline this order.
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'New Order Assignment');
  },

  barberAssignmentText: (data: {
    barberName: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    city: string;
    location: string;
    items: Array<{ title: string; quantity: number }>;
    totalAmount: number;
  }): string => {
    const env = getEnv();
    return `
New Order Assigned - ${env.APP_NAME}

Hello ${data.barberName},

A new order has been assigned to you. Please review and accept or decline.

ORDER DETAILS:
Order Number: ${data.orderNumber}
Customer: ${data.customerName}
Phone: ${data.customerPhone}
Location: ${data.city}, ${data.location}
Services: ${data.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}
Total: ₦${data.totalAmount.toLocaleString()}

Please log into your barber dashboard to accept or decline.

Best regards,
${env.APP_NAME} Team
    `.trim();
  },

  // Barber Acceptance Email (to Customer)
  barberAccepted: (data: {
    customerName: string;
    orderNumber: string;
    barberName: string;
    barberPhone?: string;
    city: string;
    location: string;
    estimatedArrival?: string;
  }): string => {
    const env = getEnv();
    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Your Barber is Preparing
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.customerName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! A professional barber has accepted your order and is preparing to serve you.
      </p>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary};">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Your Barber</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Order Number:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Assigned Barber:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.barberName}</td>
          </tr>
          ${data.barberPhone ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Barber Phone:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;"><a href="tel:${data.barberPhone}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${data.barberPhone}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Service Location:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.city}, ${data.location}</td>
          </tr>
          ${data.estimatedArrival ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Estimated Arrival:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.primary}; text-align: right; font-weight: 600;">${data.estimatedArrival}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">What Happens Next?</h3>
        <ul style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Your barber is preparing their tools and equipment</li>
          <li>You'll receive another email when the barber is on the way</li>
          <li>You'll be notified when the barber arrives at your location</li>
          <li>The barber will arrive within 10 minutes</li>
        </ul>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
        Please ensure you're available at the service location. If you have any questions, don't hesitate to contact us.
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'Barber Accepted Your Order');
  },

  // On The Way Email
  barberOnTheWay: (data: {
    customerName: string;
    orderNumber: string;
    barberName: string;
    barberPhone?: string;
    estimatedArrival: string;
    city: string;
    location: string;
  }): string => {
    const env = getEnv();
    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Your Barber is On The Way! 🚗
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.customerName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! Your barber <strong>${data.barberName}</strong> is now on the way to your location.
      </p>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary}; text-align: center;">
        <p style="color: ${BRAND_COLORS.textPrimary}; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">
          Estimated Arrival
        </p>
        <p style="color: ${BRAND_COLORS.primary}; font-size: 28px; margin: 0; font-weight: 700;">
          ${data.estimatedArrival}
        </p>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Barber Information</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Order Number:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Barber:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.barberName}</td>
          </tr>
          ${data.barberPhone ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Contact:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;"><a href="tel:${data.barberPhone}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${data.barberPhone}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Service Location:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.city}, ${data.location}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Please Be Ready</h3>
        <ul style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Ensure you're available at the service location</li>
          <li>Keep your phone accessible in case the barber needs to contact you</li>
          <li>You'll receive another notification when the barber arrives</li>
        </ul>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'Barber On The Way');
  },

  // Barber Arrived Email
  barberArrived: (data: {
    customerName: string;
    orderNumber: string;
    barberName: string;
    barberPhone?: string;
  }): string => {
    const env = getEnv();
    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Your Barber Has Arrived! ✂️
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.customerName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your barber <strong>${data.barberName}</strong> has arrived at your location and is ready to provide your service!
      </p>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary}; text-align: center;">
        <p style="color: ${BRAND_COLORS.textPrimary}; font-size: 20px; margin: 0 0 10px 0; font-weight: 600;">
          Order Number
        </p>
        <p style="color: ${BRAND_COLORS.primary}; font-size: 24px; margin: 0; font-weight: 700;">
          ${data.orderNumber}
        </p>
        ${data.barberPhone ? `
        <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 14px; margin: 20px 0 0 0;">
          Barber Contact: <a href="tel:${data.barberPhone}" style="color: ${BRAND_COLORS.primary}; text-decoration: none; font-weight: 600;">${data.barberPhone}</a>
        </p>
        ` : ''}
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
        <ul style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Greet your barber and confirm your service requirements</li>
          <li>Your barber will begin providing the requested services</li>
          <li>After service completion, you'll receive a completion email</li>
          <li>We'd love to hear your feedback via a review</li>
        </ul>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Enjoy your service!<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'Barber Arrived');
  },

  // Service Complete Email
  serviceComplete: (data: {
    customerName: string;
    orderNumber: string;
    barberName: string;
    items: Array<{ title: string; quantity: number }>;
    totalAmount: number;
    reviewLink?: string;
  }): string => {
    const env = getEnv();
    const itemsList = data.items.map(item => `<li style="margin: 5px 0;">${item.title} (x${item.quantity})</li>`).join('');

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Service Completed! ✨
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.customerName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your service has been completed successfully! We hope you're satisfied with the quality of service provided by <strong>${data.barberName}</strong>.
      </p>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary};">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Service Summary</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Order Number:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Barber:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.barberName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Services:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">
              <ul style="margin: 0; padding: 0; list-style: none; text-align: right;">
                ${itemsList}
              </ul>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Total Paid:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.primary}; text-align: right; font-weight: 700; font-size: 18px;">₦${data.totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      ${data.reviewLink ? `
      <div style="background-color: ${BRAND_COLORS.primary}; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 20px;">Share Your Experience</h3>
        <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          We'd love to hear about your experience! Your feedback helps us improve our services.
        </p>
        <a href="${data.reviewLink}" style="display: inline-block; background-color: #ffffff; color: ${BRAND_COLORS.primary}; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 700; font-size: 16px;">
          Rate & Review
        </a>
      </div>
      ` : ''}

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Thank You!</h3>
        <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
          Thank you for choosing ${env.APP_NAME}. We hope to serve you again soon!
        </p>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'Service Completed');
  },

  // Barber Decline Email (to Admin)
  barberDeclined: (data: {
    adminEmail: string;
    orderNumber: string;
    customerName: string;
    barberName: string;
    declineReason?: string;
    city: string;
    location: string;
  }): string => {
    const env = getEnv();
    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Order Declined by Barber
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello Admin,
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        The assigned barber has declined the following order. Please reassign it to another barber.
      </p>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #dc3545;">
        <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Order Number:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Customer:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Declined By:</strong></td>
            <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: 600;">${data.barberName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Location:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.city}, ${data.location}</td>
          </tr>
          ${data.declineReason ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary}; vertical-align: top;"><strong>Reason:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.declineReason}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Action Required</h3>
        <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
          Please log into the admin dashboard and reassign this order to another available barber.
        </p>
        <a href="${env.BASE_URL}/admin/orders" style="display: inline-block; background-color: ${BRAND_COLORS.primary}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 700; margin-top: 10px;">
          View Orders Dashboard
        </a>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} System</strong>
      </p>
    `;

    return wrapEmail(content, 'Order Declined');
  },

  // Customer Notification - Barber Assigned (to Customer)
  customerBarberAssigned: (data: {
    customerName: string;
    orderNumber: string;
    barberName: string;
    barberPhone?: string;
    barberPicture?: string;
    city: string;
    location: string;
    address?: string;
    items: Array<{ title: string; quantity: number }>;
    totalAmount: number;
  }): string => {
    const env = getEnv();
    const itemsList = data.items.map(item => `- ${item.title} (x${item.quantity})`).join('<br>');
    
    // Get barber picture URL or use default
    const barberPictureUrl = data.barberPicture || 'https://via.placeholder.com/150?text=Barber';

    const content = `
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 24px;">
        Your Barber Has Been Assigned! ✂️
      </h2>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello ${data.customerName},
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! A professional barber has been assigned to your order and will be in touch with you shortly.
      </p>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 30px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary}; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img 
            src="${barberPictureUrl}" 
            alt="${data.barberName}"
            style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid ${BRAND_COLORS.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);"
          />
        </div>
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">
          ${data.barberName}
        </h3>
        <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 14px; margin: 0;">
          Your Assigned Professional Barber
        </p>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${BRAND_COLORS.primary};">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Order Number:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Barber:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.barberName}</td>
          </tr>
          ${data.barberPhone ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Barber Phone:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;"><a href="tel:${data.barberPhone}" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">${data.barberPhone}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Service Location:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.city}, ${data.location}</td>
          </tr>
          ${data.address ? `
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Address:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${data.address}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Services:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textPrimary}; text-align: right;">${itemsList}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.textSecondary};"><strong>Total Amount:</strong></td>
            <td style="padding: 8px 0; color: ${BRAND_COLORS.primary}; text-align: right; font-weight: 700; font-size: 18px;">₦${data.totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: ${BRAND_COLORS.bgLight}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: ${BRAND_COLORS.primary}; margin: 0 0 15px 0; font-size: 18px;">What Happens Next?</h3>
        <ul style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Your assigned barber will review your order</li>
          <li>You'll receive a notification when the barber accepts your order</li>
          <li>You'll be notified when the barber is on the way to your location</li>
          <li>The barber will arrive at your location to provide the service</li>
        </ul>
      </div>

      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
        Your barber will contact you soon. If you have any questions, don't hesitate to reach out to us.
      </p>
      <p style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.6; margin: 0;">
        Best regards,<br>
        <strong style="color: ${BRAND_COLORS.primary};">${env.APP_NAME} Team</strong>
      </p>
    `;

    return wrapEmail(content, 'Barber Assigned to Your Order');
  },

  customerBarberAssignedText: (data: {
    customerName: string;
    orderNumber: string;
    barberName: string;
    barberPhone?: string;
    city: string;
    location: string;
    items: Array<{ title: string; quantity: number }>;
    totalAmount: number;
  }): string => {
    const env = getEnv();
    return `
Barber Assigned to Your Order - ${env.APP_NAME}

Hello ${data.customerName},

Great news! A professional barber has been assigned to your order.

Order Number: ${data.orderNumber}
Barber: ${data.barberName}
${data.barberPhone ? `Barber Phone: ${data.barberPhone}\n` : ''}Service Location: ${data.city}, ${data.location}
Services: ${data.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}
Total: ₦${data.totalAmount.toLocaleString()}

Your barber will contact you soon. You'll receive notifications as your order progresses.

Best regards,
${env.APP_NAME} Team
    `.trim();
  },
};
