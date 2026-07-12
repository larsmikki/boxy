import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('Big Box Companion server', () => {
  it('returns health status', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
