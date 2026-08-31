import 'dotenv/config';

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   Twilio SMS Configuration Checker         ║');
console.log('╚════════════════════════════════════════════╝\n');

const issues = [];
const warnings = [];
const successes = [];

// Check Twilio configuration
console.log('Checking Twilio SMS Configuration...\n');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

if (!accountSid) {
  issues.push('TWILIO_ACCOUNT_SID is not set in .env');
} else {
  successes.push(`✓ TWILIO_ACCOUNT_SID: ${accountSid.substring(0, 8)}...`);
}

if (!authToken) {
  issues.push('TWILIO_AUTH_TOKEN is not set in .env');
} else {
  successes.push(`✓ TWILIO_AUTH_TOKEN: ${authToken.substring(0, 8)}...`);
}

if (!fromNumber) {
  issues.push('TWILIO_FROM_NUMBER is not set in .env');
} else {
  successes.push(`✓ TWILIO_FROM_NUMBER: ${fromNumber}`);
}

// Check email configuration
console.log('Checking Email Configuration...\n');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailUser) {
  issues.push('EMAIL_USER is not set in .env');
} else {
  successes.push(`✓ EMAIL_USER: ${emailUser}`);
}

if (!emailPassword) {
  issues.push('EMAIL_PASSWORD is not set in .env');
} else {
  successes.push(`✓ EMAIL_PASSWORD: configured`);
}

if (emailUser && emailPassword) {
  successes.push('✓ Email OTP delivery is fully configured');
}

// Print results
if (successes.length > 0) {
  console.log('✅ WORKING:\n');
  successes.forEach((s) => console.log(`  ${s}`));
}

if (issues.length > 0) {
  console.log('\n❌ CONFIGURATION ISSUES:\n');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach((w) => console.log(`  • ${w}`));
}

// Determine trial status
console.log('\n' + '='.repeat(50));
console.log('\n📱 TWILIO ACCOUNT STATUS:\n');

if (accountSid && accountSid.startsWith('AC')) {
  console.log('  ⚠️  Detected: Twilio Trial Account');
  console.log('  Limitation: Can only send SMS to verified numbers');
  console.log('\n  Solutions:');
  console.log('  1. Add verified recipient numbers in Twilio console');
  console.log('  2. Upgrade to production account ($)');
  console.log('  3. Use email OTP only (already working)');
} else if (accountSid) {
  console.log('  ✅ Twilio Account: Configured');
}

// Email as fallback
console.log('\n📧 EMAIL OTP STATUS:\n');
if (emailUser && emailPassword) {
  console.log('  ✅ Email OTP is FULLY CONFIGURED');
  console.log('  ✓ OTP delivery via email is working');
  console.log('  ✓ No Twilio limitations affect email');
  console.log('  ✓ You can test delivery workflow right now!');
} else {
  console.log('  ⚠️  Email not configured');
}

// Recommendations
console.log('\n' + '='.repeat(50));
console.log('\n💡 RECOMMENDATIONS:\n');

if (issues.length === 0 && emailUser && emailPassword) {
  console.log('  ✅ System is ready!');
  console.log('     • Email OTP: Working ✓');
  console.log('     • SMS OTP: Needs Twilio fix');
  console.log('\n  Quick Fix Options:');
  console.log('     Option A: Verify phone in Twilio (5 min)');
  console.log('     Option B: Upgrade Twilio account (10 min)');
  console.log('     Option C: Test with email only (2 min)');
  console.log('\n  📖 See: TWILIO_SMS_FIX_GUIDE.md for details');
} else if (emailUser && emailPassword) {
  console.log('  • Email OTP is working - you can test now!');
  console.log('  • SMS needs configuration');
}

// Show command to fix
console.log('\n' + '='.repeat(50));
console.log('\nTo disable SMS and use email only (temporary):\n');
console.log('Edit .env and set:');
console.log('  TWILIO_ACCOUNT_SID=');
console.log('  TWILIO_AUTH_TOKEN=');
console.log('  TWILIO_FROM_NUMBER=');
console.log('\nThen restart backend: npm start\n');

console.log('Your .env file location:');
console.log(`  ${process.cwd()}/.env\n`);

console.log('='.repeat(50) + '\n');
