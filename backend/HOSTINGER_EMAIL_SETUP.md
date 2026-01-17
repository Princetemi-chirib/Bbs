# Hostinger Email Configuration

The email service has been configured to use Hostinger email with the following credentials:

## Configuration

- **SMTP Host:** smtp.hostinger.com
- **SMTP Port:** 465 (SSL) or 587 (TLS)
- **Email:** admin@bbslimited.online
- **Password:** Bbspasskey@2025
- **From Address:** admin@bbslimited.online

## Environment Variables

Make sure your `.env` file in the `backend` directory contains:

```env
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_USER="admin@bbslimited.online"
SMTP_PASS="Bbspasskey@2025"
EMAIL_FROM="admin@bbslimited.online"
```

## Testing the Connection

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. You should see in the console:
```
✅ Email service initialized with SMTP: smtp.hostinger.com:465 (SSL)
   From: admin@bbslimited.online
✅ Email server connection verified
```

3. Test sending an email via API:
```bash
curl -X POST http://localhost:3001/api/v1/emails/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## Troubleshooting

### Port 465 not working?
Try port 587 with TLS instead:
```env
SMTP_PORT=587
```

### Connection timeout?
- Verify your Hostinger email account is active
- Check if the password is correct
- Ensure the email account has SMTP access enabled in Hostinger panel

### Authentication failed?
- Double-check the email and password
- Make sure the email address is the full address: `admin@bbslimited.online`
- Verify SMTP is enabled for this email account in Hostinger

## Hostinger SMTP Settings Reference

- **Incoming Mail (IMAP):**
  - Server: imap.hostinger.com
  - Port: 993
  - Security: SSL/TLS

- **Outgoing Mail (SMTP):**
  - Server: smtp.hostinger.com
  - Port: 465 (SSL) or 587 (TLS)
  - Security: SSL/TLS
  - Authentication: Required
