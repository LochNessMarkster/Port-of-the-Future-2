import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import { user, account, session } from '../db/auth-schema.js';
import { fetchAirtableCacheAttendees, updateAirtableRecord, TABLES } from '../utils/airtable.js';

// Shared password for all users
const SHARED_PASSWORD = 'POTF2026';

// Generate a session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function registerRegistrationRoutes(app: App) {
  /**
   * POST /api/registration/check-email - Check if email exists in Airtable
   */
  app.fastify.post(
    '/api/registration/check-email',
    {
      schema: {
        description: 'Check if email exists in Airtable and return attendee data',
        tags: ['registration'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
          required: ['email'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              exists: { type: 'boolean' },
              attendeeData: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  company: { type: 'string' },
                  title: { type: 'string' },
                  phone: { type: 'string' },
                  linkedin: { type: 'string' },
                  registrationLevel: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { email } = request.body as { email: string };
      const normalizedEmail = email.toLowerCase();

      app.logger.info({ email: normalizedEmail }, 'Checking email in Airtable');

      try {
        // Fetch attendees from Airtable Cache
        const attendeesData = await fetchAirtableCacheAttendees(
          'appkKjciinTlnsbkd',
          'tblIwt4FWHtNm01Z4',
          { logger: app.logger }
        );

        // Check if email exists in attendees (case-insensitive)
        const attendee = attendeesData.records.find(
          (record) =>
            record.fields['Email']?.toLowerCase() === normalizedEmail
        );

        if (!attendee) {
          app.logger.info({ email: normalizedEmail }, 'Email not found in Airtable Cache');
          return {
            exists: false,
          };
        }

        const firstName = attendee.fields['First Name'] || '';
        const lastName = attendee.fields['Last Name'] || '';

        app.logger.info({ email: normalizedEmail }, 'Email found in Airtable');

        return {
          exists: true,
          attendeeData: {
            firstName,
            lastName,
            company: attendee.fields['Company'] || '',
            title: attendee.fields['Job Title'] || '',
            phone: attendee.fields['Phone'] || '',
            linkedin: attendee.fields['LinkedIn'] || '',
            registrationLevel: attendee.fields['Registration Level'] || '',
          },
        };
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to check email'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/registration/create-account - Create account or login with email and password
   */
  app.fastify.post(
    '/api/registration/create-account',
    {
      schema: {
        description: 'Create user account or login with email and password',
        tags: ['registration'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  company: { type: ['string', 'null'] },
                  title: { type: ['string', 'null'] },
                  phone: { type: ['string', 'null'] },
                  registrationType: { type: ['string', 'null'] },
                  emailVerified: { type: 'boolean' },
                },
              },
              token: { type: 'string' },
            },
          },
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  company: { type: ['string', 'null'] },
                  title: { type: ['string', 'null'] },
                  phone: { type: ['string', 'null'] },
                  registrationType: { type: ['string', 'null'] },
                  emailVerified: { type: 'boolean' },
                },
              },
              token: { type: 'string' },
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
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const normalizedEmail = email.toLowerCase();

      app.logger.info({ email: normalizedEmail }, 'Creating account or logging in with email/password');

      try {
        // Check if user already exists
        const existingUserResult = await app.db
          .select()
          .from(user)
          .where(eq(user.email, normalizedEmail))
          .limit(1);

        // If user already exists, just create a new session
        if (existingUserResult.length > 0) {
          const existingUserData = existingUserResult[0];
          app.logger.info({ email: normalizedEmail, userId: existingUserData.id }, 'User already exists, creating new session');

          // Create session for existing user
          const sessionToken = generateSessionToken();
          const sessionId = randomUUID();
          const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

          try {
            await app.db
              .insert(session)
              .values({
                id: sessionId,
                token: sessionToken,
                userId: existingUserData.id,
                expiresAt,
                ipAddress: request.ip || null,
                userAgent: request.headers['user-agent'] || null,
              });

            app.logger.info({ userId: existingUserData.id, sessionId }, 'Session created for existing user');

            // Set the session cookie using Set-Cookie header for web clients
            const maxAge = 90 * 24 * 60 * 60; // 90 days in seconds
            const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
            const cookieValue = `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secure}`;
            reply.header('Set-Cookie', cookieValue);
          } catch (sessionError) {
            app.logger.error({ err: sessionError, userId: existingUserData.id }, 'Failed to create session for existing user');
            throw sessionError;
          }

          // Return existing user data with token
          app.logger.info({ email: normalizedEmail, userId: existingUserData.id }, 'Login completed successfully');
          return reply.status(200).send({
            user: {
              id: existingUserData.id,
              email: existingUserData.email,
              name: existingUserData.name,
              company: existingUserData.company,
              title: existingUserData.title,
              phone: existingUserData.phone,
              registrationType: existingUserData.registrationType,
              emailVerified: existingUserData.emailVerified,
            },
            token: sessionToken,
          });
        }

        // Create new user with email as name (fallback)
        const userId = randomUUID();
        const [newUser] = await app.db
          .insert(user)
          .values({
            id: userId,
            email: normalizedEmail,
            name: normalizedEmail,
            emailVerified: true,
            company: null,
            title: null,
            phone: null,
            registrationType: null,
            role: 'attendee',
          })
          .returning();

        app.logger.info({ userId, email: normalizedEmail }, 'User record created');

        // Create account record with provided password
        const accountId = randomUUID();
        await app.db
          .insert(account)
          .values({
            id: accountId,
            userId,
            accountId: normalizedEmail,
            providerId: 'credential',
            password,
          });

        app.logger.info({ userId, email: normalizedEmail }, 'Account record created');

        // Create session
        const sessionToken = generateSessionToken();
        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

        await app.db
          .insert(session)
          .values({
            id: sessionId,
            token: sessionToken,
            userId,
            expiresAt,
            ipAddress: request.ip || null,
            userAgent: request.headers['user-agent'] || null,
          });

        app.logger.info({ userId, sessionId }, 'Session created for new user');

        // Set the session cookie using Set-Cookie header for web clients
        const maxAge = 90 * 24 * 60 * 60; // 90 days in seconds
        const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
        const cookieValue = `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secure}`;
        reply.header('Set-Cookie', cookieValue);

        app.logger.info({ userId, email: normalizedEmail }, 'Account creation completed successfully');

        return reply.status(201).send({
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            company: newUser.company,
            title: newUser.title,
            phone: newUser.phone,
            registrationType: newUser.registrationType,
            emailVerified: newUser.emailVerified,
          },
          token: sessionToken,
        });
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to create account or login'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/registration/upload-profile-image - Upload profile image (requires authentication)
   */
  app.fastify.post(
    '/api/registration/upload-profile-image',
    {
      schema: {
        description: 'Upload profile image for authenticated user',
        tags: ['registration'],
        response: {
          200: {
            type: 'object',
            properties: {
              imageUrl: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
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
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const email = session.user.email;

      app.logger.info({ userId, email }, 'Uploading profile image');

      try {
        // Get the file from multipart form data
        const data = await request.file();
        if (!data) {
          app.logger.warn({ userId }, 'No image file provided');
          return reply.status(400).send({
            error: 'Image file is required',
          });
        }

        const file = data;
        const filename = file.filename;
        const buffer = await file.toBuffer();

        app.logger.info({ userId, filename, size: buffer.length }, 'Processing image file');

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (buffer.length > maxSize) {
          app.logger.warn({ userId, size: buffer.length }, 'Image file too large');
          return reply.status(400).send({
            error: 'Image file must be less than 10MB',
          });
        }

        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
          app.logger.warn({ userId, mimetype: file.mimetype }, 'Invalid image file type');
          return reply.status(400).send({
            error: 'Only JPEG, PNG, WebP, and GIF images are allowed',
          });
        }

        // Upload to storage
        const timestamp = Date.now();
        const storagePath = `profile-photos/${userId}/${timestamp}-${filename}`;

        const uploadedKey = await app.storage.upload(storagePath, buffer);

        app.logger.info({ userId, storagePath }, 'Image uploaded to storage');

        // Get signed URL for the image
        const { url: imageUrl } = await app.storage.getSignedUrl(uploadedKey);

        // Update user's image field in database
        await app.db
          .update(user)
          .set({ image: uploadedKey })
          .where(eq(user.id, userId));

        app.logger.info({ userId }, 'User image field updated in database');

        // Update Airtable attendee record with image URL if available
        try {
          const attendeesData = await fetchAirtableCacheAttendees(
            'appkKjciinTlnsbkd',
            'tblIwt4FWHtNm01Z4',
            { logger: app.logger }
          );

          const attendee = attendeesData.records.find(
            (record) =>
              record.fields['Email']?.toLowerCase() === email.toLowerCase()
          );

          if (attendee) {
            app.logger.info({ airtableRecordId: attendee.id }, 'Updating Airtable attendee with image');
            await updateAirtableRecord(
              TABLES.ATTENDEES,
              attendee.id,
              { Image: [{ url: imageUrl }] },
              app.logger
            );
            app.logger.info({ airtableRecordId: attendee.id }, 'Airtable attendee image updated');
          }
        } catch (airtableError) {
          app.logger.warn({ err: airtableError }, 'Failed to update Airtable with image, continuing');
          // Continue even if Airtable update fails
        }

        app.logger.info({ userId }, 'Profile image upload completed successfully');

        return {
          imageUrl,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId },
          'Failed to upload profile image'
        );
        throw error;
      }
    }
  );
}
