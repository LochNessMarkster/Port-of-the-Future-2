import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type SponsorFields,
} from '../utils/airtable.js';

const TIER_ORDER = {
  Platinum: 1,
  Gold: 2,
  Silver: 3,
  Bronze: 4,
  Partner: 5,
};

export function registerSponsorsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/sponsors - Get all sponsors grouped by tier
   */
  app.fastify.get(
    '/api/sponsors',
    {
      schema: {
        description: 'Get all sponsors grouped by tier',
        tags: ['sponsors'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                logo: { type: 'string' },
                tier: { type: 'string' },
                intro: { type: 'string' },
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

      app.logger.info('Fetching all sponsors from Airtable');
      try {
        const data = await fetchAirtableRecords<SponsorFields>(TABLES.SPONSORS);

        let sponsors = data.records.map((record: AirtableRecord<SponsorFields>) => ({
          id: record.id,
          name: record.fields.Name || '',
          logo: record.fields.Logo?.[0]?.url || '',
          tier: record.fields.Tier || '',
          intro: record.fields.Intro || '',
          bio: record.fields.Bio || '',
          website: record.fields.Website || '',
        }));

        // Sort by tier order
        sponsors = sponsors.sort((a, b) => {
          const orderA = TIER_ORDER[a.tier as keyof typeof TIER_ORDER] || 999;
          const orderB = TIER_ORDER[b.tier as keyof typeof TIER_ORDER] || 999;
          return orderA - orderB;
        });

        app.logger.info({ count: sponsors.length }, 'Sponsors fetched successfully');
        return sponsors;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch sponsors');
        throw error;
      }
    }
  );

  /**
   * GET /api/sponsors/:id - Get sponsor details
   */
  app.fastify.get(
    '/api/sponsors/:id',
    {
      schema: {
        description: 'Get sponsor details',
        tags: ['sponsors'],
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
              tier: { type: 'string' },
              intro: { type: 'string' },
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
      app.logger.info({ sponsorId: id }, 'Fetching sponsor details');

      try {
        const record = await fetchAirtableRecord<SponsorFields>(TABLES.SPONSORS, id);

        const result = {
          id: record.id,
          name: record.fields.Name || '',
          logo: record.fields.Logo?.[0]?.url || '',
          tier: record.fields.Tier || '',
          intro: record.fields.Intro || '',
          bio: record.fields.Bio || '',
          website: record.fields.Website || '',
        };

        app.logger.info({ sponsorId: id }, 'Sponsor details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, sponsorId: id }, 'Failed to fetch sponsor');
        throw error;
      }
    }
  );
}
