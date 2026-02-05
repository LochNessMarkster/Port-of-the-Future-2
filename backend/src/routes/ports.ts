import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type PortFields,
} from '../utils/airtable.js';

export function registerPortsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/ports - Get all ports
   */
  app.fastify.get(
    '/api/ports',
    {
      schema: {
        description: 'Get all conference ports',
        tags: ['ports'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                logo: { type: 'string' },
                bio: { type: 'string' },
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

      app.logger.info('Fetching all ports from Airtable');
      try {
        const data = await fetchAirtableRecords<PortFields>(TABLES.PORTS, {
          logger: app.logger,
        });

        const ports = data.records.map((record: AirtableRecord<PortFields>) => ({
          id: record.id,
          name: record.fields['Port Name'] || '',
          logo: record.fields['Logo graphic']?.[0]?.url || '',
          bio: record.fields['Port Bio'] || '',
          website: record.fields['Port Link'] || '',
        }));

        app.logger.info({ count: ports.length }, 'Ports fetched successfully');
        return ports;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch ports');
        throw error;
      }
    }
  );

  /**
   * GET /api/ports/:id - Get port details
   */
  app.fastify.get(
    '/api/ports/:id',
    {
      schema: {
        description: 'Get port details',
        tags: ['ports'],
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
              bio: { type: 'string' },
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
      app.logger.info({ portId: id }, 'Fetching port details');

      try {
        const record = await fetchAirtableRecord<PortFields>(TABLES.PORTS, id, app.logger);

        if (!record) {
          app.logger.warn({ portId: id }, 'Port not found (permission denied or record not found)');
          return reply.status(404).send({
            error: 'Port not found. The Airtable API may not have permission to access this table.',
          });
        }

        const result = {
          id: record.id,
          name: record.fields['Port Name'] || '',
          logo: record.fields['Logo graphic']?.[0]?.url || '',
          bio: record.fields['Port Bio'] || '',
          website: record.fields['Port Link'] || '',
        };

        app.logger.info({ portId: id }, 'Port details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, portId: id }, 'Failed to fetch port');
        throw error;
      }
    }
  );
}
