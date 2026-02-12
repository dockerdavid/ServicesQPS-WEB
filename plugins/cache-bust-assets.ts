import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Tras el build, añade ?v=BUILD_TIMESTAMP a script/link en index.html
 * para que Cloudflare/CDN no sirva assets cacheados tras un deploy.
 */
export function cacheBustAssets(): Plugin {
  return {
    name: 'cache-bust-assets',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist');
      const indexPath = resolve(outDir, 'index.html');
      try {
        let html = readFileSync(indexPath, 'utf-8');
        const v = Date.now();
        html = html.replace(
          /(src|href)=(["'])(\/assets\/[^"']+)\2/g,
          (_, attr, quote, path) => `${attr}=${quote}${path}?v=${v}${quote}`,
        );
        writeFileSync(indexPath, html);
      } catch (e) {
        console.warn('[cache-bust-assets] No se pudo modificar index.html:', e);
      }
    },
  };
}
