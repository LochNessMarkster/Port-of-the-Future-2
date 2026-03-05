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

// Extended fields to match your actual Airtable schema
interface FullAnnouncementFields {
  Title?: string;
  Content?: string;
  Alert?: boolean;
  Date?: string;
  Image?: Array<{ url: string; id: string; size: number; type: string }>;
  Time?: string;
  CreatedAt?: string;
}

export function registerAnnouncementsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/announcements - Get all announcements
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
                alert: { type: 'boolean' },
                date: { type: 'string' },
                time: { type: 'string' },
                image: { type: 'string' },
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
        const data = await fetchAirtableRecords<FullAnnouncementFields>(TABLES.ANNOUNCEMENTS, {
          logger: app.logger,
        });

        const announcements = data.records.map((record: AirtableRecord<FullAnnouncementFields>) => {
          const fields = record.fields;

          // Extract image URL from attachment array if present
          const imageUrl = Array.isArray(fields.Image) && fields.Image.length > 0
            ? fields.Image[0].url
            : null;

          return {
            id: record.id,
            title: fields.Title || '',
            content: fields.Content || '',
            alert: fields.Alert === true,
            date: fields.Date || '',
            time: fields.Time || '',
            image: imageUrl,
            createdAt: fields.CreatedAt || record.createdTime || new Date().toISOString(),
          };
        });

        // Sort by date descending (newest first)
        announcements.sort((a, b) => {
          const dateA = a.date || a.createdAt;
          const dateB = b.date || b.createdAt;
          return dateB.localeCompare(dateA);
        });

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
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (session.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { title, content } = request.body as { title: string; content: string };

      try {
        const record = await createAirtableRecord<any>(
          TABLES.ANNOUNCEMENTS,
          { Title: title, Content: content, CreatedAt: new Date().toISOString() },
          app.logger
        );

        return reply.status(201).send({
          id: record.id,
          title: record.fields.Title || '',
          content: record.fields.Content || '',
          alert: false,
          date: '',
          time: '',
          image: null,
          createdAt: record.fields.CreatedAt || new Date().toISOString(),
        });
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
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (session.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { id } = request.params as { id: string };
      const { title, content } = request.body as { title?: string; content?: string };

      try {
        const updateData: any = {};
        if (title !== undefined) updateData.Title = title;
        if (content !== undefined) updateData.Content = content;

        const record = await updateAirtableRecord<any>(TABLES.ANNOUNCEMENTS, id, updateData, app.logger);

        return {
          id: record.id,
          title: record.fields.Title || '',
          content: record.fields.Content || '',
          alert: record.fields.Alert === true,
          date: record.fields.Date || '',
          time: record.fields.Time || '',
          image: null,
          createdAt: record.fields.CreatedAt || new Date().toISOString(),
        };
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
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      if (session.user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { id } = request.params as { id: string };

      try {
        await deleteAirtableRecord(TABLES.ANNOUNCEMENTS, id, app.logger);
        return reply.status(204).send();
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to delete announcement');
        throw error;
      }
    }
  );
}