const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const candidateLogos = [
  '/Users/anilrathore/.gemini/antigravity/brain/54c36f16-287f-4e3f-a71a-b94f47c6c8f0/.user_uploaded/media_1793869999945_2a61b3a5.jpg',
  '/Users/anilrathore/.gemini/antigravity-ide/brain/f6fab270-6493-4b5c-abc2-b128311f7c21/.user_uploaded/media_1793522866752.jpg',
  '/Users/anilrathore/.gemini/antigravity-ide/brain/f6fab270-6493-4b5c-abc2-b128311f7c21/.user_uploaded/media_1793517360538.jpg'
];
const sourceLogo = candidateLogos.find(p => fs.existsSync(p));
const rootDir = '/Users/anilrathore/Documents/Project/Dk Sharma';

console.log('Verifying source logo exists:', !!sourceLogo);
if (!sourceLogo || !fs.existsSync(sourceLogo)) {
  console.error('Source logo does not exist!');
  process.exit(1);
}

// 1. Copy as main logo.png and logo.jpg in frontend/public/img/
const frontendImgDir = path.join(rootDir, 'frontend/public/img');
const frontendTargets = [
  'logo.png',
  'logo.jpg',
  'fav.png',
  'lucky-matka-logo.png',
  'tara-baba-logo.png'
];

frontendTargets.forEach(filename => {
  const dest = path.join(frontendImgDir, filename);
  fs.copyFileSync(sourceLogo, dest);
  console.log(`Copied to frontend: ${dest}`);
});

// 2. Landing page images
const landingImgDir = path.join(rootDir, 'landing/img');
const landingTargets = [
  'logo.png',
  'fav.png',
  'tara-baba-logo.png'
];

landingTargets.forEach(filename => {
  const dest = path.join(landingImgDir, filename);
  fs.copyFileSync(sourceLogo, dest);
  console.log(`Copied to landing: ${dest}`);
});

// 3. PlayStore images
const playstoreLogo = path.join(rootDir, 'PlayStore/assets/logo.png');
fs.copyFileSync(sourceLogo, playstoreLogo);
console.log(`Copied to PlayStore: ${playstoreLogo}`);

// 4. Android App mipmaps
// macOS sips tool converts and resizes image
const androidResDir = path.join(rootDir, 'Application/app/src/main/res');
const mipmapSizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

mipmapSizes.forEach(({ dir, size }) => {
  const targetDir = path.join(androidResDir, dir);
  if (fs.existsSync(targetDir)) {
    const tempPng = path.join(targetDir, 'temp_icon.png');
    try {
      execSync(`sips -z ${size} ${size} "${sourceLogo}" --out "${tempPng}"`);
      // Convert to webp if cwebp is available, or use sips format
      try {
        execSync(`sips -s format webp "${tempPng}" --out "${path.join(targetDir, 'ic_launcher.webp')}"`);
        execSync(`cp "${path.join(targetDir, 'ic_launcher.webp')}" "${path.join(targetDir, 'ic_launcher_round.webp')}"`);
        execSync(`cp "${path.join(targetDir, 'ic_launcher.webp')}" "${path.join(targetDir, 'ic_launcher_foreground.webp')}"`);
      } catch (err) {
        // Fallback: copy tempPng if sips doesn't support webp directly
        console.log(`sips webp conversion: ${err.message}`);
      }
      if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng);
      console.log(`Updated Android mipmap in ${dir} to ${size}x${size}`);
    } catch (e) {
      console.warn(`Could not resize for ${dir}:`, e.message);
    }
  }
});

console.log('Logo copying and updating completed successfully!');
