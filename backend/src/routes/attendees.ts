import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';

export function registerAttendeesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/attendees - Get attendees who opted-in to networking
   */
  app.fastify.get(
    '/api/attendees',
    {
      schema: {
        description: 'Get attendees who opted-in to networking',
        tags: ['attendees'],
        response: {
          200: {
            type: 'array',
            items: {
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
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching attendees for networking');

      try {
        // Fetch all users who opted in to networking
        const attendees = await app.db
          .select()
          .from(authSchema.user)
          .where(eq(authSchema.user.optInNetworking, true));

        const result = attendees.map((user) => ({
          id: user.id,
          name: user.name || '',
          email: user.email,
          image: user.image || null,
          company: user.company || null,
          title: user.title || null,
          bio: user.bio || null,
          emailVerified: user.emailVerified,
        }));

        app.logger.info({ count: result.length }, 'Attendees fetched');
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
