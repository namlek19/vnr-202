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

export default defineConfig({
  define: {
    __BGM_AVAILABLE__: JSON.stringify(scanAvailableBgm()),
  },
  plugins: [
    {
      name: 'vnr-bgm-detector',
      configureServer(server) {
        server.middlewares.use('/__bgm-manifest', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(scanAvailableBgm()));
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

