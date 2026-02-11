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
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                phone: { type: 'string' },
                companyUrl: { type: 'string' },
                linkedIn: { type: 'string' },
                boothNumber: { type: 'string' },
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
        const data = await fetchAirtableRecords<ExhibitorFields>(TABLES.EXHIBITORS, {
          logger: app.logger,
        });

        // Log first record's field names for debugging
        if (data.records.length > 0) {
          app.logger.info(
            { fieldNames: Object.keys(data.records[0]?.fields || {}) },
            'Available field names in first exhibitor record'
          );
          app.logger.debug(
            { firstRecordRaw: JSON.stringify(data.records[0], null, 2) },
            'First exhibitor raw record from Airtable'
          );
        }

        const exhibitors = data.records.map((record: AirtableRecord<ExhibitorFields>) => {
          // Try multiple company URL field name variations
          const companyUrl =
            (record.fields as any)['Company URL'] ||
            (record.fields as any).CompanyURL ||
            (record.fields as any)['Company Website'] ||
            record.fields.Website ||
            '';

          return {
            id: record.id,
            name: record.fields.Name || '',
            description: record.fields.Description || record.fields.Bio || '',
            logoUrl: record.fields.Logo?.[0]?.url || '',
            phone: record.fields.Phone || '',
            companyUrl,
            linkedIn: record.fields.LinkedIn || '',
            boothNumber: record.fields['Booth Number'] || record.fields.BoothNumber || '',
          };
        });

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
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              phone: { type: 'string' },
              companyUrl: { type: 'string' },
              linkedIn: { type: 'string' },
              boothNumber: { type: 'string' },
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
        const record = await fetchAirtableRecord<ExhibitorFields>(TABLES.EXHIBITORS, id, app.logger);

        if (!record) {
          app.logger.warn({ exhibitorId: id }, 'Exhibitor not found (permission denied or record not found)');
          return reply.status(404).send({
            error: 'Exhibitor not found. The Airtable API may not have permission to access this table.',
          });
        }

        // Log field names for debugging
        app.logger.info(
          { fieldNames: Object.keys(record?.fields || {}) },
          'Available field names in exhibitor record'
        );
        app.logger.debug(
          { exhibitorRaw: JSON.stringify(record, null, 2) },
          'Exhibitor raw record from Airtable'
        );

        // Try multiple company URL field name variations
        const companyUrl =
          (record.fields as any)['Company URL'] ||
          (record.fields as any).CompanyURL ||
          (record.fields as any)['Company Website'] ||
          record.fields.Website ||
          '';

        const result = {
          id: record.id,
          name: record.fields.Name || '',
          description: record.fields.Description || record.fields.Bio || '',
          logoUrl: record.fields.Logo?.[0]?.url || '',
          phone: record.fields.Phone || '',
          companyUrl,
          linkedIn: record.fields.LinkedIn || '',
          boothNumber: record.fields['Booth Number'] || record.fields.BoothNumber || '',
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
