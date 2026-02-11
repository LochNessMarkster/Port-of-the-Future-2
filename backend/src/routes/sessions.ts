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
        const data = await fetchAirtableRecords<SessionFields>(TABLES.SESSIONS, {
          logger: app.logger,
        });

        // Log raw Airtable response structure to identify actual field names
        if (data.records.length > 0) {
          const fieldNames = Object.keys(data.records[0]?.fields || {});
          app.logger.info(
            { fieldNames },
            'Available field names in first session record'
          );

          // Check for speaker-related fields
          const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
          const foundSpeakerFields = speakerFieldNames.filter(name => fieldNames.includes(name));
          if (foundSpeakerFields.length > 0) {
            app.logger.info(
              { foundSpeakerFields },
              'Found speaker-related fields in session record'
            );
          } else {
            app.logger.warn(
              { attemptedSpeakerFields: speakerFieldNames },
              'No speaker-related fields found in session records'
            );
          }
        }

        const sessions = data.records.map((record: AirtableRecord<SessionFields>) => {
          const fields = record.fields as any;

          // Try multiple speaker field name variations
          let speaker = '';
          const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
          for (const fieldName of speakerFieldNames) {
            if (fields[fieldName]) {
              speaker = fields[fieldName];
              app.logger.debug(
                { sessionId: record.id, speakerField: fieldName, speaker },
                'Speaker extracted from field'
              );
              break;
            }
          }

          if (!speaker) {
            app.logger.debug(
              { sessionId: record.id, attemptedFields: speakerFieldNames },
              'No speaker field found, using empty string'
            );
          }

          return {
            id: record.id,
            title: record.fields.Title || '',
            speaker,
            room: record.fields.Room || '',
            type: record.fields['Type/Track'] || '',
            date: record.fields.Date || '',
            time: record.fields['Start Time'] || '',
            description: record.fields['Session Description'] || '',
          };
        });

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
        const record = await fetchAirtableRecord<SessionFields>(TABLES.SESSIONS, id, app.logger);

        if (!record) {
          app.logger.warn({ sessionId: id }, 'Session not found (permission denied or record not found)');
          return reply.status(404).send({
            error: 'Session not found. The Airtable API may not have permission to access this table.',
          });
        }

        // Log available field names
        const fieldNames = Object.keys(record?.fields || {});
        app.logger.info(
          { fieldNames },
          'Available field names in session record'
        );

        // Check for speaker-related fields
        const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
        const foundSpeakerFields = speakerFieldNames.filter(name => fieldNames.includes(name));
        if (foundSpeakerFields.length > 0) {
          app.logger.info(
            { foundSpeakerFields },
            'Found speaker-related fields in session record'
          );
        } else {
          app.logger.warn(
            { attemptedSpeakerFields: speakerFieldNames },
            'No speaker-related fields found in session record'
          );
        }

        // Try multiple speaker field name variations
        const fields = record.fields as any;
        let speaker = '';
        for (const fieldName of speakerFieldNames) {
          if (fields[fieldName]) {
            speaker = fields[fieldName];
            app.logger.info(
              { sessionId: id, speakerField: fieldName, speaker },
              'Speaker extracted from field'
            );
            break;
          }
        }

        if (!speaker) {
          app.logger.debug(
            { sessionId: id, attemptedFields: speakerFieldNames },
            'No speaker field found, using empty string'
          );
        }

        const result = {
          id: record.id,
          title: record.fields.Title || '',
          speaker,
          room: record.fields.Room || '',
          type: record.fields['Type/Track'] || '',
          date: record.fields.Date || '',
          time: record.fields['Start Time'] || '',
          description: record.fields['Session Description'] || '',
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
