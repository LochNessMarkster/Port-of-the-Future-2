import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import { floorPlans } from '../db/schema.js';

export function registerFloorPlanRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/floor-plan - Get the most recent floor plan
   */
  app.fastify.get(
    '/api/floor-plan',
    {
      schema: {
        description: 'Get the most recent floor plan',
        tags: ['floor-plan'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              imageUrl: { type: 'string' },
              description: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
            },
          },
          204: { description: 'No floor plan found' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching most recent floor plan');
      try {
        const result = await app.db
          .select()
          .from(floorPlans)
          .orderBy(desc(floorPlans.createdAt))
          .limit(1);

        if (result.length === 0) {
          app.logger.info('No floor plan found');
          return reply.status(204).send();
        }

        const floorPlan = result[0];

        // Generate signed URL for the image
        const { url: imageUrl } = await app.storage.getSignedUrl(floorPlan.imageUrl);

        const response = {
          id: floorPlan.id,
          imageUrl,
          description: floorPlan.description || null,
          createdAt: floorPlan.createdAt.toISOString(),
        };

        app.logger.info({ floorPlanId: floorPlan.id }, 'Floor plan retrieved successfully');
        return response;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch floor plan');
        throw error;
      }
    }
  );

  /**
   * POST /api/floor-plan/upload - Upload a floor plan (admin only)
   */
  app.fastify.post(
    '/api/floor-plan/upload',
    {
      schema: {
        description: 'Upload a floor plan (admin only)',
        tags: ['floor-plan'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              imageUrl: { type: 'string' },
              description: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Check for admin role
      if (session.user.role !== 'admin') {
        app.logger.warn({ userId: session.user.id }, 'Unauthorized floor plan upload attempt');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      app.logger.info({ userId: session.user.id }, 'Processing floor plan upload');

      try {
        const data = await request.file({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
        if (!data) {
          app.logger.warn({ userId: session.user.id }, 'No image file provided');
          return reply.status(400).send({ error: 'No image file provided' });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.error({ err, userId: session.user.id }, 'File upload size exceeded');
          return reply.status(413).send({ error: 'File too large' });
        }

        // Upload to storage
        const key = `floor-plans/${Date.now()}-${data.filename}`;
        const uploadedKey = await app.storage.upload(key, buffer);

        // Create floor plan record in database
        const [floorPlan] = await app.db
          .insert(floorPlans)
          .values({
            imageUrl: uploadedKey,
            description: null,
            uploadedBy: session.user.id,
          })
          .returning();

        // Generate signed URL
        const { url: imageUrl } = await app.storage.getSignedUrl(uploadedKey);

        const response = {
          id: floorPlan.id,
          imageUrl,
          description: floorPlan.description || null,
          createdAt: floorPlan.createdAt.toISOString(),
        };

        app.logger.info(
          { floorPlanId: floorPlan.id, userId: session.user.id },
          'Floor plan uploaded successfully'
        );
        return response;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload floor plan');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/floor-plan/:id - Delete a floor plan (admin only)
   */
  app.fastify.delete(
    '/api/floor-plan/:id',
    {
      schema: {
        description: 'Delete a floor plan (admin only)',
        tags: ['floor-plan'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
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
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Check for admin role
      if (session.user.role !== 'admin') {
        app.logger.warn({ userId: session.user.id }, 'Unauthorized floor plan delete attempt');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { id } = request.params as { id: string };
      app.logger.info({ floorPlanId: id, userId: session.user.id }, 'Deleting floor plan');

      try {
        // Get the floor plan to retrieve the storage key
        const floorPlan = await app.db
          .select()
          .from(floorPlans)
          .where(eq(floorPlans.id, id))
          .limit(1);

        if (floorPlan.length === 0) {
          app.logger.warn({ floorPlanId: id, userId: session.user.id }, 'Floor plan not found');
          return reply.status(404).send({ error: 'Floor plan not found' });
        }

        // Delete from storage
        await app.storage.delete(floorPlan[0].imageUrl);

        // Delete from database
        await app.db.delete(floorPlans).where(eq(floorPlans.id, id));

        app.logger.info(
          { floorPlanId: id, userId: session.user.id },
          'Floor plan deleted successfully'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, floorPlanId: id, userId: session.user.id },
          'Failed to delete floor plan'
        );
        throw error;
      }
    }
  );
}
