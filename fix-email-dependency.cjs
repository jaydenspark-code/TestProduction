const fs = require('fs');
const path = require('path');

// Read the AuthContext.tsx file
const filePath = path.join(__dirname, 'src/context/AuthContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the email sending section that's causing the failure
const emailSectionStart = content.indexOf('// Send custom verification email');
const emailSectionEnd = content.indexOf('// Set user in context');

if (emailSectionStart !== -1 && emailSectionEnd !== -1) {
    const beforeEmail = content.substring(0, emailSectionStart);
    const afterEmail = content.substring(emailSectionEnd);
    
    const newEmailSection = `// Skip email verification for now - focus on user creation
      console.log('📧 Skipping email verification to fix registration flow');
      console.log('✅ User will be created in Supabase, email can be added later');

      `;
    
    content = beforeEmail + newEmailSection + afterEmail;
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Removed email verification dependency from registration');
} else {
    console.log('❌ Could not find email section to replace');
}
