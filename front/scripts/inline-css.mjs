// Post-build: inline the entry CSS into index.html as a <style> tag.
// Why: some static hosts/CDNs serve .css with an empty Content-Type, and
// browsers with strict MIME checking refuse to apply them via <link>.
// Inlining removes that separate request entirely.
//
// Font files referenced inside the CSS use paths relative to the CSS file
// (which lives in /assets). Since the CSS now lives in index.html (one level
// up), we rewrite `url(./x)` -> `url(./assets/x)` so fonts still resolve.

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const htmlPath = join(distDir, 'index.html');

if (!existsSync(htmlPath)) {
  console.error('[inline-css] dist/index.html not found — run vite build first.');
  process.exit(1);
}

let html = readFileSync(htmlPath, 'utf8');

// Match: <link rel="stylesheet" ... href="./assets/xxx.css">
const linkRe = /<link[^>]*rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+\.css)"[^>]*>/i;
const match = html.match(linkRe);

if (!match) {
  console.log('[inline-css] no stylesheet <link> found — nothing to inline.');
  process.exit(0);
}

const cssHref = match[1];                       // ./assets/index-XXX.css
const cssPath = join(distDir, cssHref.replace('./', ''));

if (!existsSync(cssPath)) {
  console.error(`[inline-css] CSS file not found: ${cssPath}`);
  process.exit(1);
}

let css = readFileSync(cssPath, 'utf8');

// Rebase relative asset URLs (fonts/images) from CSS-folder-relative to
// html-folder-relative: url(./x) -> url(./assets/x)
css = css.replace(/url\(\.\//g, 'url(./assets/');

// Replace the <link> with an inline <style>
html = html.replace(match[0], `<style>${css}</style>`);

writeFileSync(htmlPath, html, 'utf8');

// Remove the now-inlined CSS file to keep dist clean
rmSync(cssPath, { force: true });

console.log(`[inline-css] inlined ${cssHref} into index.html (${(css.length / 1024).toFixed(1)} kB) and removed the file.`);
