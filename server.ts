import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const dataDir = path.join(process.cwd(), 'data');
  const dbFile = path.join(dataDir, 'csc_database.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Get backup data status
  app.get('/api/backup', (req, res) => {
    return res.json({ status: 'ok', message: 'Firestore is the authoritative primary database' });
  });

  // Sync endpoint confirmation
  app.post('/api/sync', (req, res) => {
    return res.json({ status: 'success', message: 'Data synced to Firestore primary cloud storage', time: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CSC Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
