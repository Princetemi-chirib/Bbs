# Paystack Payment Debug Plan

## Problem
Payment initialization fails with: "Failed to initialize payment. Please check that all form fields are filled correctly and the amount is valid (minimum ₦1.00)."

## Complete Debug Checklist

### Phase 1: Environment & Configuration ✅

#### Step 1.1: Verify Environment Variables
```bash
# Check if env variable is set (in frontend/.env.local)
cat frontend/.env.local | grep PAYSTACK
```

**Expected:** 
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_e612c0b2ef774a61c9734df0384b83778026cc9e
```

**Check:**
- [ ] Variable name is exactly `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- [ ] No quotes around the value
- [ ] No spaces around `=`
- [ ] Key starts with `pk_` (not `sk_`)
- [ ] Key is at least 40 characters long

#### Step 1.2: Verify Dev Server Loads Env
1. Restart dev server: `npm run dev`
2. Open browser console (F12)
3. Look for: `🔍 Paystack Public Key Check:`
4. **Expected output:**
   ```javascript
   {
     hasKey: true,
     keyLength: 56,
     keyPrefix: "pk_live_e612c0b2ef77...",
     startsWithPk: true,
     isConfigured: true,
     fullEnvCheck: "Found"
   }
   ```
5. **If `fullEnvCheck: "Missing"`** → Env variable not loaded, restart server

---

### Phase 2: Code Issues 🔧

#### Step 2.1: React Hook Violation (CRITICAL)
**Issue:** `usePaystackPayment` hook is being called conditionally, which violates React rules.

**Fix Applied:**
- Hook now always called (with fallback key if needed)
- Check console for hook initialization errors

#### Step 2.2: Invalid Config Parameters
**Check browser console for:**
- `🔍 Paystack Payment Config Validation:` - Shows all parameter validation
- `Paystack Validation Issues:` - Shows specific Paystack errors

**Common Issues:**
1. **Amount invalid:**
   - Must be integer >= 100 (100 kobo = ₦1.00)
   - Check: `amountValid: true` in console

2. **Email invalid:**
   - Must be valid email format
   - Check: `emailValid: true` in console

3. **Reference invalid:**
   - Must be unique string
   - Check: `referenceValid: true` in console

4. **Metadata issues:**
   - Custom fields values too long
   - Invalid characters in metadata

#### Step 2.3: Hook Initialization
**Check console for:**
- `🚀 About to call initializePayment:`
- Verify: `isFunction: true`
- Verify: `publicKeyConfigured: true`

**If `isFunction: false`:**
- React Paystack module not loaded correctly
- Check: `usePaystackPaymentExists: true`

---

### Phase 3: Paystack API Validation ❌

#### Step 3.1: Check Paystack Error Details
When error occurs, look for:
```
Paystack Validation Issues:
Issue 1: { message: "...", ... }
Issue 2: { ... }
```

**Common Paystack Validation Errors:**

1. **"Invalid parameter type: amount"**
   - **Fix:** Amount must be NUMBER (not string)
   - Check: `typeof config.amount === 'number'`

2. **"Invalid email format"**
   - **Fix:** Email must be lowercase, valid format
   - Check: Email validation in code

3. **"Reference already exists"**
   - **Fix:** Reference generation not unique
   - Already handled with timestamp + random

4. **"Invalid public key"**
   - **Fix:** Public key format wrong or expired
   - Verify key in Paystack dashboard

#### Step 3.2: Test Paystack Configuration
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Settings → API Keys
3. Verify public key matches your env variable
4. Check if account is active/verified

---

### Phase 4: Network & Browser Issues 🌐

#### Step 4.1: Browser Console Errors
**Check for:**
- CORS errors
- Network errors
- Script loading errors
- Ad blocker blocking Paystack scripts

#### Step 4.2: Paystack Script Loading
**Check Network tab:**
1. Open DevTools → Network tab
2. Click "Pay" button
3. Look for requests to:
   - `*.paystack.com`
   - Paystack script loads

**If scripts don't load:**
- Check ad blocker
- Check CSP (Content Security Policy)
- Try incognito mode

---

### Phase 5: Testing Procedure 🧪

#### Step 5.1: Minimal Test
1. Fill checkout form with valid data
2. Open browser console (F12)
3. Fill form:
   - First Name: "Test"
   - Last Name: "User"
   - Email: "test@example.com"
   - Phone: "08012345678"
   - State: Select any
   - City: Select any
   - Location: "Test Location"
4. Set cart total to exactly ₦1.00 (100 kobo minimum)
5. Click "Pay"
6. **Watch console for all debug logs**

#### Step 5.2: Expected Console Flow
```
✅ 🔍 Paystack Public Key Check: { isConfigured: true, ... }
✅ Amount validation: { amountInKobo: 100, ... }
✅ 🔍 Paystack Payment Config Validation: { all validations: true }
✅ 🚀 About to call initializePayment: { isFunction: true }
✅ ✅ Payment initialization called successfully - Paystack modal should open
```

#### Step 5.3: If Error Occurs
Check console for:
1. **Which phase failed?** (Env → Code → Paystack)
2. **What's the error message?**
3. **Are there validation issues?** (Check `Paystack Validation Issues`)

---

### Phase 6: Code Fixes Applied ✅

1. ✅ **React Hook Fix:** Hook always called (with fallback)
2. ✅ **Removed invalid `callback` field** from config
3. ✅ **Enhanced error logging** with detailed validation
4. ✅ **Added comprehensive debug logs** at each step

---

### Phase 7: Quick Debug Commands

```bash
# Check env variable exists
cd frontend
cat .env.local | grep NEXT_PUBLIC_PAYSTACK

# Verify package installed
npm list react-paystack

# Check for TypeScript errors
npm run build
```

---

### Phase 8: Still Not Working? 

**Collect this information:**
1. Complete console output (all logs)
2. Network tab screenshot (Paystack requests)
3. Browser console errors
4. Environment check output
5. Paystack dashboard screenshot (API Keys section)

**Then check:**
- Is Paystack account active?
- Are you using test keys in production (or vice versa)?
- Is the public key correct in Paystack dashboard?
