## 📧 SENDGRID EMAIL TEMPLATE UPDATE GUIDE

### 🔗 Your Verification URL

```
https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token={{verification_token}}
```

### 📝 STEP-BY-STEP INSTRUCTIONS

#### 1. **Access SendGrid Dashboard**

- Go to [SendGrid.com](https://sendgrid.com)
- Log into your SendGrid account
- Navigate to **Email API** → **Dynamic Templates**

#### 2. **Find Your Email Verification Template**

- Look for your existing email verification template
- OR create a new dynamic template if needed
- Click **Edit** on the template

#### 3. **Update the Template HTML**

**Option A: Simple Button Link**

```html
<a
  href="https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token={{verification_token}}"
  style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;"
>
  Verify Your Email
</a>
```

**Option B: Complete Verification Section**

```html
<div style="text-align: center; margin: 30px 0;">
  <h2>Please Verify Your Email Address</h2>
  <p>
    Click the button below to verify your email and activate your EarnPro
    account:
  </p>

  <a
    href="https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token={{verification_token}}"
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px;
            margin: 20px 0;"
  >
    ✅ Verify Email Address
  </a>

  <p style="font-size: 14px; color: #666;">
    Or copy and paste this link in your browser:<br />
    <span style="font-family: monospace; background: #f5f5f5; padding: 5px;">
      https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token={{verification_token}}
    </span>
  </p>
</div>
```

#### 4. **Template Variables Setup**

**Required Variable:**

- `verification_token` - This will be populated from your database

**Optional Variables (if you want to personalize):**

- `user_name` - User's name
- `user_email` - User's email address
- `app_name` - Your app name (EarnPro)

#### 5. **Test the Template**

**In SendGrid Dashboard:**

- Use the "Test Data" feature
- Add test value for `verification_token`: `test-token-123`
- Send test email to yourself
- Verify the link format is correct

#### 6. **Save and Activate**

- Click **Save** to save your template
- Note down the **Template ID** (you'll need this in your code)
- Set the template as **Active**

### 🔧 **Integration with Your App**

When sending emails from your application, use this format:

```javascript
// Example for Node.js/JavaScript
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: userEmail,
  from: "noreply@yourapp.com",
  templateId: "your-template-id-here",
  dynamicTemplateData: {
    verification_token: tokenFromDatabase,
    user_name: userName,
    user_email: userEmail,
    app_name: "EarnPro",
  },
};

await sgMail.send(msg);
```

### ✅ **Verification Checklist**

- [ ] Template updated with correct verification URL
- [ ] `{{verification_token}}` variable included in URL
- [ ] Link styling matches your brand
- [ ] Test email sent and verified
- [ ] Template ID noted for code integration
- [ ] Backup link provided in email (recommended)

### 🎨 **Email Template Best Practices**

1. **Clear Call-to-Action**: Make the verify button prominent
2. **Backup Link**: Include plain text URL as fallback
3. **Branding**: Match your app's colors and style
4. **Mobile-Friendly**: Ensure button works on mobile devices
5. **Security Note**: Mention link expires in X hours/days

### 🚨 **Important Notes**

- The URL will work directly from email clicks (no headers needed)
- Users will see a beautiful verification page after clicking
- Successful verification automatically redirects to payment page
- Invalid/expired tokens show proper error page with retry option

### 📞 **Need Help?**

If you encounter issues:

1. Check the template preview in SendGrid
2. Test with a real verification token from your database
3. Verify the template ID is correct in your sending code
