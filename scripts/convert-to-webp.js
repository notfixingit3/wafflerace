#!/usr/bin/env node

/**
 * Simple helper to convert images to WebP.
 *
 * Usage examples:
 *   npm run convert:collection assets/boats/collections/flags-of-us/png -- --quality 85
 *   node scripts/convert-to-webp.js assets/boat-sprites --quality 85
 *   node scripts/convert-to-webp.js assets/backgrounds --quality 88
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const inputDir = args[0];

if (!inputDir) {
  console.error('Usage: node scripts/convert-to-webp.js <input-folder> [--quality 85]');
  process.exit(1);
}

let quality = 85;
const qualityIndex = args.indexOf('--quality');
if (qualityIndex !== -1 && args[qualityIndex + 1]) {
  quality = parseInt(args[qualityIndex + 1], 10);
}

const inputPath = path.resolve(inputDir);
const outputDir = path.join(path.dirname(inputPath), path.basename(inputPath) + '-webp');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputPath).filter(f =>
  /\.(jpe?g|png)$/i.test(f)
);

if (files.length === 0) {
  console.log('No images found in', inputPath);
  process.exit(0);
}

console.log(`Converting ${files.length} images from ${inputPath} to WebP (quality: ${quality})...`);

files.forEach(file => {
  const inputFile = path.join(inputPath, file);
  const outputFile = path.join(outputDir, file.replace(/\.(jpe?g|png)$/i, '.webp'));

  try {
    // Use cwebp with good settings for sprites/scenic images
    const cmd = `cwebp -q ${quality} -alpha_q 100 -m 6 "${inputFile}" -o "${outputFile}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✓ ${file} → ${path.basename(outputFile)}`);
  } catch (err) {
    console.error(`✗ Failed to convert ${file}:`, err.message);
  }
});

console.log(`\nDone! WebP files saved to: ${outputDir}`);