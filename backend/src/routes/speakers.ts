import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type SpeakerFields,
} from '../utils/airtable.js';

export function registerSpeakersRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/speakers - Get all speakers
   */
  app.fastify.get(
    '/api/speakers',
    {
      schema: {
        description: 'Get all conference speakers',
        tags: ['speakers'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                name: { type: 'string' },
                title: { type: 'string' },
                photo: { type: 'string' },
                topic: { type: 'string' },
                synopsis: { type: 'string' },
                bio: { type: 'string' },
                published: { type: 'boolean' },
                publicPersonalData: { type: 'boolean' },
                email: { type: 'string' },
                phone: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all speakers from Airtable');
      try {
        const data = await fetchAirtableRecords<SpeakerFields>(TABLES.SPEAKERS, {
          logger: app.logger,
        });

        app.logger.info({ totalRecords: data.records.length }, 'Total speakers fetched from Airtable');

        // Filter speakers by Published field
        const publishedRecords = data.records.filter((record: AirtableRecord<SpeakerFields>) => {
          const isPublished = record.fields.Published === true;
          if (!isPublished) {
            const speakerName = record.fields['Speaker Name'] || 'Unknown';
            app.logger.debug(
              { speakerId: record.id, speakerName },
              'Speaker excluded (Published = false)'
            );
          }
          return isPublished;
        });

        const speakers = publishedRecords.map((record: AirtableRecord<SpeakerFields>) => {
          const firstName = record.fields['Speaker Name'] || '';
          const lastName = record.fields['Last Name'] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          const isPublicPersonalData = record.fields['Public Personal Data'] === true;

          return {
            id: record.id,
            firstName,
            lastName,
            name: fullName,
            title: record.fields['Speaker Title'] || '',
            photo: record.fields.Photo?.[0]?.url || '',
            topic: record.fields['Speaking Topic'] || '',
            synopsis: record.fields['Synopsis of Speaking topic'] || '',
            bio: record.fields.Bio || '',
            published: record.fields.Published === true,
            publicPersonalData: isPublicPersonalData,
            email: isPublicPersonalData ? (record.fields.Email || '') : '',
            phone: isPublicPersonalData ? (record.fields.Phone || '') : '',
          };
        }).sort((a, b) => a.lastName.toLowerCase().localeCompare(b.lastName.toLowerCase()));

        app.logger.info(
          { totalFetched: data.records.length, publishedCount: speakers.length },
          'Speakers fetched successfully'
        );
        return speakers;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch speakers');
        throw error;
      }
    }
  );

  /**
   * GET /api/speakers/:id - Get speaker details
   */
  app.fastify.get(
    '/api/speakers/:id',
    {
      schema: {
        description: 'Get speaker details',
        tags: ['speakers'],
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
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              name: { type: 'string' },
              title: { type: 'string' },
              photo: { type: 'string' },
              topic: { type: 'string' },
              synopsis: { type: 'string' },
              bio: { type: 'string' },
              published: { type: 'boolean' },
              publicPersonalData: { type: 'boolean' },
              email: { type: 'string' },
              phone: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ speakerId: id }, 'Fetching speaker details');

      try {
        const record = await fetchAirtableRecord<SpeakerFields>(TABLES.SPEAKERS, id, app.logger);

        if (!record) {
          app.logger.warn({ speakerId: id }, 'Speaker not found (permission denied or record not found)');
          return reply.status(404).send({
            error: 'Speaker not found. The Airtable API may not have permission to access this table.',
          });
        }

        const firstName = record.fields['Speaker Name'] || '';
        const lastName = record.fields['Last Name'] || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const isPublicPersonalData = record.fields['Public Personal Data'] === true;

        const result = {
          id: record.id,
          firstName,
          lastName,
          name: fullName,
          title: record.fields['Speaker Title'] || '',
          photo: record.fields.Photo?.[0]?.url || '',
          topic: record.fields['Speaking Topic'] || '',
          synopsis: record.fields['Synopsis of Speaking topic'] || '',
          bio: record.fields.Bio || '',
          published: record.fields.Published === true,
          publicPersonalData: isPublicPersonalData,
          email: isPublicPersonalData ? (record.fields.Email || '') : '',
          phone: isPublicPersonalData ? (record.fields.Phone || '') : '',
        };

        app.logger.info({ speakerId: id }, 'Speaker details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, speakerId: id }, 'Failed to fetch speaker');
        throw error;
      }
    }
  );
}
