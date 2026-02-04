import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as authSchema from '../db/auth-schema.js';

export function registerAdminRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/admin/users - Get all registered users (admin only)
   */
  app.fastify.get(
    '/api/admin/users',
    {
      schema: {
        description: 'Get all registered users (admin only)',
        tags: ['admin'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                company: { type: ['string', 'null'] },
                title: { type: ['string', 'null'] },
                phone: { type: ['string', 'null'] },
                image: { type: ['string', 'null'] },
                bio: { type: ['string', 'null'] },
                emailVerified: { type: ['boolean', 'null'] },
                role: { type: 'string' },
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

      // Check for admin role
      if (session.user.role !== 'admin') {
        app.logger.warn({ userId: session.user.id }, 'Unauthorized admin access attempt');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      app.logger.info('Fetching all registered users');

      try {
        const users = await app.db.select().from(authSchema.user);

        const result = users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name || '',
          company: user.company || null,
          title: user.title || null,
          phone: user.phone || null,
          image: user.image || null,
          bio: user.bio || null,
          emailVerified: user.emailVerified,
          role: user.role || 'attendee',
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        }));

        app.logger.info({ count: result.length }, 'Users fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch users');
        throw error;
      }
    }
  );
}
