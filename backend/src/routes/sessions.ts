import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type SessionFields,
} from '../utils/airtable.js';

export function registerSessionsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/sessions - Get all sessions
   */
  app.fastify.get(
    '/api/sessions',
    {
      schema: {
        description: 'Get all conference sessions',
        tags: ['sessions'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                speaker: { type: 'string' },
                room: { type: 'string' },
                type: { type: 'string' },
                date: { type: 'string' },
                time: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all sessions from Airtable');
      try {
        const data = await fetchAirtableRecords<SessionFields>(TABLES.SESSIONS);

        const sessions = data.records.map((record: AirtableRecord<SessionFields>) => ({
          id: record.id,
          title: record.fields.Title || '',
          speaker: record.fields.Speaker?.[0] || '',
          room: record.fields.Room || '',
          type: record.fields.Type || '',
          date: record.fields.Date || '',
          time: record.fields.Time || '',
          description: record.fields.Description || '',
        }));

        app.logger.info({ count: sessions.length }, 'Sessions fetched successfully');
        return sessions;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch sessions');
        throw error;
      }
    }
  );

  /**
   * GET /api/sessions/:id - Get single session details
   */
  app.fastify.get(
    '/api/sessions/:id',
    {
      schema: {
        description: 'Get session details',
        tags: ['sessions'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              speaker: { type: 'string' },
              room: { type: 'string' },
              type: { type: 'string' },
              date: { type: 'string' },
              time: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ sessionId: id }, 'Fetching session details');

      try {
        const record = await fetchAirtableRecord<SessionFields>(TABLES.SESSIONS, id);

        const result = {
          id: record.id,
          title: record.fields.Title || '',
          speaker: record.fields.Speaker?.[0] || '',
          room: record.fields.Room || '',
          type: record.fields.Type || '',
          date: record.fields.Date || '',
          time: record.fields.Time || '',
          description: record.fields.Description || '',
        };

        app.logger.info({ sessionId: id }, 'Session details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, sessionId: id }, 'Failed to fetch session');
        throw error;
      }
    }
  );
}
