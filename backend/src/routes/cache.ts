import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { airtableCache } from '../services/airtable-cache.js';

export function registerCacheRoutes(app: App) {
  /**
   * GET /api/cache/status - Get cache status
   */
  app.fastify.get(
    '/api/cache/status',
    {
      schema: {
        description: 'Get Airtable cache status',
        tags: ['cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              lastUpdated: { type: ['string', 'null'] },
              isRefreshing: { type: 'boolean' },
              tables: {
                type: 'object',
                properties: {
                  sessions: { type: 'integer' },
                  speakers: { type: 'integer' },
                  ports: { type: 'integer' },
                  exhibitors: { type: 'integer' },
                  sponsors: { type: 'integer' },
                  attendees: { type: 'integer' },
                  announcements: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching cache status');
      try {
        const status = airtableCache.getStatus();
        app.logger.info({ status }, 'Cache status retrieved');
        return status;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to get cache status');
        throw error;
      }
    }
  );
}
