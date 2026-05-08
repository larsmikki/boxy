import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import gamesRouter from './routes/games.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(compression());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '50mb' }));

  app.use('/api', gamesRouter);

  if (isProduction) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[api]', err.message);
    res.status(500).type('application/problem+json').json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: err.message,
    });
  });

  return app;
}
