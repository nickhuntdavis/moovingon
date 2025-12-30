# Netlify Deployment Guide

Your app is now on GitHub and ready to deploy to Netlify!

## Quick Deploy Steps

### 1. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your repository: `nickhuntdavis/moovingon`
5. Click "Deploy site"

### 2. Configure Build Settings

Netlify should auto-detect these from `netlify.toml`, but verify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18 (or latest LTS)

### 3. Add Environment Variables

**Critical:** Add these in Netlify Dashboard → Site Settings → Environment Variables:

1. `VITE_BASEROW_TOKEN` = `laIQcMIWcsVRPguGkFaP2kG6nCsGRIob`
2. `VITE_BASEROW_TABLE_ID` = `786250`

**How to add:**
- Go to your site in Netlify
- Site Settings → Environment Variables
- Click "Add variable"
- Add each variable above
- Click "Save"

### 4. Deploy!

After adding environment variables:
- Go to "Deploys" tab
- Click "Trigger deploy" → "Clear cache and deploy site"

Or just push a new commit to trigger automatic deployment!

## Post-Deployment Checklist

- [ ] Site is live and accessible
- [ ] Environment variables are set
- [ ] Test adding an item (should save to Baserow)
- [ ] Test editing an item
- [ ] Test expressing interest (should update Baserow)
- [ ] Images upload correctly
- [ ] Admin login works

## Custom Domain (Optional)

1. Go to Site Settings → Domain management
2. Add your custom domain
3. Follow Netlify's DNS instructions

## Troubleshooting

### Build fails?
- Check that environment variables are set correctly
- Check Netlify build logs for errors
- Verify `netlify.toml` is in the repo

### App works but can't connect to Baserow?
- Verify `VITE_BASEROW_TOKEN` is set in Netlify
- Check browser console for API errors
- Verify token has access to the workspace

### Images not uploading?
- Check browser console for file upload errors
- Verify Baserow file upload API is accessible
- Check CORS settings if needed

## Your Site URL

After deployment, Netlify will give you a URL like:
`https://random-name-123.netlify.app`

You can customize this in Site Settings → Domain management.

## Continuous Deployment

Every push to `main` branch will automatically:
1. Trigger a new build
2. Deploy to production
3. Update your live site

No manual steps needed! 🚀

