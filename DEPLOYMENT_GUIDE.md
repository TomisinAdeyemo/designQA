# ConstructQA - Deployment & Launch Guide

## Current Status
Your application is already running on the development server. The system is production-ready and fully functional.

---

## 🚀 LAUNCH STEPS (For Production)

### Step 1: Choose Your Hosting Platform

**Recommended Options:**

#### Option A: Vercel (Easiest - Recommended)
- **Pros**: Free tier, automatic deployments, excellent performance, zero config
- **Pricing**: Free for personal projects, $20/month for team features
- **Deploy time**: 2 minutes

#### Option B: Netlify
- **Pros**: Free tier, great for static sites, good CI/CD
- **Pricing**: Free for personal, $19/month pro
- **Deploy time**: 2 minutes

#### Option C: AWS Amplify
- **Pros**: AWS ecosystem integration, scalable
- **Pricing**: Pay as you go
- **Deploy time**: 5 minutes

---

## 📦 DEPLOYMENT STEPS (Using Vercel - Recommended)

### Prerequisites
1. GitHub account (to store your code)
2. Vercel account (free at vercel.com)
3. Your Supabase credentials (already configured in `.env`)

### Step-by-Step Deployment

#### 1. Push Code to GitHub (If not already done)

```bash
# Initialize git repository (if not done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - ConstructQA production ready"

# Create GitHub repository at github.com/new
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/constructqa.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite + React app
5. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable from your `.env` file:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
6. Click "Deploy"
7. Wait 2-3 minutes - you'll get a live URL like `https://constructqa.vercel.app`

**Option B: Via Vercel CLI (Advanced)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts to:
# - Link to existing project or create new
# - Add environment variables when prompted
```

#### 3. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `constructqa.com`)
3. Update DNS records as shown by Vercel
4. SSL certificate is automatic and free

---

## 🧪 BETA TESTING SETUP

### Prepare for Beta Launch

#### 1. Create Test User Accounts

```sql
-- Run this in Supabase SQL Editor to create test users
-- Or just have users sign up normally at your deployed URL
```

Have testers:
1. Go to your deployed URL (e.g., `https://constructqa.vercel.app`)
2. Click "Sign Up"
3. Create their accounts
4. Start testing!

#### 2. Share Beta Testing Link

**Share this with your beta testers:**

```
🚀 ConstructQA Beta Access

URL: https://your-app-url.vercel.app

Instructions:
1. Sign up with your email
2. Create a project
3. Upload a test file (IFC, DWG, PDF, etc.)
4. Run a scan
5. View findings and download reports

Feedback: Please report any issues or suggestions to [your email]

Key Features to Test:
✓ File upload (multiple formats)
✓ Scan execution
✓ Findings review
✓ PDF report downloads (Original File + Detailed Report)
✓ CSV export
✓ RFI creation
```

#### 3. Monitor Usage

Track beta testing in Supabase Dashboard:

```sql
-- Check user signups
SELECT COUNT(*) as total_users,
       DATE(created_at) as signup_date
FROM auth.users
GROUP BY signup_date
ORDER BY signup_date DESC;

-- Check scan activity
SELECT COUNT(*) as total_scans,
       user_id,
       DATE(timestamp) as scan_date
FROM backend_scans
GROUP BY user_id, scan_date
ORDER BY scan_date DESC;

-- Check findings generated
SELECT file_name,
       findings_count,
       timestamp
FROM backend_scans
ORDER BY timestamp DESC
LIMIT 20;
```

---

## 🔄 MAKING UPDATES AFTER LAUNCH

### Workflow for Updates

#### Option 1: Auto-Deploy (Recommended - Set up once)

**How it works:**
- You make changes locally
- Push to GitHub
- Vercel automatically rebuilds and deploys
- Live in 2-3 minutes

**Setup:**
1. In Vercel Dashboard → Your Project → Settings → Git
2. Ensure "Production Branch" is set to `main`
3. Enable "Automatic Deployments"

**Making Updates:**
```bash
# 1. Make your changes in code
# 2. Test locally
npm run dev

# 3. Build to verify
npm run build

# 4. Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# 5. Vercel auto-deploys (watch in dashboard)
# 6. Live in 2-3 minutes!
```

#### Option 2: Manual Deploy

```bash
# After making changes
vercel --prod
```

### Update Checklist

**Before Every Update:**
- [ ] Test changes locally (`npm run dev`)
- [ ] Build successfully (`npm run build`)
- [ ] No console errors
- [ ] Test critical flows (upload, scan, download)

**After Deploy:**
- [ ] Verify live site loads
- [ ] Test updated features
- [ ] Check no existing features broke
- [ ] Monitor Supabase logs for errors

---

## 🔧 COMMON UPDATE SCENARIOS

### Scenario 1: UI/Text Changes
```bash
# Make changes to React components
# Example: Update text, styling, layouts
git add src/
git commit -m "Update UI improvements"
git push origin main
# Auto-deploys in 2-3 minutes
```

### Scenario 2: Add New Features
```bash
# Create new components/pages
# Update routing
# Test locally
npm run dev

# Build and deploy
git add .
git commit -m "Add new feature: [description]"
git push origin main
```

### Scenario 3: Database Changes
```bash
# 1. Create new migration in Supabase SQL Editor
# 2. Test migration
# 3. Document changes
# 4. Update TypeScript types if needed
# 5. Update frontend code
# 6. Deploy as usual
```

### Scenario 4: Environment Variable Changes
```bash
# In Vercel Dashboard:
# Settings → Environment Variables → Edit
# Add/Update variables
# Redeploy: Deployments → Latest → ... → Redeploy
```

---

## 📊 MONITORING & MAINTENANCE

### Daily Checks (Quick)
1. Open your live URL - verify it loads
2. Supabase Dashboard → Check for errors
3. Vercel Dashboard → Check deployment status

### Weekly Checks
1. Review user feedback
2. Check Supabase usage/limits
3. Review error logs
4. Test critical user flows

### Monthly Checks
1. Update dependencies: `npm update`
2. Review and optimize database queries
3. Check Supabase/Vercel billing
4. Backup database (Supabase auto-backups)

---

## 🐛 ROLLBACK IF SOMETHING BREAKS

### Quick Rollback on Vercel
1. Go to Vercel Dashboard → Your Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Previous version is live immediately!

### Fix and Redeploy
```bash
# Revert changes
git revert HEAD

# Push
git push origin main

# Or fix the bug and push
```

---

## 📈 SCALING CONSIDERATIONS

### When You Get More Users

**Supabase Free Tier Limits:**
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users

**When to Upgrade:**
- Database > 400 MB → Upgrade to Pro ($25/month)
- Storage > 800 MB → Add more storage ($0.021/GB)
- Need better performance → Enable connection pooling

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deploys

**When to Upgrade:**
- High traffic → Vercel Pro ($20/month)
- Need team features → Team plan

---

## 🎯 QUICK LAUNCH CHECKLIST

**Today (Pre-Launch):**
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Verify live site works
- [ ] Test signup flow
- [ ] Test file upload
- [ ] Test scan execution
- [ ] Test PDF downloads
- [ ] Prepare beta tester list

**Launch Day:**
- [ ] Send beta invite to testers
- [ ] Monitor for errors (Supabase + Vercel dashboards)
- [ ] Be available for questions
- [ ] Document any issues reported

**Post-Launch (First Week):**
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Plan improvements
- [ ] Update documentation

---

## 🔗 IMPORTANT LINKS

**Your Production App:**
- Live URL: `https://[your-app].vercel.app` (after deployment)

**Admin Dashboards:**
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard
- GitHub: https://github.com/[username]/[repo]

**Documentation:**
- This guide: `DEPLOYMENT_GUIDE.md`
- System architecture: `CONSTRUCTQA_SCAFFOLD.md`
- Visual reports spec: `BACKEND_VISUAL_REPORT_SPEC.md`

---

## 💡 PRO TIPS

1. **Always test locally before pushing**
   ```bash
   npm run dev
   npm run build
   ```

2. **Use descriptive commit messages**
   ```bash
   git commit -m "Fix: PDF download for files without extension"
   # Not: "bug fix"
   ```

3. **Deploy during low-traffic times** (for major updates)

4. **Keep a changelog** of what you update

5. **Backup before major changes** (Supabase auto-backups, but you can export manually)

6. **Monitor after every deploy** (first 30 minutes)

---

## 🆘 NEED HELP?

**Common Issues:**

**Issue**: Environment variables not working after deploy
**Fix**: Add them in Vercel Dashboard → Settings → Environment Variables → Redeploy

**Issue**: "Build failed" on Vercel
**Fix**: Check build logs. Usually missing dependencies. Run `npm install` locally.

**Issue**: Database connection error
**Fix**: Verify Supabase URL and keys in Vercel environment variables

**Issue**: Changes not showing after push
**Fix**: Check Vercel deployment logs. May need to clear cache or hard redeploy.

---

## ✅ YOU'RE READY TO LAUNCH!

Your app is production-ready. Follow these steps:
1. Deploy to Vercel (10 minutes)
2. Test the live site (10 minutes)
3. Invite beta testers (send them the link)
4. Make updates by pushing to GitHub (auto-deploys)

**Remember**: Updates are easy - just edit code, commit, and push. Vercel handles the rest!
