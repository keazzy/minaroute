# MinaRoute PWA Deployment Guide

This guide covers deploying MinaRoute as a Progressive Web App (PWA) to Vercel.

## What's a PWA?

A Progressive Web App works like a native app but runs in the browser:
- **Installable** - Users can add it to their home screen
- **Offline capable** - Basic caching for faster loads
- **No app store needed** - Share a link, users can install directly

## Free Map Solution

MinaRoute uses **Leaflet + OpenStreetMap** for web:
- ✅ 100% free, no API keys needed
- ✅ No watermarks
- ✅ Beautiful, customizable tiles
- ✅ Already configured in `components/map.web.tsx`

## Deploy to Vercel

### Option 1: One-Click Deploy (Easiest)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repo
5. Vercel auto-detects settings from `vercel.json`
6. Click "Deploy"

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login (first time only)
vercel login

# Deploy (from project root)
vercel

# For production deployment
vercel --prod
```

### Option 3: Manual Build + Upload

```bash
# Build the web app
npm run build:web

# Preview locally first
npm run preview:web

# Then upload the 'dist' folder to any static host
```

## After Deployment

Your app will be available at:
- `https://your-project-name.vercel.app`

### Custom Domain (Later)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `minaroute.com`)
3. Update DNS records as instructed

## PWA Installation

Users can install the app:

**On Mobile (iOS Safari / Android Chrome):**
1. Visit your Vercel URL
2. Tap "Share" → "Add to Home Screen"

**On Desktop (Chrome/Edge):**
1. Visit your Vercel URL
2. Click the install icon in the address bar (or menu → "Install MinaRoute")

## Files Created for PWA

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA metadata (name, icons, theme) |
| `public/sw.js` | Service worker for caching |
| `public/icon-192.png` | App icon (small) |
| `public/icon-512.png` | App icon (large) |
| `vercel.json` | Vercel deployment config |

## Testing PWA Locally

```bash
# Build
npm run build:web

# Serve locally (PWA features only work over HTTPS or localhost)
npm run preview:web

# Open http://localhost:3000
```

## Troubleshooting

### "Install" option not showing
- PWA install requires HTTPS (works on Vercel, not local HTTP)
- Check browser DevTools → Application → Manifest for errors

### Map not loading
- Leaflet CSS might not be loading - check network tab
- The map.web.tsx handles this automatically

### Service worker issues
- Clear browser cache and reload
- Check DevTools → Application → Service Workers

## Environment Variables on Vercel

If you need env vars (you don't for basic app):

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables (they're encrypted and secure)

**Note:** The Supabase anon key is safe to be in client code - it's designed for that.

## Cost

- **Vercel**: Free tier includes 100GB bandwidth/month
- **OpenStreetMap**: Free, no limits
- **Supabase**: Free tier includes 500MB database, 2GB bandwidth

**Total cost: $0** for MVP usage.

## Quick Commands Reference

```bash
# Local development
npm run web

# Build for production
npm run build:web

# Preview production build
npm run preview:web

# Deploy to Vercel
vercel --prod
```

## Next Steps After MVP

1. Get user feedback
2. Buy a domain (~$10-15/year)
3. Connect domain to Vercel
4. Consider native app builds later with `expo build`
