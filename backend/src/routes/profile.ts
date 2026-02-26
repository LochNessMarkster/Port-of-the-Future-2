import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { user } from '../db/auth-schema.js';

export function registerProfileRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/profile/upload-photo - Upload user profile photo
   */
  app.fastify.post(
    '/api/profile/upload-photo',
    {
      schema: {
        description: 'Upload user profile photo',
        tags: ['profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Processing profile photo upload');

      try {
        const data = await request.file({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
        if (!data) {
          app.logger.warn({ userId }, 'No photo file provided');
          return reply.status(400).send({ error: 'No photo file provided' });
        }

        let buffer: Buffer;
        try {
          buffer = await data.toBuffer();
        } catch (err) {
          app.logger.error({ err, userId }, 'File upload size exceeded');
          return reply.status(413).send({ error: 'File too large' });
        }

        // Upload to storage
        const key = `profile-photos/${userId}/${Date.now()}-${data.filename}`;
        const uploadedKey = await app.storage.upload(key, buffer);

        // Get signed URL
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Update user profile image
        await app.db
          .update(user)
          .set({ image: uploadedKey })
          .where(eq(user.id, userId));

        app.logger.info(
          { userId, photoKey: uploadedKey },
          'Profile photo uploaded successfully'
        );

        return { url };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to upload profile photo');
        throw error;
      }
    }
  );

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
              image: { type: ['string', 'null'] },
              bio: { type: ['string', 'null'] },
              linkedin: { type: ['string', 'null'] },
              emailVerified: { type: 'boolean' },
              optInNetworking: { type: 'boolean' },
              shareEmail: { type: 'boolean' },
              sharePhone: { type: 'boolean' },
              shareLinkedIn: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching user profile');

      try {
        const userProfile = await app.db
          .select()
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        if (userProfile.length === 0) {
          app.logger.warn({ userId }, 'User not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        const profile = userProfile[0];
        let imageUrl = profile.image;

        // Generate signed URL for image if it exists
        if (imageUrl) {
          try {
            const { url } = await app.storage.getSignedUrl(imageUrl);
            imageUrl = url;
          } catch (err) {
            app.logger.debug({ err, userId }, 'Could not generate signed URL for image');
          }
        }

        app.logger.info({ userId }, 'User profile retrieved successfully');

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          company: profile.company,
          title: profile.title,
          phone: profile.phone,
          image: imageUrl || null,
          bio: profile.bio,
          linkedin: profile.linkedin,
          emailVerified: profile.emailVerified,
          optInNetworking: profile.optInNetworking,
          shareEmail: profile.shareEmail,
          sharePhone: profile.sharePhone,
          shareLinkedIn: profile.shareLinkedIn,
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch user profile');
        throw error;
      }
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
            shareEmail: { type: 'boolean' },
            sharePhone: { type: 'boolean' },
            shareLinkedIn: { type: 'boolean' },
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
              shareEmail: { type: 'boolean' },
              sharePhone: { type: 'boolean' },
              shareLinkedIn: { type: 'boolean' },
              emailVerified: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { name, company, title, phone, image, bio, linkedin, optInNetworking, shareEmail, sharePhone, shareLinkedIn } =
        request.body as {
          name?: string;
          company?: string;
          title?: string;
          phone?: string;
          image?: string;
          bio?: string;
          linkedin?: string;
          optInNetworking?: boolean;
          shareEmail?: boolean;
          sharePhone?: boolean;
          shareLinkedIn?: boolean;
        };

      app.logger.info(
        { userId, body: request.body },
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
        if (shareEmail !== undefined) updateData.shareEmail = shareEmail;
        if (sharePhone !== undefined) updateData.sharePhone = sharePhone;
        if (shareLinkedIn !== undefined) updateData.shareLinkedIn = shareLinkedIn;

        const [updated] = await app.db
          .update(user)
          .set(updateData)
          .where(eq(user.id, userId))
          .returning();

        app.logger.info({ userId }, 'User profile updated successfully');

        return {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          company: updated.company,
          title: updated.title,
          phone: updated.phone,
          image: updated.image,
          bio: updated.bio,
          linkedin: updated.linkedin,
          optInNetworking: updated.optInNetworking,
          shareEmail: updated.shareEmail,
          sharePhone: updated.sharePhone,
          shareLinkedIn: updated.shareLinkedIn,
          emailVerified: updated.emailVerified,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to update user profile'
        );
        throw error;
      }
    }
  );
}
