const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(inputPath, outputPath, width, height) {
  try {
    await sharp(inputPath)
      .resize(width, height)
      .png()
      .toFile(outputPath);
    console.log(`Successfully converted ${inputPath} to ${outputPath}`);
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error);
  }
}

// Convert icon.svg to icon.png (1024x1024)
convertSvgToPng(
  path.join(__dirname, 'assets/images/icon.svg'),
  path.join(__dirname, 'assets/images/icon.png'),
  1024,
  1024
);

// Convert adaptive-icon.svg to adaptive-icon.png (1024x1024)
convertSvgToPng(
  path.join(__dirname, 'assets/images/adaptive-icon.svg'),
  path.join(__dirname, 'assets/images/adaptive-icon.png'),
  1024,
  1024
);

// Convert splash.svg to splash.png (1242x2436)
convertSvgToPng(
  path.join(__dirname, 'assets/images/splash.svg'),
  path.join(__dirname, 'assets/images/splash.png'),
  1242,
  2436
);

// Create favicon.png (32x32)
convertSvgToPng(
  path.join(__dirname, 'assets/images/icon.svg'),
  path.join(__dirname, 'assets/images/favicon.png'),
  32,
  32
); 