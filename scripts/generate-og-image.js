import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1200x630 OpenGraph and WhatsApp Link Preview image
const createOgSvg = () => {
  const width = 1200;
  const height = 630;
  const cx = width / 2;
  const cy = 240;
  const medallionR = 140;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Deep Emerald Green Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#145A43" />
      <stop offset="55%" stop-color="#0B3D2E" />
      <stop offset="100%" stop-color="#051C14" />
    </radialGradient>

    <!-- Radiant Gold Gradients -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5BE" />
      <stop offset="30%" stop-color="#F2D272" />
      <stop offset="65%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#9C7709" />
    </linearGradient>

    <linearGradient id="goldRing" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="50%" stop-color="#FFF9D6" />
      <stop offset="100%" stop-color="#AA820A" />
    </linearGradient>

    <!-- Soft Drop Shadow -->
    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Outer Ornate Islamic Gold Border -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="24" fill="none" stroke="url(#goldRing)" stroke-width="3" opacity="0.75" />
  <rect x="37" y="37" width="${width - 74}" height="${height - 74}" rx="18" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="14 10" opacity="0.45" />

  <!-- Corner Islamic Accents -->
  <circle cx="45" cy="45" r="8" fill="url(#goldGrad)" />
  <circle cx="${width - 45}" cy="45" r="8" fill="url(#goldGrad)" />
  <circle cx="45" cy="${height - 45}" r="8" fill="url(#goldGrad)" />
  <circle cx="${width - 45}" cy="${height - 45}" r="8" fill="url(#goldGrad)" />

  <!-- Central Medallion Outer Circles -->
  <g filter="url(#goldGlow)">
    <circle cx="${cx}" cy="${cy}" r="${medallionR}" fill="#082A20" stroke="url(#goldRing)" stroke-width="6" />
    <circle cx="${cx}" cy="${cy}" r="${medallionR - 12}" fill="none" stroke="url(#goldGrad)" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.8" />
    <circle cx="${cx}" cy="${cy}" r="${medallionR - 22}" fill="#0A3628" stroke="url(#goldGrad)" stroke-width="1.5" opacity="0.6" />
  </g>

  <!-- The Arabic Letter (ف) in Gold Calligraphy -->
  <g filter="url(#goldGlow)" fill="url(#goldGrad)">
    <!-- Dot of the Faa (نقطة الفاء) -->
    <circle cx="${cx + 20}" cy="${cy - 72}" r="18" />

    <!-- Head and Body of the Faa (حرف الفاء) -->
    <path d="
      M ${cx + 45} ${cy - 12}
      C ${cx + 45} ${cy - 45}, ${cx - 10} ${cy - 45}, ${cx - 28} ${cy - 22}
      C ${cx - 42} ${cy - 4}, ${cx - 36} ${cy + 22}, ${cx - 14} ${cy + 30}
      C ${cx + 10} ${cy + 38}, ${cx + 36} ${cy + 26}, ${cx + 40} ${cy + 8}
      L ${cx + 40} ${cy + 30}
      C ${cx + 40} ${cy + 62}, ${cx + 10} ${cy + 80}, ${cx - 36} ${cy + 80}
      C ${cx - 90} ${cy + 80}, ${cx - 108} ${cy + 45}, ${cx - 108} ${cy + 22}
      C ${cx - 108} ${cy + 4}, ${cx - 90} ${cy + 4}, ${cx - 90} ${cy + 22}
      C ${cx - 90} ${cy + 36}, ${cx - 76} ${cy + 62}, ${cx - 36} ${cy + 62}
      C ${cx - 4} ${cy + 62}, ${cx + 22} ${cy + 48}, ${cx + 22} ${cy + 22}
      L ${cx + 22} ${cy + 8}
      C ${cx + 4} ${cy + 18}, ${cx - 14} ${cy + 14}, ${cx - 22} ${cy - 4}
      C ${cx - 28} ${cy - 18}, ${cx - 18} ${cy - 30}, ${cx} ${cy - 30}
      C ${cx + 18} ${cy - 30}, ${cx + 30} ${cy - 18}, ${cx + 30} ${cy - 4}
      Z
    " />
  </g>

  <!-- Academy Title in Gold (Arabic Text) -->
  <text x="${cx}" y="475" text-anchor="middle" font-family="'Cairo', 'Amiri', 'Traditional Arabic', Arial, sans-serif" font-size="44" font-weight="bold" fill="url(#goldGrad)" letter-spacing="1" filter="url(#goldGlow)">
    أكاديمية الفرقان الدولية لتحفيظ القرآن الكريم
  </text>

  <!-- Subtitle in Cream / Light Gold -->
  <text x="${cx}" y="535" text-anchor="middle" font-family="'Cairo', 'Amiri', Arial, sans-serif" font-size="25" font-weight="600" fill="#FFF2A8" opacity="0.95">
    نظام الإدارة والمتابعة الشامل لتحفيظ القرآن الكريم
  </text>

  <!-- Islamic Flourish / Quranic Verse Indicator -->
  <text x="${cx}" y="585" text-anchor="middle" font-family="'Amiri', 'Traditional Arabic', serif" font-size="20" fill="#D4AF37" opacity="0.85">
    🌿 «خَيرُكُم مَن تَعلَّمَ القُرآنَ وعَلَّمَهُ» 🌿
  </text>
</svg>
  `.trim();
};

async function main() {
  const ogSvg = createOgSvg();
  const outputPath = path.join(publicDir, 'og-image.png');

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png({ quality: 100 })
    .toFile(outputPath);

  console.log('Successfully generated public/og-image.png (1200x630)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
