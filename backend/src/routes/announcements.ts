import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  fetchAirtableRecords,
  TABLES,
  createAirtableRecord,
  updateAirtableRecord,
  deleteAirtableRecord,
  type AirtableRecord,
  type AnnouncementFields,
} from '../utils/airtable.js';

export function registerAnnouncementsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/announcements - Get all announcements (public)
   */
  app.fastify.get(
    '/api/announcements',
    {
      schema: {
        description: 'Get all announcements',
        tags: ['announcements'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
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

      app.logger.info('Fetching all announcements from Airtable');
      try {
        const data = await fetchAirtableRecords<AnnouncementFields>(TABLES.ANNOUNCEMENTS);

        const announcements = data.records.map((record: AirtableRecord<AnnouncementFields>) => ({
          id: record.id,
          title: record.fields.Title || '',
          content: record.fields.Content || '',
          createdAt: record.fields.CreatedAt || new Date().toISOString(),
        }));

        app.logger.info({ count: announcements.length }, 'Announcements fetched');
        return announcements;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch announcements');
        throw error;
      }
    }
  );

  /**
   * POST /api/admin/announcements - Create announcement (admin only)
   */
  app.fastify.post(
    '/api/admin/announcements',
    {
      schema: {
        description: 'Create a new announcement (admin only)',
        tags: ['announcements'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['title', 'content'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Check for admin role
      if (session.user.role !== 'admin') {
        app.logger.warn({ userId: session.user.id }, 'Unauthorized admin access attempt');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { title, content } = request.body as { title: string; content: string };

      app.logger.info({ userId: session.user.id, title }, 'Creating announcement');

      try {
        const record = await createAirtableRecord<AnnouncementFields>(TABLES.ANNOUNCEMENTS, {
          Title: title,
          Content: content,
          CreatedAt: new Date().toISOString(),
        });

        const result = {
          id: record.id,
          title: record.fields.Title || '',
          content: record.fields.Content || '',
          createdAt: record.fields.CreatedAt || new Date().toISOString(),
        };

        app.logger.info({ announcementId: record.id }, 'Announcement created');
        return reply.status(201).send(result);
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create announcement');
        throw error;
      }
    }
  );

  /**
   * PUT /api/admin/announcements/:id - Update announcement (admin only)
   */
  app.fastify.put(
    '/api/admin/announcements/:id',
    {
      schema: {
        description: 'Update announcement (admin only)',
        tags: ['announcements'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (session.user.role !== 'admin') {
        app.logger.warn({ userId: session.user.id }, 'Unauthorized admin access attempt');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { id } = request.params as { id: string };
      const { title, content } = request.body as { title?: string; content?: string };

      app.logger.info({ announcementId: id, userId: session.user.id }, 'Updating announcement');

      try {
        const updateData: Partial<AnnouncementFields> = {};
        if (title !== undefined) updateData.Title = title;
        if (content !== undefined) updateData.Content = content;

        const record = await updateAirtableRecord<AnnouncementFields>(
          TABLES.ANNOUNCEMENTS,
          id,
          updateData
        );

        const result = {
          id: record.id,
          title: record.fields.Title || '',
          content: record.fields.Content || '',
          createdAt: record.fields.CreatedAt || new Date().toISOString(),
        };

        app.logger.info({ announcementId: id }, 'Announcement updated');
        return result;
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to update announcement');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/admin/announcements/:id - Delete announcement (admin only)
   */
  app.fastify.delete(
    '/api/admin/announcements/:id',
    {
      schema: {
        description: 'Delete announcement (admin only)',
        tags: ['announcements'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          204: { description: 'Announcement deleted' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (session.user.role !== 'admin') {
        app.logger.warn({ userId: session.user.id }, 'Unauthorized admin access attempt');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { id } = request.params as { id: string };
      app.logger.info({ announcementId: id, userId: session.user.id }, 'Deleting announcement');

      try {
        await deleteAirtableRecord(TABLES.ANNOUNCEMENTS, id);
        app.logger.info({ announcementId: id }, 'Announcement deleted');
        return reply.status(204).send();
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to delete announcement');
        throw error;
      }
    }
  );
}
