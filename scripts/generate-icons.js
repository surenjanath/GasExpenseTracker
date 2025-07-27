const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  icon: 1024,
  adaptiveIcon: 1024,
  splash: 2048,
  favicon: 32
};

const generateIcon = async (size, outputPath) => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FF4F4F;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
        </filter>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#grad)"/>
      <g transform="translate(25, 25) scale(0.5)">
        <!-- Gas Pump Base -->
        <rect x="20" y="40" width="40" height="40" rx="8" fill="white"/>
        <!-- Gas Pump Nozzle -->
        <rect x="60" y="20" width="30" height="20" rx="4" transform="rotate(45, 60, 20)" fill="white"/>
        <!-- Gas Pump Handle -->
        <rect x="75" y="15" width="20" height="10" rx="2" transform="rotate(90, 75, 15)" fill="white"/>
        <!-- Gauge -->
        <circle cx="10" cy="10" r="20" fill="white" stroke="#FF6B6B" stroke-width="4"/>
        <rect x="0" y="8" width="20" height="4" rx="2" transform="rotate(45, 10, 10)" fill="#FF6B6B"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
};

const generateIcons = async () => {
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  await Promise.all([
    generateIcon(sizes.icon, path.join(assetsDir, 'icon.png')),
    generateIcon(sizes.adaptiveIcon, path.join(assetsDir, 'adaptive-icon.png')),
    generateIcon(sizes.splash, path.join(assetsDir, 'splash.png')),
    generateIcon(sizes.favicon, path.join(assetsDir, 'favicon.png'))
  ]);

  console.log('Icons generated successfully!');
};

generateIcons().catch(console.error); 