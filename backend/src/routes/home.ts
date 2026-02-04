import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  TABLES,
  type AirtableRecord,
  type AnnouncementFields,
} from '../utils/airtable.js';

export function registerHomeRoutes(app: App) {
  /**
   * GET /api/home - Get announcements feed (public endpoint)
   */
  app.fastify.get(
    '/api/home',
    {
      schema: {
        description: 'Get announcements feed',
        tags: ['home'],
        response: {
          200: {
            type: 'object',
            properties: {
              announcements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching home announcements');

      try {
        const data = await fetchAirtableRecords<AnnouncementFields>(TABLES.ANNOUNCEMENTS);

        const announcements = data.records.map((record: AirtableRecord<AnnouncementFields>) => ({
          id: record.id,
          title: record.fields.Title || '',
          content: record.fields.Content || '',
          createdAt: record.fields.CreatedAt || new Date().toISOString(),
        }));

        app.logger.info({ count: announcements.length }, 'Home announcements fetched');
        return {
          announcements,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch home announcements');
        throw error;
      }
    }
  );
}
