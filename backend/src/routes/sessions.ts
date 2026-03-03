import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecord,
  type SessionFields,
  type SpeakerFields,
} from '../utils/airtable.js';
import { airtableCache } from '../services/airtable-cache.js';

/**
 * Resolve linked speaker record IDs to speaker names
 * If speaker field is an array of record IDs or a single record ID,
 * fetch the speaker records and extract names
 */
async function resolveSpeakerNames(
  speakerValue: any,
  app: App
): Promise<string> {
  if (!speakerValue) return '';

  // If it's a string (single record ID)
  if (typeof speakerValue === 'string') {
    try {
      const speakerRecord = await fetchAirtableRecord<SpeakerFields>(
        TABLES.SPEAKERS,
        speakerValue
      );
      if (speakerRecord) {
        return speakerRecord.fields['Speaker Name'] || speakerValue;
      }
    } catch (error) {
      app.logger.debug(
        { speakerId: speakerValue, error },
        'Failed to fetch speaker record, using ID as fallback'
      );
    }
    return speakerValue;
  }

  // If it's an array of record IDs
  if (Array.isArray(speakerValue)) {
    try {
      const speakerNames = await Promise.all(
        speakerValue.map(async (speakerId: string) => {
          try {
            const speakerRecord = await fetchAirtableRecord<SpeakerFields>(
              TABLES.SPEAKERS,
              speakerId
            );
            return speakerRecord?.fields['Speaker Name'] || speakerId;
          } catch (error) {
            app.logger.debug(
              { speakerId, error },
              'Failed to fetch speaker record, using ID as fallback'
            );
            return speakerId;
          }
        })
      );
      return speakerNames.join(', ');
    } catch (error) {
      app.logger.debug(
        { speakerValue, error },
        'Failed to resolve linked speaker records'
      );
    }
  }

  // Fallback: if it's already a string value (not a record ID), return it as-is
  return String(speakerValue);
}

export function registerSessionsRoutes(app: App) {
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

      app.logger.info('Fetching all sessions from cache');
      try {
        const cachedRecords = airtableCache.getSessions();

        // Process all sessions and resolve linked speaker records
        const sessions = await Promise.all(
          cachedRecords.map(async (record: AirtableRecord<SessionFields>) => {
            const fields = record.fields as any;

            // Try multiple speaker field name variations
            let speakerValue = '';
            const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
            for (const fieldName of speakerFieldNames) {
              if (fields[fieldName]) {
                speakerValue = fields[fieldName];
                break;
              }
            }

            // Resolve linked speaker records to speaker names
            const speaker = await resolveSpeakerNames(speakerValue, app);

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
          })
        );

        app.logger.info({ count: sessions.length }, 'Sessions fetched successfully from cache');
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
        let speakerValue = '';
        for (const fieldName of speakerFieldNames) {
          if (fields[fieldName]) {
            speakerValue = fields[fieldName];
            app.logger.info(
              { sessionId: id, speakerField: fieldName, speakerValue },
              'Speaker value extracted from field'
            );
            break;
          }
        }

        if (!speakerValue) {
          app.logger.debug(
            { sessionId: id, attemptedFields: speakerFieldNames },
            'No speaker field found'
          );
        }

        // Resolve linked speaker records to speaker names
        const speaker = await resolveSpeakerNames(speakerValue, app);

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
