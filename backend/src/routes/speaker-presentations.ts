import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerSpeakerPresentationsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/speaker-presentations - Get all presentations
   */
  app.fastify.get(
    '/api/speaker-presentations',
    {
      schema: {
        description: 'Get all speaker presentations',
        tags: ['speaker-presentations'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                speakerId: { type: 'string' },
                speakerName: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                fileUrl: { type: 'string' },
                fileName: { type: 'string' },
                fileSize: { type: 'integer' },
                uploadedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all speaker presentations');
      try {
        const presentations = await app.db
          .select()
          .from(schema.speakerPresentations)
          .orderBy(schema.speakerPresentations.uploadedAt);

        const result = presentations.map((p) => ({
          id: p.id,
          speakerId: p.speakerId,
          speakerName: p.speakerName,
          title: p.title,
          description: p.description || '',
          fileUrl: p.fileUrl,
          fileName: p.fileName,
          fileSize: p.fileSize || 0,
          uploadedAt: p.uploadedAt.toISOString(),
        }));

        app.logger.info({ count: result.length }, 'Presentations fetched successfully');
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch presentations');
        throw error;
      }
    }
  );

  /**
   * GET /api/speaker-presentations/:id - Get single presentation
   */
  app.fastify.get(
    '/api/speaker-presentations/:id',
    {
      schema: {
        description: 'Get presentation details',
        tags: ['speaker-presentations'],
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
              speakerId: { type: 'string' },
              speakerName: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              fileUrl: { type: 'string' },
              fileName: { type: 'string' },
              fileSize: { type: 'integer' },
              uploadedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ presentationId: id }, 'Fetching presentation details');

      try {
        const presentation = await app.db
          .select()
          .from(schema.speakerPresentations)
          .where(eq(schema.speakerPresentations.id, id));

        if (!presentation || presentation.length === 0) {
          app.logger.warn({ presentationId: id }, 'Presentation not found');
          return reply.status(404).send({ error: 'Presentation not found' });
        }

        const p = presentation[0];
        const result = {
          id: p.id,
          speakerId: p.speakerId,
          speakerName: p.speakerName,
          title: p.title,
          description: p.description || '',
          fileUrl: p.fileUrl,
          fileName: p.fileName,
          fileSize: p.fileSize || 0,
          uploadedAt: p.uploadedAt.toISOString(),
        };

        app.logger.info({ presentationId: id }, 'Presentation details fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, presentationId: id }, 'Failed to fetch presentation');
        throw error;
      }
    }
  );

  /**
   * POST /api/speaker-presentations/upload - Upload a presentation
   */
  app.fastify.post(
    '/api/speaker-presentations/upload',
    {
      schema: {
        description: 'Upload a speaker presentation',
        tags: ['speaker-presentations'],
        consumes: ['multipart/form-data'],
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              speakerId: { type: 'string' },
              speakerName: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              fileUrl: { type: 'string' },
              fileName: { type: 'string' },
              fileSize: { type: 'integer' },
              uploadedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Uploading speaker presentation');
      try {
        const data = await request.file();

        if (!data) {
          app.logger.warn('No file provided in upload request');
          return reply.status(400).send({ error: 'No file provided' });
        }

        const { speakerId, speakerName, title, description } = data.fields as any;

        if (!speakerId || !speakerName || !title || !data.filename) {
          app.logger.warn({ speakerId, speakerName, title }, 'Missing required fields');
          return reply.status(400).send({ error: 'Missing required fields' });
        }

        // Convert file stream to buffer
        const buffer = await data.toBuffer();

        // Upload to storage and get URL
        // TODO: Integrate with storage provider (S3, etc.)
        const fileName = `${Date.now()}-${data.filename}`;
        const fileUrl = `https://storage.example.com/presentations/${fileName}`;

        // Save to database
        const [created] = await app.db
          .insert(schema.speakerPresentations)
          .values({
            speakerId: String(speakerId),
            speakerName: String(speakerName),
            title: String(title),
            description: description ? String(description) : null,
            fileUrl,
            fileName: data.filename,
            fileSize: buffer.length,
          })
          .returning();

        app.logger.info(
          { presentationId: created.id, speakerId, fileName: data.filename },
          'Presentation uploaded successfully'
        );

        return reply.status(201).send({
          id: created.id,
          speakerId: created.speakerId,
          speakerName: created.speakerName,
          title: created.title,
          description: created.description || '',
          fileUrl: created.fileUrl,
          fileName: created.fileName,
          fileSize: created.fileSize || 0,
          uploadedAt: created.uploadedAt.toISOString(),
        });
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to upload presentation');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/speaker-presentations/:id - Delete presentation
   */
  app.fastify.delete(
    '/api/speaker-presentations/:id',
    {
      schema: {
        description: 'Delete a speaker presentation',
        tags: ['speaker-presentations'],
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
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ presentationId: id }, 'Deleting presentation');

      try {
        const deleted = await app.db
          .delete(schema.speakerPresentations)
          .where(eq(schema.speakerPresentations.id, id))
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ presentationId: id }, 'Presentation not found for deletion');
          return reply.status(404).send({ error: 'Presentation not found' });
        }

        app.logger.info({ presentationId: id }, 'Presentation deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, presentationId: id }, 'Failed to delete presentation');
        throw error;
      }
    }
  );
}
