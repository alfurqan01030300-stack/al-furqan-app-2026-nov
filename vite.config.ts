import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

const rootDir = import.meta.dirname;

function readAppDisplayVersion(): string {
  try {
    const pkgPath = path.resolve(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg && typeof pkg.version === 'string' && pkg.version.trim()) {
      return pkg.version.trim();
    }
  } catch {
    // fallback
  }
  return process.env.npm_package_version || '3.0';
}

function collectBuildAssets(distDir: string): string[] {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return [];
  const urls: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(js|css|png|jpg|jpeg|svg|woff2?)$/i.test(entry.name)) {
        const rel = '/' + path.relative(distDir, fullPath).replace(/\\/g, '/');
        urls.push(rel);
      }
    }
  };
  walk(assetsDir);
  return urls;
}

function furqanPwaAndVersionPlugin(
  appVersion: string,
  buildId: string,
  isBuild: boolean
): Plugin {
  const versionPayload = () =>
    JSON.stringify(
      {
        version: appVersion,
        buildId,
        builtAt: new Date().toISOString(),
      },
      null,
      2
    );

  return {
    name: 'furqan-pwa-and-version',
    buildStart() {
      if (!isBuild) return;
      try {
        const pubDir = path.resolve(rootDir, 'public');
        if (fs.existsSync(pubDir)) {
          fs.writeFileSync(path.join(pubDir, 'version.json'), versionPayload());
        }
      } catch (err) {
        console.warn('Could not write public/version.json:', err);
      }
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.end(versionPayload());
      });

      server.middlewares.use('/manifest.json', (_req, res, next) => {
        const manifestPath = path.resolve(rootDir, 'public/manifest.json');
        if (fs.existsSync(manifestPath)) {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(fs.readFileSync(manifestPath, 'utf-8'));
          return;
        }
        next();
      });

      server.middlewares.use('/sw.js', (_req, res, next) => {
        const swPath = path.resolve(rootDir, 'public/sw.js');
        if (fs.existsSync(swPath)) {
          const devSwContent = fs
            .readFileSync(swPath, 'utf-8')
            .replace(/__SW_VERSION__/g, `dev-${buildId}`)
            .replace(/__EXTRA_BUILD_ASSETS__/g, '[]');
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Service-Worker-Allowed', '/');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.end(devSwContent);
          return;
        }
        next();
      });
    },
    writeBundle() {
      try {
        const distDir = path.resolve(rootDir, 'dist');
        fs.writeFileSync(path.join(distDir, 'version.json'), versionPayload());
        const swPath = path.join(distDir, 'sw.js');
        if (fs.existsSync(swPath)) {
          const assetUrls = collectBuildAssets(distDir);
          const swContent = fs
            .readFileSync(swPath, 'utf-8')
            .replace(/__SW_VERSION__/g, buildId)
            .replace(/__EXTRA_BUILD_ASSETS__/g, JSON.stringify(assetUrls));
          fs.writeFileSync(swPath, swContent);
        }
      } catch (err) {
        console.warn('Could not stamp dist/version.json or dist/sw.js:', err);
      }
    },
  };
}

export default defineConfig(({ command }) => {
  const appVersion = readAppDisplayVersion();
  const buildId = `${appVersion}-${Date.now()}`;

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      furqanPwaAndVersionPlugin(appVersion, buildId, command === 'build'),
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
