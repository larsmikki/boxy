import { createApp } from './app.js';
import { config } from './config.js';

async function main() {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Collecter server running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
