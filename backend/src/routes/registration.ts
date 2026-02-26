import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { resend } from '@specific-dev/framework';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import { emailVerifications } from '../db/schema.js';
import { user, session } from '../db/auth-schema.js';
import { fetchAirtableAttendees, TABLES } from '../utils/airtable.js';

// Generate a random 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function registerRegistrationRoutes(app: App) {
  /**
   * POST /api/registration/request-verification - Request email verification
   */
  app.fastify.post(
    '/api/registration/request-verification',
    {
      schema: {
        description: 'Request verification code for email',
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
              message: { type: 'string' },
              email: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { email } = request.body as { email: string };
      const normalizedEmail = email.toLowerCase();

      app.logger.info({ email: normalizedEmail }, 'Request verification initiated');

      try {
        // Fetch attendees from Airtable to verify email exists
        const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
          logger: app.logger,
        });

        // Check if email exists in attendees (case-insensitive)
        const attendee = attendeesData.records.find(
          (record) =>
            record.fields['Email']?.toLowerCase() === normalizedEmail
        );

        if (!attendee) {
          app.logger.warn(
            { email: normalizedEmail },
            'Email not found in Airtable attendees'
          );
          return reply.status(404).send({
            error: 'Email not found. Please use the email you registered with for the conference.',
          });
        }

        // Generate verification code
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save verification code to database
        await app.db
          .insert(emailVerifications)
          .values({
            email: normalizedEmail,
            code,
            verified: false,
            expiresAt,
          });

        // Send verification email
        const { error: emailError } = await resend.emails.send({
          from: 'Port of the Future 2026 <noreply@portofthefutureconference.com>',
          to: normalizedEmail,
          subject: 'Port of the Future 2026 - Verify Your Email',
          html: `
            <p>Welcome to Port of the Future 2026!</p>
            <p>Your verification code is: <strong>${code}</strong></p>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>See you at the conference!</p>
            <p>Port of the Future Team</p>
          `,
        });

        if (emailError) {
          app.logger.error(
            { err: emailError, email: normalizedEmail },
            'Failed to send verification email'
          );
          throw emailError;
        }

        app.logger.info(
          { email: normalizedEmail },
          'Verification code sent successfully'
        );

        return {
          message: 'Verification code sent to your email',
          email: normalizedEmail,
        };
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to request verification'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/registration/verify-code - Verify code and create/update user
   */
  app.fastify.post(
    '/api/registration/verify-code',
    {
      schema: {
        description: 'Verify code and authenticate user',
        tags: ['registration'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string' },
          },
          required: ['email', 'code'],
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
      const { email, code } = request.body as { email: string; code: string };
      const normalizedEmail = email.toLowerCase();

      app.logger.info({ email: normalizedEmail }, 'Verify code initiated');

      try {
        // Check verification code
        const verification = await app.db
          .select()
          .from(emailVerifications)
          .where(
            and(
              eq(emailVerifications.email, normalizedEmail),
              eq(emailVerifications.code, code)
            )
          )
          .limit(1);

        if (verification.length === 0) {
          app.logger.warn(
            { email: normalizedEmail },
            'Invalid verification code'
          );
          return reply.status(400).send({
            error: 'Invalid or expired verification code',
          });
        }

        const emailVerification = verification[0];

        // Check if code has expired
        if (new Date() > emailVerification.expiresAt) {
          app.logger.warn(
            { email: normalizedEmail },
            'Verification code expired'
          );
          return reply.status(400).send({
            error: 'Invalid or expired verification code',
          });
        }

        // Mark as verified
        await app.db
          .update(emailVerifications)
          .set({ verified: true })
          .where(eq(emailVerifications.id, emailVerification.id));

        // Fetch attendee details from Airtable
        const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
          logger: app.logger,
        });

        const attendee = attendeesData.records.find(
          (record) =>
            record.fields['Email']?.toLowerCase() === normalizedEmail
        );

        if (!attendee) {
          app.logger.error(
            { email: normalizedEmail },
            'Attendee not found after verification'
          );
          return reply.status(400).send({
            error: 'Attendee not found',
          });
        }

        const firstName = attendee.fields['First Name'] || '';
        const lastName = attendee.fields['Last Name'] || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Check if user already exists
        const existingUser = await app.db
          .select()
          .from(user)
          .where(eq(user.email, normalizedEmail))
          .limit(1);

        let newUser = existingUser[0];

        if (!newUser) {
          // Create new user
          const userId = randomUUID();
          const [created] = await app.db
            .insert(user)
            .values({
              id: userId,
              email: normalizedEmail,
              name: fullName || normalizedEmail,
              emailVerified: true,
              company: attendee.fields['Company'] || null,
              title: attendee.fields['Job Title'] || null,
              phone: attendee.fields['Phone'] || null,
              role: 'attendee',
            })
            .returning();

          newUser = created;
          app.logger.info({ userId: newUser.id, email: normalizedEmail }, 'User created successfully');
        } else {
          // Update existing user with Airtable data
          const [updated] = await app.db
            .update(user)
            .set({
              name: fullName || newUser.name,
              emailVerified: true,
              company: attendee.fields['Company'] || newUser.company,
              title: attendee.fields['Job Title'] || newUser.title,
              phone: attendee.fields['Phone'] || newUser.phone,
            })
            .where(eq(user.id, newUser.id))
            .returning();

          newUser = updated;
          app.logger.info({ userId: newUser.id, email: normalizedEmail }, 'User updated successfully');
        }

        // Create a Better Auth session for the user
        const sessionToken = generateSessionToken();
        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        try {
          await app.db
            .insert(session)
            .values({
              id: sessionId,
              token: sessionToken,
              userId: newUser.id,
              expiresAt,
              createdAt: new Date(),
              updatedAt: new Date(),
              ipAddress: request.ip || null,
              userAgent: request.headers['user-agent'] || null,
            });

          app.logger.info(
            { userId: newUser.id, sessionId },
            'Session created successfully'
          );

          // Set the session cookie using Set-Cookie header
          const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
          const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
          const cookieValue = `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${secure}`;
          reply.header('Set-Cookie', cookieValue);
        } catch (sessionError) {
          app.logger.error(
            { err: sessionError, userId: newUser.id },
            'Failed to create session, but user was created successfully'
          );
          // Continue even if session creation fails - user is still created
        }

        app.logger.info(
          { userId: newUser.id, email: normalizedEmail },
          'User verified and authenticated successfully'
        );

        return {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            company: newUser.company,
            title: newUser.title,
            phone: newUser.phone,
            emailVerified: newUser.emailVerified,
          },
        };
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to verify code'
        );
        throw error;
      }
    }
  );
}
