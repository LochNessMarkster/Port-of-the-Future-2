import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  TABLES,
  type AirtableRecord,
  type ActivityFields,
} from '../utils/airtable.js';

export function registerActivitiesRoutes(app: App) {
  /**
   * GET /api/activities - Get all activities
   */
  app.fastify.get(
    '/api/activities',
    {
      schema: {
        description: 'Get all conference activities',
        tags: ['activities'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string' },
                time: { type: 'string' },
                location: { type: 'string' },
                url: { type: 'string' },
                image: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all activities from Airtable');
      try {
        const data = await fetchAirtableRecords<ActivityFields>(TABLES.ACTIVITIES, {
          logger: app.logger,
        });

        app.logger.info({ totalRecords: data.records.length }, 'Total activities fetched from Airtable');

        // Log detailed field information for debugging
        data.records.forEach((record: AirtableRecord<ActivityFields>, index: number) => {
          app.logger.debug(
            {
              recordIndex: index,
              recordId: record.id,
              rawFields: record.fields,
              Name: record.fields.Name,
              Description: record.fields.Description,
              Date: record.fields.Date,
              Time: record.fields.Time,
              Location: record.fields.Location,
              URL: record.fields.URL,
              MoreinfoURL: record.fields.MoreinfoURL,
              ImageArray: record.fields.Image,
              ImageUrl: record.fields.Image?.[0]?.url,
            },
            'Activity record field values'
          );
        });

        const activities = data.records
          .map((record: AirtableRecord<ActivityFields>) => ({
            id: record.id,
            name: record.fields.Name || '',
            description: record.fields.Description || '',
            date: record.fields.Date || '',
            time: record.fields.Time || '',
            location: record.fields.Location || '',
            url: record.fields.MoreinfoURL || record.fields.URL || '',
            image: record.fields.Image?.[0]?.url || '',
          }))
          .sort((a, b) => {
            // Sort by date first
            const dateComparison = (a.date || '').localeCompare(b.date || '');
            if (dateComparison !== 0) {
              return dateComparison;
            }
            // Then sort by time
            return (a.time || '').localeCompare(b.time || '');
          });

        app.logger.info({ count: activities.length }, 'Activities fetched and sorted successfully');
        return activities;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch activities');
        throw error;
      }
    }
  );
}
