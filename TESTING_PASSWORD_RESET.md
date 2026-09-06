# Password Reset Testing Guide - Quick Reference

## Files Changed (6 files)
1. `backend/routes/auth.js` - Fixed validate-reset-token, reset-password, email error handling
2. `backend/models/User.js` - Fixed clearPasswordResetToken to use null
3. `frontend/src/pages/ResetPassword.jsx` - Removed duplicate checks, 8+ char minimum
4. `frontend/src/context/AuthContext.jsx` - Simplified resetPassword method
5. `backend/.env` - FRONTEND_URL now single value
6. `backend/test-password-reset.mjs` - NEW comprehensive test suite

## What Was Fixed

### 🔒 Security
- ✅ Direct MongoDB queries for token validation (no JS-side searching)
- ✅ SHA-256 token hashing
- ✅ 15-minute token expiry
- ✅ Single-use tokens
- ✅ No email exposure in responses
- ✅ Rate limiting (1-minute cooldown)

### 🚀 Performance
- ✅ Token queries changed from O(n) to O(1)
- ✅ Direct hash lookup instead of loading all users

### ✅ Validation
- ✅ Password minimum increased from 6 to 8 characters (both frontend & backend)
- ✅ Passwords must match
- ✅ Token validation before form display

### 🐛 Bug Fixes
- ✅ Removed duplicate token checks
- ✅ Token no longer persisted if Nodemailer fails
- ✅ Consistent FRONTEND_URL format
- ✅ Proper field clearing with `null` instead of `undefined`

---

## Manual Testing (5-10 minutes)

### Step 1: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Watch for: "Server running on port 5003"
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Watch for: "Local: http://localhost:5173"
```

### Step 2: Register Test Account

1. Open http://localhost:5173/register
2. Fill in form:
   - Name: `Test User`
   - Email: `testuser@example.com` (or any test email)
   - Password: `TestPassword123`
   - Phone: `9876543210`
   - Interest: `AI Cameras`
3. Click "Register"
4. Should redirect to login

### Step 3: Request Password Reset

1. Navigate to http://localhost:5173/forgot-password
2. Enter email: `testuser@example.com`
3. Click "Send Reset Link"
4. See message: "If an account exists for this email, a password reset link has been sent."

### Step 4: Find Reset Link

**Check Gmail:**
1. Login to honeyvisionindiapvtltd@gmail.com
2. Look for email: "Reset your HoneyVision password"
3. Click "Reset Password" button in email
4. **Or** manually construct URL from token: `http://localhost:5173/reset-password?token=<token-from-email>`

**Check Backend Logs:**
```
[password-reset] Email sent successfully requestId=<uuid> email=testuser@example.com
```

### Step 5: Reset Password

1. You should be on: http://localhost:5173/reset-password?token=...
2. Form shows with fields:
   - New Password
   - Confirm Password
3. Enter password: `NewPassword12345`
4. Confirm: `NewPassword12345`
5. Click "Update Password"
6. See success: "Password updated successfully. Please login with your new password."
7. Auto-redirect to login after 1.5 seconds

### Step 6: Verify Old Password Doesn't Work

1. Try logging in with:
   - Email: `testuser@example.com`
   - Password: `TestPassword123` (old password)
2. Should fail: "Invalid email or password."

### Step 7: Verify New Password Works

1. Login with:
   - Email: `testuser@example.com`
   - Password: `NewPassword12345` (new password)
2. Should succeed and redirect to dashboard ✅

---

## Validation Checks

### ✅ Test Rate Limiting
1. Request password reset
2. Immediately request again
3. Second request should show generic message but no email sent
4. Wait 61 seconds
5. Third request should work

### ✅ Test Token Expiry
1. Get reset token from email
2. Wait 15 minutes (900 seconds)
3. Try to reset password
4. Should fail: "Password reset link is invalid or has expired."

### ✅ Test Invalid Token
1. Manually change URL to: `/reset-password?token=invalidtoken123`
2. Should show: "This password reset link is invalid or has expired."

### ✅ Test Password Validation
1. Reset password form
2. Enter password: `short` (only 5 chars)
3. Should fail: "Password must be at least 8 characters long."

### ✅ Test Unknown Email
1. Go to /forgot-password
2. Enter: `unknown@email.com` (not registered)
3. Should see same message: "If an account exists for this email, a password reset link has been sent."
4. Check backend logs - no email actually sent

---

## Automated Testing

### Run Full Test Suite
```bash
cd backend
npm run dev  # In Terminal 1

# In Terminal 3:
node test-password-reset.mjs
```

### Expected Output
```
🧪 Password Reset Flow Test Suite
📧 Test Email: testuser<timestamp>@example.com
...
📊 Test Results Summary
✅ PASS - Register customer
✅ PASS - Request password reset for registered email
✅ PASS - Unknown email receives generic response
✅ PASS - Rate limiting - second reset within 1 minute throttled
✅ PASS - Generate fresh reset token for validation testing
✅ PASS - Modified/invalid token rejected on validation
✅ PASS - Empty token rejected
✅ PASS - Password shorter than 8 characters rejected
✅ PASS - Password mismatch rejected
✅ PASS - Missing confirmPassword rejected
✅ PASS - Reset token validates successfully
✅ PASS - Verify authentication endpoints exist
✅ PASS - Token is hashed in database
✅ PASS - Reset token has 15-minute expiry configured
✅ PASS - No email exposure in forgot-password responses
✅ PASS - FRONTEND_URL configured (single value, no commas)
✅ PASS - Password minimum length is 8 characters
✅ PASS - Token single-use validation logic present

📈 18/18 tests passed
🎉 All password reset flow validations passed!
```

---

## Troubleshooting

### Issue: Email not received
- Check Gmail inbox (honeyvisionindiapvtltd@gmail.com)
- Check spam folder
- Check backend logs for: `[password-reset] Email sent successfully`
- If not there, check: `[password-reset] Email send failed - token NOT persisted`

### Issue: "Password reset link is invalid or has expired"
- Token might be expired (15 min max)
- Token might be already used
- Request a fresh reset link from /forgot-password

### Issue: "Passwords do not match"
- Ensure both password fields are identical
- Check for extra spaces

### Issue: "Password must be at least 8 characters"
- Password too short
- Minimum is 8 characters

### Issue: Frontend shows "Loading..." indefinitely
- Check FRONTEND_URL in backend/.env
- Should be: `FRONTEND_URL=http://localhost:5173`
- Restart backend if changed

### Issue: Login fails after reset
- Ensure you're using the NEW password (not old one)
- Try resetting again
- Check backend logs for errors

---

## Code Review Checklist

- [ ] Read `PASSWORD_RESET_CORRECTIONS.md` (full details)
- [ ] Review `backend/routes/auth.js` changes
- [ ] Review `frontend/src/pages/ResetPassword.jsx` changes
- [ ] Verify `.env` has single FRONTEND_URL
- [ ] Run automated test suite
- [ ] Perform manual end-to-end test (Steps 1-7 above)

---

## Database Schema (No Changes Required)

The password reset flow uses existing User schema fields:
- `passwordResetTokenHash` (String) - SHA-256 hash of token
- `passwordResetExpires` (Date) - Expiry time
- `passwordResetRequestedAt` (Date) - Last request time

No database migrations needed!

---

## Environment Variables

### Development (.env)
```
FRONTEND_URL=http://localhost:5173
PORT=5003
GMAIL_USER=honeyvisionindiapvtltd@gmail.com
GMAIL_APP_PASSWORD=nbrpioyqqpwukcwf
```

### Production (update on server)
```
FRONTEND_URL=https://honeyvision.in
PORT=5003
GMAIL_USER=honeyvisionindiapvtltd@gmail.com
GMAIL_APP_PASSWORD=<ask admin>
```

---

## Key Implementation Details

### Token Flow
1. User requests reset → `POST /auth/forgot-password`
2. Backend generates: `crypto.randomBytes(32).toString('hex')`
3. Backend hashes it: `crypto.createHash('sha256').update(token).digest('hex')`
4. Backend tries email send
5. Only saves if email succeeds
6. Email contains link: `https://frontend-url/reset-password?token=<raw-token>`

### Validation Flow
1. User clicks reset link → Frontend reads token from URL
2. Frontend validates: `GET /auth/validate-reset-token?token=<token>`
3. Backend hashes token and queries: `User.findOne({passwordResetTokenHash: hash})`
4. If valid, shows form; if not, shows error

### Reset Flow
1. User submits form: `POST /auth/reset-password`
2. Backend hashes token
3. Backend finds user and validates:
   - ✅ Token matches
   - ✅ Token not expired
   - ✅ Password >= 8 chars
   - ✅ Passwords match
4. Backend calls: `user.setPassword(newPassword)`
5. Backend calls: `user.clearPasswordResetToken()` (sets fields to null)
6. Backend saves and returns success
7. Frontend clears fields and redirects to login

---

## Commit History

```
70af797 - Add comprehensive password reset flow correction documentation
d1e25b6 - Correct complete customer Forgot Password → Reset Password flow
```

To see all changes:
```bash
git log --oneline -2
git show d1e25b6  # Full commit details
git diff d1e25b6^ d1e25b6  # All file changes
```

---

**Last Updated:** 2026-09-06  
**Status:** ✅ Ready for Production  
**Test Coverage:** 18+ scenarios  
**Build Status:** ✅ Passing
