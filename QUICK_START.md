# ConstructQA - Quick Start Commands

## 🚀 LAUNCH TODAY (15 Minutes)

### Step 1: Deploy to Vercel (5 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**OR use the dashboard** (easier):
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import from GitHub
3. Add environment variables from `.env`
4. Click Deploy
5. Done! You get a live URL

---

### Step 2: Test Your Live Site (5 min)

Visit your Vercel URL and test:
- [ ] Sign up works
- [ ] Create project works
- [ ] Upload file works
- [ ] Run scan works
- [ ] Download reports work

---

### Step 3: Invite Beta Testers (5 min)

Send them:
```
🚀 Test ConstructQA Beta

URL: https://your-app.vercel.app

1. Sign up with your email
2. Create a test project
3. Upload a sample file (IFC, DWG, PDF, etc.)
4. Run a scan
5. Download the reports

Let me know what you think!
```

---

## 🔄 MAKING UPDATES (Super Simple)

### Every Time You Want to Update:

```bash
# 1. Make your changes in the code

# 2. Test locally
npm run dev

# 3. Verify build works
npm run build

# 4. Commit and push (auto-deploys!)
git add .
git commit -m "Your update description"
git push origin main

# 5. Check Vercel dashboard - live in 2-3 min!
```

That's it! Vercel automatically rebuilds and deploys when you push to GitHub.

---

## 📝 COMMON COMMANDS

### Local Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint
```

### Git Workflow
```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to trigger auto-deploy
git push origin main

# View history
git log --oneline
```

### Vercel Commands
```bash
# Deploy to production
vercel --prod

# Deploy to preview (test before production)
vercel

# Check deployments
vercel ls

# View logs
vercel logs
```

---

## 🛠️ YOUR ENVIRONMENT VARIABLES

Copy these to Vercel Dashboard → Settings → Environment Variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find these in your `.env` file or Supabase Dashboard → Project Settings → API

---

## 📊 MONITORING YOUR APP

### Check User Activity
Go to Supabase Dashboard → SQL Editor:

```sql
-- Total users
SELECT COUNT(*) FROM auth.users;

-- Recent scans
SELECT * FROM backend_scans
ORDER BY timestamp DESC
LIMIT 10;

-- Total findings
SELECT SUM(findings_count) FROM backend_scans;
```

### Check Deployment Status
- Vercel Dashboard: https://vercel.com/dashboard
- Recent deployments and their status
- Click any deployment to see logs

---

## 🐛 TROUBLESHOOTING

### "Build failed" on Vercel
```bash
# Test build locally first
npm run build

# If it works locally, check Vercel build logs
# Usually need to clear Vercel cache and redeploy
```

### Changes not showing after deploy
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or check if deployment succeeded in Vercel dashboard
```

### Environment variables not working
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Make sure all variables are added
4. Redeploy (Deployments → Latest → ... → Redeploy)

### Users can't sign up
1. Check Supabase Dashboard → Authentication → Settings
2. Verify email settings are configured
3. Check RLS policies are enabled

---

## 🎯 DAILY WORKFLOW

### Morning
```bash
# Pull latest changes (if working with others)
git pull origin main

# Start dev server
npm run dev
```

### Making Changes
```bash
# Make your edits
# Save files (auto-refreshes in browser)
# Test functionality
```

### Pushing Updates
```bash
# Build to verify
npm run build

# Commit and push
git add .
git commit -m "What you changed"
git push origin main

# Vercel auto-deploys!
```

---

## 🔗 QUICK LINKS

**Development:**
- Local Dev: http://localhost:5173
- Supabase: https://supabase.com/dashboard

**Production:**
- Live Site: https://[your-app].vercel.app
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repo: https://github.com/[username]/constructqa

**Docs:**
- Full Deployment Guide: `DEPLOYMENT_GUIDE.md`
- System Architecture: `CONSTRUCTQA_SCAFFOLD.md`
- This Quick Start: `QUICK_START.md`

---

## ⚡ POWER USER TIPS

1. **Auto-deploy is magic** - Just push to GitHub, Vercel does the rest
2. **Test locally first** - Always run `npm run dev` and `npm run build`
3. **Monitor first 30 min after deploy** - Catch issues early
4. **Use preview deployments** - Run `vercel` (without --prod) to test before going live
5. **Keep environment variables in Vercel** - Never commit `.env` to GitHub

---

## ✅ PRE-FLIGHT CHECKLIST

Before sharing with testers:
- [ ] App deployed to Vercel
- [ ] Live URL works and loads
- [ ] Can sign up new account
- [ ] Can create project
- [ ] Can upload file
- [ ] Can run scan
- [ ] Can download both reports (Original File + Detailed PDF)
- [ ] Supabase authentication working
- [ ] No console errors

---

## 🎉 YOU'RE READY!

Your workflow from now on:
1. Edit code locally
2. Run `npm run build` to verify
3. Commit: `git commit -m "what you changed"`
4. Push: `git push origin main`
5. Wait 2-3 minutes
6. Live!

That's it! No complicated CI/CD setup. Vercel handles everything.
