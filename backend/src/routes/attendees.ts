import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';
import {
  fetchAirtableAttendees,
  TABLES,
  type AirtableRecord,
  type AttendeeFields,
} from '../utils/airtable.js';

export function registerAttendeesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/attendees - Get attendees who opted-in to networking
   */
  app.fastify.get(
    '/api/attendees',
    {
      schema: {
        description: 'Get all conference attendees who opted in to networking',
        tags: ['attendees'],
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
                email: { type: 'string' },
                company: { type: ['string', 'null'] },
                title: { type: ['string', 'null'] },
                phone: { type: ['string', 'null'] },
                registrationLevel: { type: ['string', 'null'] },
                optInNetworking: { type: ['string', 'null'] },
                image: { type: 'null' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching attendees from Airtable');

      try {
        const data = await fetchAirtableAttendees(TABLES.ATTENDEES, {
          logger: app.logger,
        });

        // Filter attendees who opted in to networking
        const filteredRecords = data.records.filter((record: AirtableRecord<AttendeeFields>) => {
          const optInNetworking = record.fields['Opt In Networking'];
          const isOptedIn = optInNetworking === 'YES';

          if (!isOptedIn) {
            app.logger.debug(
              { attendeeId: record.id, optInNetworking, name: `${record.fields['First Name']} ${record.fields['Last Name']}` },
              'Attendee excluded (Opt In Networking != YES)'
            );
          }

          return isOptedIn;
        });

        const result = filteredRecords.map((record: AirtableRecord<AttendeeFields>) => {
          const firstName = record.fields['First Name'] || '';
          const lastName = record.fields['Last Name'] || '';
          const name = `${firstName} ${lastName}`.trim() || '';

          return {
            id: record.id,
            firstName,
            lastName,
            name,
            email: record.fields.Email || '',
            company: record.fields.Company || null,
            title: record.fields['Job Title'] || null,
            phone: record.fields.Phone || null,
            registrationLevel: record.fields['Registration Level'] || null,
            optInNetworking: record.fields['Opt In Networking'] || null,
            image: null,
          };
        });

        app.logger.info(
          { totalFetched: data.records.length, optedInCount: result.length },
          'Attendees fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch attendees');
        throw error;
      }
    }
  );

  /**
   * GET /api/attendees/:id - Get attendee profile
   */
  app.fastify.get(
    '/api/attendees/:id',
    {
      schema: {
        description: 'Get attendee profile',
        tags: ['attendees'],
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
              email: { type: 'string' },
              image: { type: ['string', 'null'] },
              company: { type: ['string', 'null'] },
              title: { type: ['string', 'null'] },
              bio: { type: ['string', 'null'] },
              emailVerified: { type: ['boolean', 'null'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ attendeeId: id }, 'Fetching attendee profile');

      try {
        const attendee = await app.db
          .select()
          .from(authSchema.user)
          .where(eq(authSchema.user.id, id));

        if (attendee.length === 0) {
          return reply.status(404).send({
            error: 'Attendee not found',
          });
        }

        const user = attendee[0];
        const result = {
          id: user.id,
          name: user.name || '',
          email: user.email,
          image: user.image || null,
          company: user.company || null,
          title: user.title || null,
          bio: user.bio || null,
          emailVerified: user.emailVerified,
        };

        app.logger.info({ attendeeId: id }, 'Attendee profile fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, attendeeId: id }, 'Failed to fetch attendee profile');
        throw error;
      }
    }
  );
}
