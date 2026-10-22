// Resize photos to about twice their largest on-page size and save them as WebP next to the original.
// Usage: node scripts/optimize-images.mjs <width> <image>...
// e.g.   node scripts/optimize-images.mjs 1000 public/assets/new-photo.jpg
// Uses sharp, which Next.js already installs for its image optimizer.
import sharp from 'sharp';

const [width, ...files] = process.argv.slice(2);
if (!Number(width) || files.length === 0) {
    console.error('usage: node scripts/optimize-images.mjs <width> <image>...');
    process.exit(1);
}

for (const file of files) {
    const out = file.replace(/\.\w+$/, '.webp');
    // rotate() with no angle applies the photo's EXIF orientation, so phone photos stay upright.
    const info = await sharp(file)
        .rotate()
        .resize({ width: Number(width), withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(out);
    console.log(`${out}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
}
