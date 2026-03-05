import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  fetchAirtableRecord,
  TABLES,
  type AirtableRecordimport type { App } from '../index.js';
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
 * Resolve linked speaker record IDs to speaker names using the cache.
 * Falls back to individual API calls only if cache lookup fails.
 */
async function resolveSpeakerNames(
  speakerValue: any,
  app: App
): Promise<string> {
  if (!speakerValue) return '';

  // Get all cached speakers once
  const cachedSpeakers = airtableCache.getSpeakers ? airtableCache.getSpeakers() : [];

  const resolveOne = async (speakerId: string): Promise<string> => {
    // First try to find in cache
    const cached = cachedSpeakers.find((s: AirtableRecord<SpeakerFields>) => s.id === speakerId);
    if (cached) {
      const fields = cached.fields as any;
      // Try multiple name field variations
      const name =
        fields['Speaker Name'] ||
        (fields['First Name'] && fields['Last Name']
          ? `${fields['First Name']} ${fields['Last Name']}`.trim()
          : null) ||
        fields['First Name'] ||
        fields['Last Name'] ||
        fields['Name'] ||
        null;
      if (name) return name;
    }

    // Fallback: fetch individually
    try {
      const record = await fetchAirtableRecord<SpeakerFields>(TABLES.SPEAKERS, speakerId);
      if (record) {
        const fields = record.fields as any;
        return (
          fields['Speaker Name'] ||
          (fields['First Name'] && fields['Last Name']
            ? `${fields['First Name']} ${fields['Last Name']}`.trim()
            : null) ||
          fields['First Name'] ||
          fields['Last Name'] ||
          fields['Name'] ||
          speakerId
        );
      }
    } catch (error) {
      app.logger.debug({ speakerId, error }, 'Failed to fetch speaker record');
    }
    return speakerId;
  };

  // Single record ID string
  if (typeof speakerValue === 'string') {
    // If it looks like an Airtable record ID (starts with 'rec'), resolve it
    if (speakerValue.startsWith('rec')) {
      return resolveOne(speakerValue);
    }
    // Already a plain name
    return speakerValue;
  }

  // Array of record IDs
  if (Array.isArray(speakerValue)) {
    const names = await Promise.all(
      speakerValue.map(async (item: string) => {
        if (typeof item === 'string' && item.startsWith('rec')) {
          return resolveOne(item);
        }
        return String(item);
      })
    );
    return names.filter(Boolean).join(', ');
  }

  return String(speakerValue);
}

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

      app.logger.info('Fetching all sessions from cache');
      try {
        const cachedRecords = airtableCache.getSessions();

        const sessions = await Promise.all(
          cachedRecords.map(async (record: AirtableRecord<SessionFields>) => {
            const fields = record.fields as any;

            // Try multiple speaker field name variations
            let speakerValue: any = '';
            const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
            for (const fieldName of speakerFieldNames) {
              if (fields[fieldName]) {
                speakerValue = fields[fieldName];
                break;
              }
            }

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
          properties: { id: { type: 'string' } },
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
          return reply.status(404).send({ error: 'Session not found.' });
        }

        const fields = record.fields as any;
        let speakerValue: any = '';
        const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
        for (const fieldName of speakerFieldNames) {
          if (fields[fieldName]) {
            speakerValue = fields[fieldName];
            break;
          }
        }

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
      } catch (error) {
        app.logger.error({ err: error, sessionId: id }, 'Failed to fetch session');
        throw error;
      }
    }
  );
},
  type SessionFields,
  type SpeakerFields,
} from '../utils/airtable.js';
import { airtableCache } from '../services/airtable-cache.js';

/**
 * Resolve linked speaker record IDs to speaker names using the cache.
 * Falls back to individual API calls only if cache lookup fails.
 */
async function resolveSpeakerNames(
  speakerValue: any,
  app: App
): Promise<string> {
  if (!speakerValue) return '';

  // Get all cached speakers once
  const cachedSpeakers = airtableCache.getSpeakers ? airtableCache.getSpeakers() : [];

  const resolveOne = async (speakerId: string): Promise<string> => {
    // First try to find in cache
    const cached = cachedSpeakers.find((s: AirtableRecord<SpeakerFields>) => s.id === speakerId);
    if (cached) {
      const fields = cached.fields as any;
      // Try multiple name field variations
      const name =
        fields['Speaker Name'] ||
        (fields['First Name'] && fields['Last Name']
          ? `${fields['First Name']} ${fields['Last Name']}`.trim()
          : null) ||
        fields['First Name'] ||
        fields['Last Name'] ||
        fields['Name'] ||
        null;
      if (name) return name;
    }

    // Fallback: fetch individually
    try {
      const record = await fetchAirtableRecord<SpeakerFields>(TABLES.SPEAKERS, speakerId);
      if (record) {
        const fields = record.fields as any;
        return (
          fields['Speaker Name'] ||
          (fields['First Name'] && fields['Last Name']
            ? `${fields['First Name']} ${fields['Last Name']}`.trim()
            : null) ||
          fields['First Name'] ||
          fields['Last Name'] ||
          fields['Name'] ||
          speakerId
        );
      }
    } catch (error) {
      app.logger.debug({ speakerId, error }, 'Failed to fetch speaker record');
    }
    return speakerId;
  };

  // Single record ID string
  if (typeof speakerValue === 'string') {
    // If it looks like an Airtable record ID (starts with 'rec'), resolve it
    if (speakerValue.startsWith('rec')) {
      return resolveOne(speakerValue);
    }
    // Already a plain name
    return speakerValue;
  }

  // Array of record IDs
  if (Array.isArray(speakerValue)) {
    const names = await Promise.all(
      speakerValue.map(async (item: string) => {
        if (typeof item === 'string' && item.startsWith('rec')) {
          return resolveOne(item);
        }
        return String(item);
      })
    );
    return names.filter(Boolean).join(', ');
  }

  return String(speakerValue);
}

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

      app.logger.info('Fetching all sessions from cache');
      try {
        const cachedRecords = airtableCache.getSessions();

        const sessions = await Promise.all(
          cachedRecords.map(async (record: AirtableRecord<SessionFields>) => {
            const fields = record.fields as any;

            // Try multiple speaker field name variations
            let speakerValue: any = '';
            const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
            for (const fieldName of speakerFieldNames) {
              if (fields[fieldName]) {
                speakerValue = fields[fieldName];
                break;
              }
            }

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
          properties: { id: { type: 'string' } },
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
          return reply.status(404).send({ error: 'Session not found.' });
        }

        const fields = record.fields as any;
        let speakerValue: any = '';
        const speakerFieldNames = ['Speaker(s)', 'Speaker', 'Speakers', 'Presenter', 'Presenters'];
        for (const fieldName of speakerFieldNames) {
          if (fields[fieldName]) {
            speakerValue = fields[fieldName];
            break;
          }
        }

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
      } catch (error) {
        app.logger.error({ err: error, sessionId: id }, 'Failed to fetch session');
        throw error;
      }
    }
  );
}
