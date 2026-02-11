import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import {
  fetchAirtableRecord,
  TABLES,
  type SessionFields,
} from '../utils/airtable.js';

export function registerScheduleRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/schedule - Get user's bookmarked sessions
   */
  app.fastify.get(
    '/api/schedule',
    {
      schema: {
        description: "Get user's bookmarked sessions",
        tags: ['schedule'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                sessionId: { type: 'string' },
                title: { type: 'string' },
                speaker: { type: 'string' },
                room: { type: 'string' },
                type: { type: 'string' },
                date: { type: 'string' },
                time: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user schedule');

      try {
        const schedules = await app.db
          .select()
          .from(schema.userSchedules)
          .where(eq(schema.userSchedules.userId, session.user.id));

        // Fetch session details from Airtable
        const scheduledSessions = await Promise.all(
          schedules.map(async (schedule) => {
            try {
              const record = await fetchAirtableRecord<SessionFields>(
                TABLES.SESSIONS,
                schedule.sessionId
              );
              return {
                id: schedule.id,
                sessionId: schedule.sessionId,
                title: record.fields.Title || '',
                speaker: record.fields['Speaker(s)'] || '',
                room: record.fields.Room || '',
                type: record.fields['Type/Track'] || '',
                date: record.fields.Date || '',
                time: record.fields['Start Time'] || '',
                createdAt: schedule.createdAt.toISOString(),
              };
            } catch {
              app.logger.warn(
                { sessionId: schedule.sessionId },
                'Failed to fetch session details'
              );
              return null;
            }
          })
        );

        const result = scheduledSessions.filter((s) => s !== null);
        app.logger.info({ userId: session.user.id, count: result.length }, 'Schedule fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch schedule');
        throw error;
      }
    }
  );

  /**
   * POST /api/schedule - Add session to user's schedule
   */
  app.fastify.post(
    '/api/schedule',
    {
      schema: {
        description: "Add session to user's schedule",
        tags: ['schedule'],
        body: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
          required: ['sessionId'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              id: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { sessionId } = request.body as { sessionId: string };

      app.logger.info(
        { userId: session.user.id, sessionId },
        'Adding session to schedule'
      );

      try {
        // Check if already bookmarked
        const existing = await app.db
          .select()
          .from(schema.userSchedules)
          .where(
            and(
              eq(schema.userSchedules.userId, session.user.id),
              eq(schema.userSchedules.sessionId, sessionId)
            )
          );

        if (existing.length > 0) {
          return reply.status(409).send({
            error: 'Session already in schedule',
          });
        }

        const [created] = await app.db
          .insert(schema.userSchedules)
          .values({
            userId: session.user.id,
            sessionId,
          })
          .returning();

        app.logger.info(
          { userId: session.user.id, scheduleId: created.id },
          'Session added to schedule'
        );
        return reply.status(201).send({
          success: true,
          id: created.id,
        });
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, sessionId },
          'Failed to add session to schedule'
        );
        throw error;
      }
    }
  );

  /**
   * DELETE /api/schedule/:sessionId - Remove session from schedule
   */
  app.fastify.delete(
    '/api/schedule/:sessionId',
    {
      schema: {
        description: 'Remove session from schedule',
        tags: ['schedule'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
          required: ['sessionId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { sessionId } = request.params as { sessionId: string };

      app.logger.info(
        { userId: session.user.id, sessionId },
        'Removing session from schedule'
      );

      try {
        const deleted = await app.db
          .delete(schema.userSchedules)
          .where(
            and(
              eq(schema.userSchedules.userId, session.user.id),
              eq(schema.userSchedules.sessionId, sessionId)
            )
          )
          .returning();

        if (deleted.length === 0) {
          return reply.status(404).send({
            error: 'Session not found in schedule',
          });
        }

        app.logger.info({ userId: session.user.id, sessionId }, 'Session removed from schedule');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, sessionId },
          'Failed to remove session from schedule'
        );
        throw error;
      }
    }
  );
}
