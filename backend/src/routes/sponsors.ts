import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type SponsorFields,
  type PartnerFields,
} from '../utils/airtable.js';

const TIER_ORDER = {
  Platinum: 1,
  Gold: 2,
  Silver: 3,
  Bronze: 4,
  Partner: 5,
};

export function registerSponsorsRoutes(app: App) {
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
                bio: { type: 'string' },
                website: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {

      app.logger.info('Fetching all sponsors and partners from Airtable');
      try {
        // Fetch sponsors
        const sponsorsData = await fetchAirtableRecords<SponsorFields>(TABLES.SPONSORS, {
          logger: app.logger,
        });

        // Fetch partners
        const partnersData = await fetchAirtableRecords<PartnerFields>(TABLES.PARTNERS, {
          logger: app.logger,
        });

        // Map sponsors
        let sponsors = sponsorsData.records.map((record: AirtableRecord<SponsorFields>) => ({
          id: record.id,
          name: record.fields['Sponsor Name'] || '',
          logo: record.fields.LogoGraphic?.[0]?.url || '',
          tier: record.fields['Sponsor Level'] || '',
          bio: record.fields['Sponsor Bio'] || '',
          website: record.fields.CompanyLink || '',
        }));

        // Map partners and set tier to "Partner"
        const partners = partnersData.records.map((record: AirtableRecord<PartnerFields>) => ({
          id: record.id,
          name: record.fields['Partner Name'] || '',
          logo: record.fields.LogoGraphic?.[0]?.url || '',
          tier: 'Partner',
          bio: record.fields.PartnerBio || '',
          website: record.fields['Partner Page Link'] || '',
        }));

        // Merge sponsors and partners
        let allSponsors = [...sponsors, ...partners];

        // Sort by tier order, then alphabetically by name within each tier
        allSponsors = allSponsors.sort((a, b) => {
          const orderA = TIER_ORDER[a.tier as keyof typeof TIER_ORDER] || 999;
          const orderB = TIER_ORDER[b.tier as keyof typeof TIER_ORDER] || 999;

          // First sort by tier
          if (orderA !== orderB) {
            return orderA - orderB;
          }

          // Then sort alphabetically by name (case-insensitive) within the same tier
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        app.logger.info({ count: allSponsors.length, sponsors: sponsors.length, partners: partners.length }, 'Sponsors and partners fetched successfully');
        return allSponsors;
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
              bio: { type: 'string' },
              website: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {

      const { id } = request.params as { id: string };
      app.logger.info({ sponsorId: id }, 'Fetching sponsor details');

      try {
        // Try to fetch from sponsors table first
        let record = await fetchAirtableRecord<SponsorFields>(TABLES.SPONSORS, id, app.logger);

        // If not found, try partners table
        if (!record) {
          const partnerRecord = await fetchAirtableRecord<PartnerFields>(TABLES.PARTNERS, id, app.logger);

          if (!partnerRecord) {
            app.logger.warn({ sponsorId: id }, 'Sponsor not found (permission denied or record not found)');
            return reply.status(404).send({
              error: 'Sponsor not found. The Airtable API may not have permission to access this table.',
            });
          }

          // Format partner as sponsor
          const result = {
            id: partnerRecord.id,
            name: partnerRecord.fields['Partner Name'] || '',
            logo: partnerRecord.fields.LogoGraphic?.[0]?.url || '',
            tier: 'Partner',
            bio: partnerRecord.fields.PartnerBio || '',
            website: partnerRecord.fields['Partner Page Link'] || '',
          };

          app.logger.info({ sponsorId: id }, 'Partner details fetched');
          return result;
        }

        const result = {
          id: record.id,
          name: record.fields['Sponsor Name'] || '',
          logo: record.fields.LogoGraphic?.[0]?.url || '',
          tier: record.fields['Sponsor Level'] || '',
          bio: record.fields['Sponsor Bio'] || '',
          website: record.fields.CompanyLink || '',
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
