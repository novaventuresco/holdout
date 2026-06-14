# Deployment Playbook

Complete guide for deploying the Daily Goals app to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Build](#production-build)
3. [App Store Submission](#app-store-submission)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Security Verification](#security-verification)

---

## Pre-Deployment Checklist

**Complete this checklist before building for production and submitting to TestFlight.**

### 🔴 CRITICAL - Must Complete Before Building

#### 1. Code & Security ✅

- [x] **Console logging fixed** - All `console.warn` calls replaced with `debugWarn` (OnboardingFlow.tsx fixed)
- [x] **Debug config disabled** - `ENABLE_CONSOLE_LOGS: false` in `lib/debugConfig.ts`
- [x] **Production verification script** - `npm run verify:production` available
- [ ] **Run verification** - Execute `npm run verify:production` to confirm before building

**Quick verification:**
```bash
npm run verify:production
```

#### 2. Environment Variables ⚠️ **ACTION REQUIRED**

**Critical:** Production builds require separate environment variables from preview/development.

**Verify production environment variables are set:**
```bash
eas env:list --environment production
```

**Expected output:**
```
Environment variables with visibility "Plain text" and "Sensitive" loaded from the "production" environment on EAS:
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_KEY
```

**If missing, set them:**
```bash
# Set production Supabase URL
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod-project.supabase.co" --type string --environment production

# Set production Supabase Key
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_KEY --value "your_prod_anon_key" --type string --environment production
```

**⚠️ Important:** 
- Use **production** Supabase credentials (not development/test)
- Variables set for "preview" are NOT available for "production"
- Set them separately for each environment

#### 3. Production Database Setup ⚠️ **ACTION REQUIRED**

**Verify production Supabase project exists:**
- [ ] Production Supabase project created
- [ ] Schema migrated to production database
- [ ] RLS policies verified in production
- [ ] Test account created and verified in production

**Steps:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Verify production project exists (or create new one)
3. Run schema migration (`supabase/schema.sql`) in production SQL Editor
4. Verify RLS policies:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'daily_goals';
   -- Should return: rowsecurity = true
   ```
5. Create test account and verify data isolation

#### 4. App Configuration ✅

- [x] **Bundle identifier** - `com.novaventuresco.dailygoals` configured
- [x] **App version** - `1.0.0` set in `app.config.js`
- [x] **Icons configured** - `icon2.png` and `adaptive-icon.png` set
- [x] **Splash screen** - `splash-screen2.png` configured
- [x] **Privacy manifest** - `PrivacyInfo.xcprivacy` configured
- [x] **Privacy policy URL** - `https://novaventuresco.github.io/dailygoals-privacy/` configured
- [x] **Minimum iOS version** - `13.4` set
- [x] **Export compliance** - `ITSAppUsesNonExemptEncryption: false` configured

**Verify assets exist:**
- [x] `assets/images/icon2.png` - App icon
- [x] `assets/images/adaptive-icon.png` - Android adaptive icon
- [x] `assets/images/splash-screen2.png` - Splash screen
- [x] `assets/images/splash-icon.png` - Splash icon

### 🟡 IMPORTANT - Before TestFlight Submission

#### 5. Build Configuration

- [x] **EAS build profiles** - `eas.json` configured with production profile
- [x] **Build scripts** - `package.json` has production build commands
- [x] **Test production build locally** - Run `npm run verify:production` first

#### 6. App Store Connect Setup ⚠️ **ACTION REQUIRED**

**Before submitting to TestFlight, prepare:**
- [ ] **App Store Connect account** - Created and verified
- [ ] **App listing created** - Bundle ID: `com.novaventuresco.dailygoals`
- [ ] **App metadata prepared** (see `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` section 4):
  - [x] App description ✅ (Prepared - see Apple Standards Compliance doc)
  - [x] Keywords ✅ (Prepared - see Apple Standards Compliance doc)
  - [x] Subtitle ✅ (Prepared - see Apple Standards Compliance doc)
  - [x] Support URL ✅ (Prepared - see Apple Standards Compliance doc)
  - [x] Privacy policy URL ✅ (Ready)
  - [ ] Screenshots (all required sizes) ⚠️ **YOU WILL PROVIDE**
  - [ ] App Preview Video (optional) ⚠️ **YOU WILL PROVIDE**
- [ ] **App Privacy questionnaire** - Complete in App Store Connect
- [ ] **Age rating** - Complete questionnaire

**Screenshot Requirements:**
- iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max) - 1290 x 2796 pixels
- iPhone 6.5" (iPhone 11 Pro Max, XS Max) - 1242 x 2688 pixels
- iPhone 5.5" (iPhone 8 Plus) - 1242 x 2208 pixels
- iPad Pro 12.9" (if supporting iPad) - 2048 x 2732 pixels

**📸 How to Generate Screenshots with One Device:**
If you only have access to one physical device, use **iOS Simulator** on Mac to generate screenshots for all required sizes. See **`docs/setup/SCREENSHOT_GENERATION_GUIDE.md`** for complete step-by-step instructions.

**Quick Method:**
1. Open iOS Simulator (Xcode → Open Developer Tool → Simulator)
2. Select device size from Device menu (e.g., "iPhone 15 Pro Max")
3. Run your app in simulator (`npm run ios`)
4. Navigate to screen you want
5. Press `Cmd + S` or Device → Screenshot
6. Screenshot is saved to Desktop with correct dimensions
7. Repeat for each device size

**📝 Note:** All App Store Connect metadata (description, keywords, subtitle, support URL, review notes, age rating guidance) is prepared and documented in `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` section 4. Copy and paste from there when setting up your App Store Connect listing.

#### 7. Testing ⚠️ **RECOMMENDED**

**Before TestFlight:**
- [ ] Test on physical iOS device (minimum iOS 13.4)
- [ ] Test all core features:
  - [ ] Authentication (sign up, sign in, sign out)
  - [ ] Goal creation/editing/deletion
  - [ ] Goal completion
  - [ ] Settings persistence
  - [ ] Onboarding flow
- [ ] Test error scenarios:
  - [ ] No internet connection
  - [ ] Invalid credentials
  - [ ] Network timeouts
- [ ] Test offline scenarios
- [ ] Test with slow network connections

**After TestFlight build:**
- [ ] Install TestFlight build on device
- [ ] Test all features in production build
- [ ] Verify no console errors appear
- [ ] Verify production database connection works
- [ ] Test with real user accounts

### 🟢 NICE TO HAVE - Before Public Release

#### 8. Monitoring & Analytics
- [ ] Error monitoring setup (e.g., Sentry)
- [ ] Analytics setup (if desired)
- [ ] Crash reporting configured

#### 9. Security Verification

- [ ] **Console Logging:** All `console.*` statements replaced with debug functions ✅
- [ ] **Debug Configuration:** `ENABLE_CONSOLE_LOGS = false` in production ✅
- [ ] **Build Verification:** `npm run verify:production` passes
- [ ] **Input Validation:** Password strength, email format, goal text validation
- [ ] **Error Messages:** Sanitized, user-friendly error messages
- [ ] **Rate Limiting:** Client-side rate limiting implemented
- [ ] **RLS Policies:** Verified in production database
- [ ] **Environment Variables:** No hardcoded secrets
- [ ] **HTTPS:** App Transport Security enforced
- [ ] **Privacy Manifest:** Configured and included in build

**Dependency Security:**
```bash
# Check for vulnerabilities
npm audit --production
# Should show: found 0 vulnerabilities
```

---

## Production Build

### Step 1: Verify Production Configuration

```bash
# Verify debug is disabled
npm run verify:production

# Verify environment variables
eas env:list --environment production
```

### Step 2: Create Production Build

**iOS (App Store):**
```bash
eas build --platform ios --profile production
```

**Android (Google Play):**
```bash
eas build --platform android --profile production
```

**Both Platforms:**
```bash
eas build --platform all --profile production
```

**What happens:**
1. Uploads your code to Expo's servers
2. Builds on their infrastructure (20-30 minutes)
3. Creates optimized build ready for store submission
4. Provides download link when complete

**Monitor progress:**
- Check the URL shown in terminal
- Or run: `eas build:list`
- Or visit: https://expo.dev/accounts/[your-account]/projects/dailygoals/builds

### Step 3: Test Production Build

Before submitting to stores, test the production build:

```bash
# Download the build from EAS dashboard
# Install on your device
# Test all features thoroughly
```

---

## App Store Submission

### iOS (App Store)

**Step 1: Submit via EAS**
```bash
eas submit --platform ios --profile production
```

**Step 2: Or Submit Manually**
1. Download `.ipa` file from EAS dashboard
2. Open App Store Connect
3. Create new app version
4. Upload `.ipa` file
5. Complete metadata and screenshots
6. Submit for review

**Required Before Submission:**
- [x] Privacy policy URL (required by Apple) ✅ - `https://novaventuresco.github.io/dailygoals-privacy/`
- [x] App Store Connect metadata prepared ✅ - See `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` section 4
- [ ] Screenshots for all required device sizes ⚠️ **YOU WILL PROVIDE**
- [x] App description and keywords ✅ - Prepared (see Apple Standards Compliance doc)
- [x] Support URL ✅ - Prepared (see Apple Standards Compliance doc)
- [ ] Marketing URL (optional)

**📝 App Store Connect Metadata Location:**
All prepared metadata (description, keywords, subtitle, support URL, review notes, age rating guidance) is documented in **`docs/compliance/APPLE_STANDARDS_COMPLIANCE.md`** starting at **section 4: "App Store Connect Metadata Requirements"**. Copy and paste from there when setting up your App Store Connect listing.

### Android (Google Play)

**Step 1: Submit via EAS**
```bash
eas submit --platform android --profile production
```

**Step 2: Or Submit Manually**
1. Download `.aab` file from EAS dashboard
2. Open Google Play Console
3. Create new app or new release
4. Upload `.aab` file
5. Complete store listing
6. Submit for review

**Required Before Submission:**
- [ ] Privacy policy URL
- [ ] Store listing details
- [ ] Screenshots and graphics
- [ ] App description
- [ ] Content rating questionnaire completed

---

## Environment Configuration

### Production Environment Variables

**Critical:** Set these separately for production environment:

```bash
# Set production Supabase URL
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod-project.supabase.co" --type string --environment production

# Set production Supabase key
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_KEY --value "your_prod_anon_key" --type string --environment production
```

**Important:** 
- Use production Supabase credentials (not development/test credentials)
- Variables set for "preview" are NOT automatically available for "production"
- Set them separately for each environment

### Verify Environment Variables

```bash
# List all environments
eas env:list

# Check production environment
eas env:list --environment production
```

**Expected output:**
```
Environment variables with visibility "Plain text" and "Sensitive" loaded from the "production" environment on EAS:
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_KEY
```

If you only see one variable, the other is missing and needs to be set.

---

## Database Setup

### Separate Production Database (Recommended)

**Why separate databases?**
- Data isolation (test data vs real user data)
- Security (different access controls)
- Performance (development work doesn't affect production)
- Compliance (clear separation for auditing)

### Setup Steps

**Step 1: Create Production Supabase Project**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create new project (this is a complete separate database)
3. Note your production URL and anon key

**Step 2: Run Schema Migration**
1. Copy `supabase/schema.sql`
2. Run in production Supabase SQL Editor
3. Verify all tables created
4. Verify RLS policies enabled

**Step 3: Verify Row Level Security**
```sql
-- Run this in production Supabase SQL editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'daily_goals';
-- Should return: rowsecurity = true
```

**Step 4: Test Production Database**
1. Create test account in production database
2. Verify RLS policies work correctly
3. Test that users cannot access other users' data
4. Test CRUD operations

**Step 5: Set Production Environment Variables**
```bash
# Use production Supabase credentials
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod-project.supabase.co" --type string --environment production
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_KEY --value "your_prod_anon_key" --type string --environment production
```

---

## Security Verification

### Pre-Production Security Checklist

- [ ] **Console Logging:** All `console.*` statements replaced with debug functions
- [ ] **Debug Configuration:** `ENABLE_CONSOLE_LOGS = false` in production
- [ ] **Build Verification:** `npm run verify:production` passes
- [ ] **Input Validation:** Password strength, email format, goal text validation
- [ ] **Error Messages:** Sanitized, user-friendly error messages
- [ ] **Rate Limiting:** Client-side rate limiting implemented
- [ ] **RLS Policies:** Verified in production database
- [ ] **Environment Variables:** No hardcoded secrets
- [ ] **HTTPS:** App Transport Security enforced
- [ ] **Privacy Manifest:** Configured and included in build

### Security Testing

**Authentication Testing:**
- [ ] Test rate limiting (5 attempts per 15 minutes)
- [ ] Test password validation
- [ ] Test email validation
- [ ] Test error handling

**Data Access Testing:**
- [ ] Create two test accounts
- [ ] Verify each can only see their own goals
- [ ] Verify one cannot modify the other's goals
- [ ] Test RLS policies work correctly

**Error Handling Testing:**
- [ ] Test error boundary
- [ ] Test network errors
- [ ] Test authentication errors
- [ ] Test database errors

### Dependency Security

```bash
# Check for vulnerabilities
npm audit --production

# Should show: found 0 vulnerabilities
```

If vulnerabilities found:
```bash
npm audit fix
```

---

## Production Readiness Checklist

### Before First Production Build

- [ ] Bundle identifier configured
- [ ] Environment variables set for production
- [ ] Production Supabase project created
- [ ] Schema migrated to production database
- [ ] RLS policies verified
- [ ] Icons and assets verified
- [ ] Privacy manifest configured
- [ ] Debug logging disabled

### Before App Store Submission

- [ ] Production build tested on physical devices
- [ ] All features verified working
- [x] Privacy policy URL created and hosted ✅ - `https://novaventuresco.github.io/dailygoals-privacy/`
- [x] App Store Connect metadata prepared ✅ - See `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` section 4
- [ ] Screenshots prepared ⚠️ **YOU WILL PROVIDE**
- [x] Support URL configured ✅ - Prepared (see Apple Standards Compliance doc)
- [ ] Security verification completed

**📝 Quick Reference:**
- **App Store Connect Metadata:** `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` section 4
- **Privacy Policy:** https://novaventuresco.github.io/dailygoals-privacy/
- **Support Email:** support@novaventuresco.com

### Post-Launch

- [ ] Monitor for errors (consider Sentry or similar)
- [ ] Monitor database performance
- [ ] Review user feedback
- [ ] Plan for updates

---

## Quick Reference

### Essential Commands

```bash
# 1. Verify production configuration (RUN THIS FIRST)
npm run verify:production

# 2. Check environment variables
eas env:list --environment production

# 3. Check for security vulnerabilities
npm audit --production

# 4. Create production build
eas build --platform ios --profile production

# 5. Monitor build progress
eas build:list

# 6. Submit to TestFlight/App Store
eas submit --platform ios --profile production
```

### Quick Pre-Build Checklist

**Run these commands before building:**
```bash
# 1. Verify production configuration
npm run verify:production

# 2. Check environment variables
eas env:list --environment production

# 3. Check for security vulnerabilities
npm audit --production
```

### Build Profiles

Your `eas.json` has these profiles configured:
- **development**: For development testing (includes dev client)
- **preview**: For internal distribution/testing
- **device**: Dev client with hot-reload on physical device
- **adhoc**: Baked standalone build for sign-off testing (no Metro needed)
- **production**: For App Store/Play Store submission

### Build Times

- **Development builds**: 15-20 minutes
- **Production builds**: 20-30 minutes
- **Monitor builds**: Check URL shown in terminal or visit expo.dev

---

## Troubleshooting

### Build Failures

**Missing Environment Variables:**
```bash
# Verify variables are set
eas env:list --environment production

# Set missing variables
eas env:create --scope project --name VARIABLE_NAME --value "value" --type string --environment production
```

**Invalid Bundle Identifier:**
- Check `app.config.js` for correct bundle identifier
- Ensure it matches your App Store Connect app

**Missing Assets:**
- Verify icons exist: `assets/images/icon.png`
- Verify splash screen: `assets/images/splash-icon.png`

### Submission Failures

**Privacy Policy Missing:**
- Create privacy policy webpage
- Host at publicly accessible URL
- Add URL to App Store Connect

**Metadata Incomplete:**
- Complete all required fields in App Store Connect
- **All text metadata is prepared** - See `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` section 4
- Add screenshots for all required device sizes (you will provide)
- Complete content rating questionnaire (guidance provided in Apple Standards Compliance doc)

---

---

## 📚 Reference Documents

- **Apple Standards Compliance:** `docs/compliance/APPLE_STANDARDS_COMPLIANCE.md` - Contains all App Store Connect metadata (section 4)
- **Screenshot Generation Guide:** `docs/setup/SCREENSHOT_GENERATION_GUIDE.md` - How to generate all required screenshots using iOS Simulator
- **Security Audit:** `docs/compliance/SECURITY_AUDIT_REPORT.md`
- **EAS Environment Variables:** `docs/setup/EAS_ENVIRONMENT_VARIABLES_GUIDE.md`
- **Development Playbook:** `docs/DEVELOPMENT_PLAYBOOK.md`

---

**Last Updated:** December 2024

