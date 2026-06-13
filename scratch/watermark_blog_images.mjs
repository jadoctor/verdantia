import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const blogDir = 'c:/Users/jaill/Documents/VERDANTIA/public/blog';
const backupDir = 'c:/Users/jaill/Documents/VERDANTIA/public/blog/backup';

const images = [
  'luna_creciente.png',
  'luna_llena.png',
  'luna_menguante.png',
  'luna_nueva.png',
  'lunar_garden_hero.png',
  'lunar_seedling.png'
];

const watermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
  <rect x="0" y="0" width="300" height="60" fill="black" fill-opacity="0.4" rx="8" />
  <text x="280" y="40" text-anchor="end"
    font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold"
    fill="white" fill-opacity="0.9" letter-spacing="2">
    VERDANTIA
  </text>
</svg>`);

async function run() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }

  for (const imgName of images) {
    const imgPath = path.join(blogDir, imgName);
    const backupPath = path.join(backupDir, imgName);

    if (!fs.existsSync(imgPath)) {
      console.error(`File does not exist: ${imgPath}`);
      continue;
    }

    // Backup original if not already backed up
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(imgPath, backupPath);
      console.log(`Backed up original image to ${backupPath}`);
    } else {
      console.log(`Backup already exists for ${imgName}`);
    }

    console.log(`Processing image: ${imgName}...`);
    try {
      const sharpInstance = sharp(backupPath);
      const metadata = await sharpInstance.metadata();

      const width = metadata.width || 1920;
      const height = metadata.height || 1080;

      let processed = sharpInstance
        .clone()
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });

      // Only add watermark if the image is large enough
      if (width >= 300 && height >= 60) {
        processed = processed.composite([{
          input: watermarkSvg,
          gravity: 'southeast'
        }]);
      }

      // Output back to the original public/blog path as PNG to keep filenames identical
      await processed.png({ quality: 85 }).toFile(imgPath);
      console.log(`Successfully watermarked and saved: ${imgName}`);
    } catch (error) {
      console.error(`Error processing ${imgName}:`, error);
    }
  }
}

run();
