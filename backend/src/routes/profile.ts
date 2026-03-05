import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerProfileRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/profile - Get current user profile
   */
  app.fastify.get(
    '/api/profile',
    {
      schema: {
        description: 'Get current user profile',
        tags: ['profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              company: { type: ['string', 'null'] },
              title: { type: ['string', 'null'] },
              phone: { type: ['string', 'null'] },
              registrationType: { type: ['string', 'null'] },
              image: { type: ['string', 'null'] },
              bio: { type: ['string', 'null'] },
              emailVerified: { type: ['boolean', 'null'] },
              role: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user profile');
      return session.user;
    }
  );

  /**
   * PUT /api/profile - Update user profile
   */
  app.fastify.put(
    '/api/profile',
    {
      schema: {
        description: 'Update user profile',
        tags: ['profile'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
            title: { type: 'string' },
            phone: { type: 'string' },
            image: { type: 'string' },
            bio: { type: 'string' },
            linkedin: { type: 'string' },
            optInNetworking: { type: 'boolean' },
          },
        },
        response: {
          200: {
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
              linkedin: { type: ['string', 'null'] },
              optInNetworking: { type: 'boolean' },
              emailVerified: { type: ['boolean', 'null'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { name, company, title, phone, image, bio, linkedin, optInNetworking } =
        request.body as {
          name?: string;
          company?: string;
          title?: string;
          phone?: string;
          image?: string;
          bio?: string;
          linkedin?: string;
          optInNetworking?: boolean;
        };

      app.logger.info(
        { userId: session.user.id, body: request.body },
        'Updating user profile'
      );

      try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (company !== undefined) updateData.company = company;
        if (title !== undefined) updateData.title = title;
        if (phone !== undefined) updateData.phone = phone;
        if (image !== undefined) updateData.image = image;
        if (bio !== undefined) updateData.bio = bio;
        if (linkedin !== undefined) updateData.linkedin = linkedin;
        if (optInNetworking !== undefined) updateData.optInNetworking = optInNetworking;

        // Use Better Auth's client to update user
        const response = await fetch('http://localhost/api/auth/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: request.headers.cookie || '',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          app.logger.error(
            { userId: session.user.id, status: response.status },
            'Failed to update user profile'
          );
          throw new Error('Failed to update profile');
        }

        const updatedUser = await response.json();
        app.logger.info({ userId: session.user.id }, 'User profile updated');
        return updatedUser;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to update user profile'
        );
        throw error;
      }
    }
  );
}
