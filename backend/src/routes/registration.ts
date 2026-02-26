import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { user, account, session } from '../db/auth-schema.js';
import { fetchAirtableAttendees, updateAirtableRecord, TABLES } from '../utils/airtable.js';

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
        // Fetch attendees from Airtable
        const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
          logger: app.logger,
        });

        // Check if email exists in attendees (case-insensitive)
        const attendee = attendeesData.records.find(
          (record) =>
            record.fields['Email']?.toLowerCase() === normalizedEmail
        );

        if (!attendee) {
          app.logger.info({ email: normalizedEmail }, 'Email not found in Airtable');
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
   * POST /api/registration/create-account - Create account with password
   */
  app.fastify.post(
    '/api/registration/create-account',
    {
      schema: {
        description: 'Create user account with password',
        tags: ['registration'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
            company: { type: 'string' },
            title: { type: 'string' },
            phone: { type: 'string' },
            linkedin: { type: 'string' },
          },
          required: ['email', 'password', 'name'],
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
      const { email, password, name, company, title, phone, linkedin } = request.body as {
        email: string;
        password: string;
        name: string;
        company?: string;
        title?: string;
        phone?: string;
        linkedin?: string;
      };

      const normalizedEmail = email.toLowerCase();

      app.logger.info({ email: normalizedEmail }, 'Creating account');

      try {
        // Validate password strength
        if (password.length < 8) {
          app.logger.warn({ email: normalizedEmail }, 'Password too weak');
          return reply.status(400).send({
            error: 'Password must be at least 8 characters long',
          });
        }

        // Check if user already exists
        const existingUser = await app.db
          .select()
          .from(user)
          .where(eq(user.email, normalizedEmail))
          .limit(1);

        // Fetch attendee details from Airtable if available
        let airtableData: any = {};
        let airtableRecordId: string | null = null;
        try {
          const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
            logger: app.logger,
          });

          const attendee = attendeesData.records.find(
            (record) =>
              record.fields['Email']?.toLowerCase() === normalizedEmail
          );

          if (attendee) {
            airtableRecordId = attendee.id;
            airtableData = {
              company: attendee.fields['Company'],
              title: attendee.fields['Job Title'],
              phone: attendee.fields['Phone'],
              linkedin: attendee.fields['LinkedIn'],
            };
          }
        } catch (airtableError) {
          app.logger.warn({ err: airtableError }, 'Failed to fetch Airtable data');
          // Continue without Airtable data
        }

        // If user already exists in DB, update their Airtable profile and return existing user with token
        if (existingUser.length > 0) {
          const existingUserData = existingUser[0];
          app.logger.info({ email: normalizedEmail }, 'User already exists in DB');

          // If attendee exists in Airtable, update their profile
          if (airtableRecordId) {
            try {
              app.logger.info({ airtableRecordId }, 'Updating Airtable attendee profile');

              const updateFields: any = {};
              if (name && name !== existingUserData.name) updateFields['First Name'] = name.split(' ')[0];
              if (name && name !== existingUserData.name) updateFields['Last Name'] = name.split(' ').slice(1).join(' ');
              if (company || existingUserData.company) updateFields['Company'] = company || existingUserData.company;
              if (title || existingUserData.title) updateFields['Job Title'] = title || existingUserData.title;
              if (phone || existingUserData.phone) updateFields['Phone'] = phone || existingUserData.phone;
              if (linkedin || existingUserData.linkedin) updateFields['LinkedIn'] = linkedin || existingUserData.linkedin;

              if (Object.keys(updateFields).length > 0) {
                await updateAirtableRecord(TABLES.ATTENDEES, airtableRecordId, updateFields, app.logger);
                app.logger.info({ airtableRecordId }, 'Airtable attendee profile updated');
              }
            } catch (updateError) {
              app.logger.warn({ err: updateError }, 'Failed to update Airtable profile, continuing');
              // Continue even if Airtable update fails
            }
          }

          // Create session for existing user
          const sessionToken = generateSessionToken();
          const sessionId = randomUUID();
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
            const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
            const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
            const cookieValue = `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secure}`;
            reply.header('Set-Cookie', cookieValue);
          } catch (sessionError) {
            app.logger.error({ err: sessionError, userId: existingUserData.id }, 'Failed to create session for existing user');
            // Continue with response even if session creation fails
          }

          // Return existing user data with token
          return reply.status(200).send({
            user: {
              id: existingUserData.id,
              email: existingUserData.email,
              name: existingUserData.name,
              company: existingUserData.company,
              title: existingUserData.title,
              phone: existingUserData.phone,
              emailVerified: existingUserData.emailVerified,
            },
            token: sessionToken,
          });
        }

        // Merge Airtable data with provided data (Airtable takes precedence)
        const finalCompany = airtableData.company || company || null;
        const finalTitle = airtableData.title || title || null;
        const finalPhone = airtableData.phone || phone || null;
        const finalLinkedin = airtableData.linkedin || linkedin || null;

        // Create user record
        const userId = randomUUID();
        const [newUser] = await app.db
          .insert(user)
          .values({
            id: userId,
            email: normalizedEmail,
            name,
            emailVerified: true,
            company: finalCompany,
            title: finalTitle,
            phone: finalPhone,
            linkedin: finalLinkedin,
            role: 'attendee',
          })
          .returning();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create account record with hashed password
        const accountId = randomUUID();
        await app.db
          .insert(account)
          .values({
            id: accountId,
            userId,
            accountId: normalizedEmail,
            providerId: 'credential',
            password: hashedPassword,
          });

        app.logger.info({ userId, email: normalizedEmail }, 'User and account created');

        // Update Airtable record with password if attendee exists
        if (airtableRecordId) {
          try {
            app.logger.info({ airtableRecordId }, 'Updating Airtable attendee with password');
            await updateAirtableRecord(
              TABLES.ATTENDEES,
              airtableRecordId,
              { 'Field 14': hashedPassword },
              app.logger
            );
            app.logger.info({ airtableRecordId }, 'Airtable attendee password updated');
          } catch (airtableError) {
            app.logger.warn({ err: airtableError }, 'Failed to save password to Airtable, continuing');
            // Continue even if Airtable update fails
          }
        }

        // Create session
        const sessionToken = generateSessionToken();
        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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

        app.logger.info({ userId, sessionId }, 'Session created');

        // Set the session cookie using Set-Cookie header for web clients
        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
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
            emailVerified: newUser.emailVerified,
          },
          token: sessionToken,
        });
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to create account'
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
          const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
            logger: app.logger,
          });

          const attendee = attendeesData.records.find(
            (record) =>
              record.fields['Email']?.toLowerCase() === email.toLowerCase()
          );

          if (attendee) {
            app.logger.info({ airtableRecordId: attendee.id }, 'Updating Airtable attendee with image');
            await updateAirtableRecord(
              TABLES.ATTENDEES,
              attendee.id,
              { Photo: imageUrl },
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
