import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function scanAvailableBgm() {
  const result = {};
  for (let act = 1; act <= 4; act++) {
    const filePath = path.resolve(__dirname, 'public', 'audio', `bgm_act${act}.mp3`);
    try {
      const stat = fs.statSync(filePath);
      result[act] = stat.isFile() && stat.size > 0;
    } catch {
      result[act] = false;
    }
  }
  return result;
}

function scanAllImages() {
  const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.jfif', '.bmp', '.gif', '.svg', '.avif']);
  const found = [];

  function walk(dir, depth = 0) {
    if (depth > 4) return;
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (imageExts.has(ext)) {
            const rel = path.relative(__dirname, fullPath);
            found.push({ name: entry.name, fullPath, relativePath: rel.replace(/\\/g, '/') });
          }
        }
      }
    } catch {}
  }

  walk(__dirname);

  try {
    const parentDir = path.dirname(__dirname);
    const parentEntries = fs.readdirSync(parentDir, { withFileTypes: true });
    for (const entry of parentEntries) {
      if (entry.name === 'vnr-202' || entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = path.join(parentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExts.has(ext)) {
          found.push({ name: entry.name, fullPath, relativePath: '../' + entry.name });
        }
      }
    }
  } catch {}

  try {
    const outPath = path.resolve(__dirname, 'public', '__image_scan.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(found, null, 2), 'utf8');
  } catch {}

  return found;
}

function syncImageFolders() {
  try {
    const audioImgDir = path.resolve(__dirname, 'public', 'audio', 'image');
    const targetImgDir = path.resolve(__dirname, 'public', 'image');
    if (fs.existsSync(audioImgDir)) {
      fs.mkdirSync(targetImgDir, { recursive: true });
      const files = fs.readdirSync(audioImgDir);
      for (const file of files) {
        const srcFile = path.join(audioImgDir, file);
        const destFile = path.join(targetImgDir, file);
        if (!fs.existsSync(destFile)) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
    }
    if (fs.existsSync(targetImgDir)) {
      fs.mkdirSync(audioImgDir, { recursive: true });
      const files = fs.readdirSync(targetImgDir);
      for (const file of files) {
        const srcFile = path.join(targetImgDir, file);
        const destFile = path.join(audioImgDir, file);
        if (!fs.existsSync(destFile)) {
          fs.copyFileSync(srcFile, destFile);
        }
      }
    }
  } catch (err) {
    console.warn('Image folder sync warning:', err);
  }
}

syncImageFolders();
const INITIAL_IMAGE_SCAN = scanAllImages();

export default defineConfig({
  define: {
    __BGM_AVAILABLE__: JSON.stringify(scanAvailableBgm()),
    __SCANNED_IMAGES__: JSON.stringify(INITIAL_IMAGE_SCAN),
  },
  plugins: [
    {
      name: 'vnr-bgm-detector',
      configureServer(server) {
        server.middlewares.use('/__bgm-manifest', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(scanAvailableBgm()));
        });
        server.middlewares.use('/__image-manifest', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(scanAllImages()));
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});

