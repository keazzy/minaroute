#!/usr/bin/env node
/**
 * Post-build script to add PWA meta tags and copy assets to dist folder
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');

// Copy PWA assets from public to dist
const filesToCopy = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png'];

for (const file of filesToCopy) {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  }
}

// Add PWA meta tags to index.html
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  const pwaTags = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0850FD" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="MinaRoute" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="description" content="Find mosques, halal food, and Islamic schools near you" />
  `;
  
  // Insert before </head>
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${pwaTags}</head>`);
    fs.writeFileSync(indexPath, html);
    console.log('✓ Added PWA meta tags to index.html');
  } else {
    console.log('✓ PWA meta tags already present');
  }
}

console.log('\n✅ Post-build complete!');
