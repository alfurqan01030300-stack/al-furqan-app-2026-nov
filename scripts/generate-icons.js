import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp Islamic emblem with emerald green (#0B3D2E) and gold (#D4AF37)
const createSvg = (size = 512, isMaskable = false) => {
  const padding = isMaskable ? size * 0.15 : size * 0.06;
  const center = size / 2;
  const outerR = center - padding;
  const innerR = outerR - size * 0.035;
  const dotR = size * 0.04;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#145A43" />
      <stop offset="60%" stop-color="#0B3D2E" />
      <stop offset="100%" stop-color="#06241B" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF2A8" />
      <stop offset="30%" stop-color="#D4AF37" />
      <stop offset="70%" stop-color="#AA820A" />
      <stop offset="100%" stop-color="#E5C158" />
    </linearGradient>
    <linearGradient id="goldRing" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#FFF5BE" />
      <stop offset="100%" stop-color="#AA820A" />
    </linearGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)" />

  <!-- Outer Decorative Ring -->
  <circle cx="${center}" cy="${center}" r="${outerR}" fill="none" stroke="url(#goldRing)" stroke-width="${size * 0.016}" />

  <!-- Inner Decorative Ring with Dash Islamic motif -->
  <circle cx="${center}" cy="${center}" r="${innerR}" fill="none" stroke="url(#goldGrad)" stroke-width="${size * 0.008}" stroke-dasharray="${size * 0.02} ${size * 0.015}" />

  <!-- Central Emblem: The Arabic Letter "ف" (Al-Furqan) in Gold -->
  <g filter="url(#goldGlow)" fill="url(#goldGrad)">
    <!-- Dot of the Faa (نقطة الفاء) -->
    <circle cx="${center + size * 0.035}" cy="${center - size * 0.16}" r="${dotR}" />

    <!-- Head and Body of the Faa -->
    <path d="
      M ${center + size * 0.10} ${center - size * 0.03}
      C ${center + size * 0.10} ${center - size * 0.10}, ${center - size * 0.02} ${center - size * 0.10}, ${center - size * 0.06} ${center - size * 0.05}
      C ${center - size * 0.09} ${center - size * 0.01}, ${center - size * 0.08} ${center + size * 0.05}, ${center - size * 0.03} ${center + size * 0.07}
      C ${center + size * 0.02} ${center + size * 0.09}, ${center + size * 0.08} ${center + size * 0.06}, ${center + size * 0.09} ${center + size * 0.02}
      L ${center + size * 0.09} ${center + size * 0.07}
      C ${center + size * 0.09} ${center + size * 0.14}, ${center + size * 0.02} ${center + size * 0.18}, ${center - size * 0.08} ${center + size * 0.18}
      C ${center - size * 0.20} ${center + size * 0.18}, ${center - size * 0.24} ${center + size * 0.10}, ${center - size * 0.24} ${center + size * 0.05}
      C ${center - size * 0.24} ${center + size * 0.01}, ${center - size * 0.20} ${center + size * 0.01}, ${center - size * 0.20} ${center + size * 0.05}
      C ${center - size * 0.20} ${center + size * 0.08}, ${center - size * 0.17} ${center + size * 0.14}, ${center - size * 0.08} ${center + size * 0.14}
      C ${center - size * 0.01} ${center + size * 0.14}, ${center + size * 0.05} ${center + size * 0.11}, ${center + size * 0.05} ${center + size * 0.05}
      L ${center + size * 0.05} ${center + size * 0.02}
      C ${center + size * 0.01} ${center + size * 0.04}, ${center - size * 0.03} ${center + size * 0.03}, ${center - size * 0.05} ${center - size * 0.01}
      C ${center - size * 0.06} ${center - size * 0.04}, ${center - size * 0.04} ${center - size * 0.07}, ${center} ${center - size * 0.07}
      C ${center + size * 0.04} ${center - size * 0.07}, ${center + size * 0.07} ${center - size * 0.04}, ${center + size * 0.07} ${center - size * 0.01}
      Z
    " />
  </g>
</svg>
  `.trim();
};

async function main() {
  const standardSvg = createSvg(512, false);
  const maskableSvg = createSvg(512, true);

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);

  // Generate PNGs using Sharp
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Successfully generated PWA icons in /public');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
