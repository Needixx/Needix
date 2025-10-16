import { globby } from "globby";
import sharp from "sharp";
import { join, parse } from "path";
import fs from "fs/promises";

const files = await globby("public/images/**/*.{png,jpg,jpeg}");
for (const f of files) {
  const { dir, name } = parse(f);
  const buf = await fs.readFile(f);
  await sharp(buf).webp({ quality: 82 }).toFile(join(dir, `${name}.webp`));
  await sharp(buf).avif({ quality: 60 }).toFile(join(dir, `${name}.avif`));
}
console.log("Optimized images to WebP/AVIF");
