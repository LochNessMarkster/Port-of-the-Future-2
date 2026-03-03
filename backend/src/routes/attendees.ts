import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, inArray } from 'drizzle-orm';
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
                email: { type: ['string', 'null'] },
                company: { type: ['string', 'null'] },
                title: { type: ['string', 'null'] },
                phone: { type: ['string', 'null'] },
                linkedin: { type: ['string', 'null'] },
                registrationLevel: { type: ['string', 'null'] },
                optInNetworking: { type: ['string', 'null'] },
                image: { type: ['string', 'null'] },
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

        // Extract email addresses from Airtable records to look up user sharing preferences
        const emailsToLookup = filteredRecords
          .map((record: AirtableRecord<AttendeeFields>) => record.fields.Email?.toLowerCase() || null)
          .filter((email) => email !== null);

        // Fetch user sharing preferences from database
        const userPreferences = emailsToLookup.length > 0
          ? await app.db
              .select()
              .from(authSchema.user)
              .where(inArray(authSchema.user.email, emailsToLookup))
          : [];

        // Create a map of email -> user preferences for quick lookup
        const preferencesMap = new Map(userPreferences.map((u) => [u.email.toLowerCase(), u]));

        const result = filteredRecords.map((record: AirtableRecord<AttendeeFields>) => {
          const firstName = record.fields['First Name'] || '';
          const lastName = record.fields['Last Name'] || '';
          const name = `${firstName} ${lastName}`.trim() || '';
          const email = record.fields.Email?.toLowerCase() || null;

          // Get user preferences for this email
          const userPrefs = email ? preferencesMap.get(email) : null;

          // Default to all sharing enabled if no user record found
          const shareEmail = userPrefs?.shareEmail ?? true;
          const sharePhone = userPrefs?.sharePhone ?? true;
          const shareLinkedIn = userPrefs?.shareLinkedIn ?? true;

          // Extract image URL from Airtable's Image field
          let imageUrl: string | null = null;
          if (record.fields.Image && Array.isArray(record.fields.Image) && record.fields.Image.length > 0) {
            imageUrl = record.fields.Image[0].url;
          }

          // Debug logging for name field
          if (!name || name.length === 0) {
            app.logger.warn(
              {
                attendeeId: record.id,
                email,
                firstName,
                lastName,
                hasFirstName: !!record.fields['First Name'],
                hasLastName: !!record.fields['Last Name'],
              },
              'Attendee has empty name field'
            );
          } else {
            app.logger.debug(
              {
                attendeeId: record.id,
                email,
                firstName,
                lastName,
                combinedName: name,
              },
              'Attendee name constructed'
            );
          }

          return {
            id: record.id,
            firstName,
            lastName,
            name,
            email: shareEmail ? (record.fields.Email || null) : null,
            company: record.fields.Company || null,
            title: record.fields['Job Title'] || null,
            phone: sharePhone ? (record.fields.Phone || null) : null,
            linkedin: shareLinkedIn ? (userPrefs?.linkedin || null) : null,
            registrationLevel: record.fields['Registration Level'] || null,
            optInNetworking: record.fields['Opt In Networking'] || null,
            image: imageUrl,
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

        // Generate signed URL for image if it exists
        let imageUrl: string | null = null;
        if (user.image) {
          try {
            const { url } = await app.storage.getSignedUrl(user.image);
            imageUrl = url;
            app.logger.debug(
              { attendeeId: id, imageKey: user.image, hasUrl: !!url },
              'Generated signed URL for profile image'
            );
          } catch (urlError) {
            app.logger.warn(
              { err: urlError, attendeeId: id, imageKey: user.image },
              'Failed to generate signed URL for image, returning null'
            );
            imageUrl = null;
          }
        } else {
          app.logger.debug({ attendeeId: id }, 'User has no profile image stored');
        }

        const result = {
          id: user.id,
          name: user.name || '',
          email: user.email,
          image: imageUrl,
          company: user.company || null,
          title: user.title || null,
          bio: user.bio || null,
          emailVerified: user.emailVerified,
        };

        app.logger.info(
          { attendeeId: id, name: result.name, email: result.email, hasImage: !!imageUrl },
          'Attendee profile fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error, attendeeId: id }, 'Failed to fetch attendee profile');
        throw error;
      }
    }
  );
}
