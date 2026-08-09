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
      const incoming = req.body || {};
      let existing: any = {};
      if (fs.existsSync(dbFile)) {
        try {
          existing = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
        } catch {
          existing = {};
        }
      }

      // Merge arrays by ID or keep non-empty list
      const mergeArrays = (local: any[], remote: any[]) => {
        const map = new Map<string, any>();
        const safeRemote = Array.isArray(remote) ? remote : [];
        const safeLocal = Array.isArray(local) ? local : [];
        for (const item of safeRemote) {
          if (item && item.id) map.set(item.id, item);
        }
        for (const item of safeLocal) {
          if (item && item.id) {
            const current = map.get(item.id);
            if (!current) {
              map.set(item.id, item);
            } else {
              const currentTime = new Date(current.updatedAt || current.createdAt || 0).getTime();
              const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
              if (itemTime >= currentTime) {
                map.set(item.id, { ...current, ...item });
              }
            }
          }
        }
        return Array.from(map.values());
      };

      const mergedPayload = {
        lastUpdated: new Date().toISOString(),
        serverBackupTime: new Date().toISOString(),
        cscConfig: (incoming.cscConfig && incoming.cscConfig.centreName && incoming.cscConfig.centreName !== 'CSC Digital Seva Kendra')
          ? incoming.cscConfig
          : (existing.cscConfig || incoming.cscConfig),
        customers: mergeArrays(incoming.customers, existing.customers),
        transactions: mergeArrays(incoming.transactions, existing.transactions),
        certificates: mergeArrays(incoming.certificates, existing.certificates),
        scholarships: mergeArrays(incoming.scholarships, existing.scholarships),
        panApplications: mergeArrays(incoming.panApplications, existing.panApplications),
        importantLinks: mergeArrays(incoming.importantLinks, existing.importantLinks),
      };

      fs.writeFileSync(dbFile, JSON.stringify(mergedPayload, null, 2), 'utf-8');
      return res.json({ status: 'success', message: 'Data merged & backed up to server storage', time: mergedPayload.serverBackupTime });
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
