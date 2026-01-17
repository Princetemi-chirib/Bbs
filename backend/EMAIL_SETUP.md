# Email Service Setup Guide

This guide explains how to set up the email service for sending order confirmations and other notifications.

## Development Setup (Test Emails)

For development, you don't need to configure SMTP. The system will automatically use **Ethereal Email** (a test email service) when SMTP credentials are not provided.

**Features:**
- ✅ No configuration needed
- ✅ Emails are intercepted (not actually sent)
- ✅ Preview URLs provided in console logs
- ✅ Perfect for testing

When you start the server without SMTP credentials, you'll see:
```
⚠️  SMTP credentials not provided. Using test email service (Ethereal).
📧 Test email account created:
   User: [generated-email]
   Pass: [generated-password]
```

You can then view emails at: https://ethereal.email/

## Production Setup (Real Emails)

For production, configure SMTP with one of these providers:

### Option 1: Gmail (Easy Setup)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "BBS" as the name
   - Copy the generated 16-character password

3. **Update `.env` file:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
EMAIL_FROM="noreply@bbslimited.online"
```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com/
2. **Create an API Key:**
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key

3. **Update `.env` file:**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="noreply@bbslimited.online"
```

### Option 3: Mailgun

1. **Sign up** at https://www.mailgun.com/
2. **Get SMTP credentials** from your Mailgun dashboard

3. **Update `.env` file:**
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT=587
SMTP_USER="your-mailgun-username"
SMTP_PASS="your-mailgun-password"
EMAIL_FROM="noreply@yourdomain.com"
```

### Option 4: Other SMTP Providers

Most SMTP providers follow the same pattern. Update these values:
- `SMTP_HOST`: Your provider's SMTP server
- `SMTP_PORT`: Usually 587 (TLS) or 465 (SSL)
- `SMTP_USER`: Your email/username
- `SMTP_PASS`: Your password/API key
- `EMAIL_FROM`: The "from" email address

## API Endpoints

### Send Order Confirmation Email

**POST** `/api/v1/emails/order-confirmation`

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "orderReference": "ORD-123456",
  "items": [
    {
      "title": "Classic Haircut",
      "quantity": 2,
      "price": 12000,
      "displayAge": "Adult"
    }
  ],
  "total": 24000,
  "city": "Lagos",
  "location": "Victoria Island",
  "address": "123 Main Street",
  "phone": "08012345678",
  "paymentReference": "PAY-789012"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order confirmation email sent successfully",
  "data": {
    "messageId": "...",
    "previewUrl": "https://ethereal.email/..." // Only in development
  }
}
```

### Test Email

**POST** `/api/v1/emails/test`

**Request Body:**
```json
{
  "to": "test@example.com"
}
```

## Testing

1. **Start the backend server:**
```bash
cd backend
npm run dev
```

2. **Test the email service:**
```bash
curl -X POST http://localhost:3001/api/v1/emails/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

3. **Check the console** for email preview URL (if using test emails)

## Troubleshooting

### "Email transporter not initialized"
- Make sure the server started successfully
- Check console logs for initialization errors

### Gmail "Less secure app" error
- Enable 2-Factor Authentication
- Use an App Password (not your regular password)

### Connection timeout
- Check firewall settings
- Verify SMTP_HOST and SMTP_PORT are correct
- Try port 465 with `secure: true` in emailService.ts

### Emails not received
- Check spam folder
- Verify email address is correct
- Check SMTP provider logs/dashboard
- In development, check Ethereal inbox

## Email Templates

Email templates are located in `backend/src/utils/emailTemplates.ts`. You can customize:
- Order confirmation emails
- Add new email types (welcome, booking reminder, etc.)

## Security Notes

- ⚠️ Never commit `.env` file to version control
- ⚠️ Use environment variables for all credentials
- ⚠️ Use App Passwords or API Keys, not regular passwords
- ⚠️ Enable 2FA on your email account
