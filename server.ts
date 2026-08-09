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

  // Get backup data from cloud server storage
  app.get('/api/backup', (req, res) => {
    try {
      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json({ status: 'empty', message: 'No backup file found' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Sync data to cloud server storage
  app.post('/api/sync', (req, res) => {
    try {
      const payload = req.body;
      payload.serverBackupTime = new Date().toISOString();
      fs.writeFileSync(dbFile, JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({ status: 'success', message: 'Data synced & backed up to server storage', time: payload.serverBackupTime });
    } catch (err: any) {
      console.error('Server backup error:', err);
      return res.status(500).json({ error: err.message });
    }
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
