import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type ExhibitorFields,
} from '../utils/airtable.js';

export function registerExhibitorsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/exhibitors - Get all exhibitors
   */
  app.fastify.get(
    '/api/exhibitors',
    {
      schema: {
        description: 'Get all conference exhibitors',
        tags: ['exhibitors'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                logo: { type: 'string' },
                boothNumber: { type: 'string' },
                bio: { type: 'string' },
                contactName: { type: 'string' },
                contactEmail: { type: 'string' },
                website: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all exhibitors from Airtable');
      try {
        const data = await fetchAirtableRecords<ExhibitorFields>(TABLES.EXHIBITORS);

        const exhibitors = data.records.map((record: AirtableRecord<ExhibitorFields>) => ({
          id: record.id,
          name: record.fields.Name || '',
          logo: record.fields.Logo?.[0]?.url || '',
          boothNumber: record.fields.BoothNumber || '',
          bio: record.fields.Bio || '',
          contactName: record.fields.ContactName || '',
          contactEmail: record.fields.ContactEmail || '',
          website: record.fields.Website || '',
        }));

        app.logger.info({ count: exhibitors.length }, 'Exhibitors fetched successfully');
        return exhibitors;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch exhibitors');
        throw error;
      }
    }
  );

  /**
   * GET /api/exhibitors/:id - Get exhibitor details
   */
  app.fastify.get(
    '/api/exhibitors/:id',
    {
      schema: {
        description: 'Get exhibitor details',
        tags: ['exhibitors'],
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
              name: { type: 'string' },
              logo: { type: 'string' },
              boothNumber: { type: 'string' },
              bio: { type: 'string' },
              contactName: { type: 'string' },
              contactEmail: { type: 'string' },
              website: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ exhibitorId: id }, 'Fetching exhibitor details');

      try {
        const record = await fetchAirtableRecord<ExhibitorFields>(TABLES.EXHIBITORS, id);

        const result = {
          id: record.id,
          name: record.fields.Name || '',
          logo: record.fields.Logo?.[0]?.url || '',
          boothNumber: record.fields.BoothNumber || '',
          bio: record.fields.Bio || '',
          contactName: record.fields.ContactName || '',
          contactEmail: record.fields.ContactEmail || '',
          website: record.fields.Website || '',
        };

        app.logger.info({ exhibitorId: id }, 'Exhibitor details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, exhibitorId: id }, 'Failed to fetch exhibitor');
        throw error;
      }
    }
  );
}
