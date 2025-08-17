const fs = require('fs');
const path = require('path');

// Read the Register.tsx file
const filePath = path.join(__dirname, 'src/components/Auth/Register.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the button type from "button" to "submit" and remove the onClick handler
const oldButtonPattern = /type="button"\s+disabled=\{loading\}\s+onClick=\{async \(e\) => \{[\s\S]*?\}\}/;
const newButtonContent = 'type="submit"\n                  disabled={loading}';

if (oldButtonPattern.test(content)) {
    content = content.replace(oldButtonPattern, newButtonContent);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed register button - changed from type="button" with onClick to type="submit"');
} else {
    console.log('❌ Could not find the button pattern to replace');
}
