# Deployment Checklist

## Pre-Deployment Tasks

### 1. Database Migrations ⚠️ CRITICAL

Run these SQL migrations **in order** on your Supabase database:

```bash
# Option 1: Via psql
psql -d your_database -f db/migrations/0008_add_allowed_cookies.sql
psql -d your_database -f db/migrations/0009_create_support_type_enum.sql
psql -d your_database -f db/migrations/0010_create_plans_table.sql
psql -d your_database -f db/migrations/0011_populate_plans_table.sql
```

**OR**

```bash
# Option 2: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy and paste each migration file content
3. Click "Run" for each file in order
```

### 2. Verify Database Changes

Run these queries to verify migrations:

```sql
-- Check if allowed_cookies column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'allowed_cookies';

-- Check if support_type_enum exists
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'support_type_enum'::regtype;

-- Check if plans table exists with 5 records
SELECT id, model, questions_month, docs_size FROM plans;

-- Check if plan_models table is dropped
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'plan_models'
) AS plan_models_still_exists;  -- Should return FALSE
```

Expected results:

-   ✅ allowed_cookies column exists with jsonb type
-   ✅ support_type_enum has 3 values: email, whatsapp, vip
-   ✅ plans table has 5 records (starter, basic, essentials, plus, advanced)
-   ✅ plan_models table does NOT exist (FALSE)

### 3. Code Review

Check these files for any errors:

```bash
# Run TypeScript check
npm run type-check
# or
pnpm tsc --noEmit

# Run linter
npm run lint
# or
pnpm eslint .

# Check for build errors
npm run build
# or
pnpm build
```

### 4. Environment Variables

Verify these are set in Vercel:

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Required for Genkit (if using AI generation)
GOOGLE_AI_API_KEY=your-google-ai-key

# Optional (for analytics)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 5. Test Locally

Run these tests before deploying:

```bash
# Start dev server
npm run dev

# Test these features:
1. Visit http://localhost:3000
2. Verify cookie banner appears
3. Test "Accept All" - verify banner closes
4. Clear localStorage and reload - verify banner appears again
5. Test annual/monthly pricing toggle
6. Click on a plan - verify redirects to /auth
7. Test file upload validation (if integrated)
```

---

## Deployment Steps

### Step 1: Commit and Push Changes

```bash
git status
git add .
git commit -m "feat: Add annual billing, cookie consent, plans table, and upload validation"
git push origin main
```

### Step 2: Deploy to Vercel

Vercel will auto-deploy from your main branch. Monitor the deployment:

1. Go to: https://vercel.com/your-username/prova-facil/deployments
2. Wait for build to complete
3. Check build logs for errors

### Step 3: Post-Deployment Verification

Visit your production URL and test:

#### Cookie Banner

-   [ ] Banner appears on first visit
-   [ ] "Accept All" works and saves to database
-   [ ] "Personalize" shows cookie toggles
-   [ ] Banner doesn't reappear after accepting
-   [ ] Links to /privacy and /cookies work

#### Annual Billing

-   [ ] Toggle between monthly/annual on landing page (/)
-   [ ] Prices update correctly
-   [ ] "-17%" badge shows on annual button
-   [ ] "2 meses grátis" message appears
-   [ ] Toggle on /plan page works identically

#### Plans Table

-   [ ] All 5 plans display correctly
-   [ ] Plan cards show correct AI level badges
-   [ ] CTA buttons work
-   [ ] Redirects to /auth work

#### Upload Validator (if integrated)

-   [ ] File upload respects plan limits
-   [ ] Error messages are clear
-   [ ] Text input available for all plans
-   [ ] Link input only for Essentials/Plus/Advanced

---

## Rollback Plan

If deployment fails, rollback procedure:

### Quick Rollback (Vercel)

1. Go to Vercel Dashboard > Deployments
2. Find last working deployment
3. Click "⋯" menu > "Promote to Production"

### Database Rollback (if needed)

⚠️ **CAUTION**: Only run these if you need to rollback database changes

```sql
-- Rollback 0011_populate_plans_table.sql
TRUNCATE TABLE plans;

-- Rollback 0010_create_plans_table.sql
DROP TABLE IF EXISTS plans CASCADE;
-- Restore plan_models if needed (check backups)

-- Rollback 0009_create_support_type_enum.sql
DROP TYPE IF EXISTS support_type_enum CASCADE;

-- Rollback 0008_add_allowed_cookies.sql
ALTER TABLE profiles DROP COLUMN IF EXISTS allowed_cookies;
```

---

## Monitoring

### After Deployment, Monitor:

1. **Vercel Logs**: Check for runtime errors

    - https://vercel.com/your-username/prova-facil/logs

2. **Supabase Logs**: Check for database errors

    - https://supabase.com/dashboard/project/YOUR_PROJECT/logs

3. **Browser Console**: Test in production and check for JS errors

4. **Database Queries**: Monitor slow queries in Supabase

5. **User Reports**: Set up error tracking (Sentry, LogRocket, etc.)

### Key Metrics to Watch:

-   [ ] Cookie banner acceptance rate
-   [ ] Annual vs monthly plan selection ratio
-   [ ] Upload error rate (file type/size rejections)
-   [ ] API error rate (4xx/5xx responses)
-   [ ] Page load times

---

## Known Issues & Solutions

### Issue: Cookie banner appears on every page load

**Solution**:

-   Check if Supabase connection is working
-   Verify RLS policies allow reading from profiles table
-   Check browser console for errors

### Issue: Annual prices not displaying

**Solution**:

-   Verify billingPeriod state is set correctly
-   Check if monthlyPrice and annualPrice are numbers (not strings)
-   Ensure formatPrice() function is working

### Issue: Plans table empty after migration

**Solution**:

-   Run migration 0011 again: `psql -d db -f db/migrations/0011_populate_plans_table.sql`
-   Verify question_type enum has all required values
-   Check support_type_enum exists

### Issue: File upload validation not working

**Solution**:

-   Verify user's plan is set in profiles table
-   Check if plans table has correct doc_type arrays
-   Console.log the validation result to debug

---

## Post-Deployment Tasks

### Immediate (0-24 hours)

-   [ ] Test all critical features in production
-   [ ] Monitor error logs for first hour
-   [ ] Test on mobile devices (iOS/Android)
-   [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
-   [ ] Send test registration and verify cookie consent flow

### Short-term (1-7 days)

-   [ ] Gather user feedback on new features
-   [ ] Monitor annual vs monthly conversion rates
-   [ ] Check cookie consent acceptance rates
-   [ ] Review Supabase database performance
-   [ ] Optimize any slow queries

### Medium-term (1-4 weeks)

-   [ ] Implement Task 7 (Academic Level Filtering) - see ACADEMIC_LEVEL_FILTERING_GUIDE.md
-   [ ] Add profile settings page for cookie preferences
-   [ ] Integrate payment gateway for annual/monthly billing
-   [ ] Add usage dashboard showing plan limits
-   [ ] Create admin panel for plan management

---

## Support & Documentation

### For Users:

-   Cookie Policy: https://yoursite.com/cookies
-   Privacy Policy: https://yoursite.com/privacy
-   Terms of Service: https://yoursite.com/terms
-   Support: https://yoursite.com/support

### For Developers:

-   Implementation Summary: `/IMPLEMENTATION_SUMMARY.md`
-   Cookie System Docs: `/COOKIE_SYSTEM.md`
-   Academic Level Guide: `/ACADEMIC_LEVEL_FILTERING_GUIDE.md`
-   Upload Validator: `/lib/validators/upload.ts`

---

## Success Criteria

Deployment is successful when:

✅ All database migrations applied without errors  
✅ Cookie banner appears and functions correctly  
✅ Annual/monthly billing toggle works on both pages  
✅ All 5 plans display with correct information  
✅ File upload validation prevents invalid uploads  
✅ No console errors in production  
✅ No 500 errors in API routes  
✅ Page load time < 3 seconds  
✅ Mobile responsive on all pages  
✅ All links work correctly

---

## Emergency Contacts

If critical issues arise:

1. **Vercel Support**: https://vercel.com/support
2. **Supabase Support**: https://supabase.com/support
3. **Project Repository**: https://github.com/your-username/prova-facil/issues

---

## Changelog

Document what was deployed:

```markdown
## [1.1.0] - 2024-XX-XX

### Added

-   Annual billing option with 17% discount (2 months free)
-   Cookie consent banner with granular preferences
-   Comprehensive plans table with all plan configurations
-   File upload validation based on subscription plan
-   Support type enum (email, whatsapp, vip)

### Changed

-   Pricing component now uses monthlyPrice/annualPrice instead of single price
-   Plan page synced with landing page pricing
-   Removed plan_models table in favor of comprehensive plans table

### Database

-   Migration 0008: Added allowed_cookies column to profiles
-   Migration 0009: Created support_type_enum
-   Migration 0010: Created plans table, dropped plan_models
-   Migration 0011: Populated plans table with 5 plans

### Documentation

-   Added IMPLEMENTATION_SUMMARY.md
-   Added COOKIE_SYSTEM.md
-   Added ACADEMIC_LEVEL_FILTERING_GUIDE.md
-   Added DEPLOYMENT_CHECKLIST.md (this file)
```

---

## Final Pre-Flight Check

Before clicking "Deploy":

-   [ ] All TypeScript errors resolved
-   [ ] All ESLint warnings addressed
-   [ ] Database migrations tested locally
-   [ ] Cookie banner tested end-to-end
-   [ ] Annual billing toggle tested
-   [ ] All components render without errors
-   [ ] No hardcoded credentials in code
-   [ ] Environment variables set in Vercel
-   [ ] Git committed and pushed
-   [ ] Team notified of deployment
-   [ ] Rollback plan ready

---

## 🚀 Ready to Deploy!

If all checks pass, you're ready to deploy. Good luck!

Remember: Deploy during low-traffic hours if possible, and monitor closely for the first 30 minutes after deployment.
