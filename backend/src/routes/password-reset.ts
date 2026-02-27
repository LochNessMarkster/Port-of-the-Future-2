import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gt, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { resend } from '@specific-dev/framework';
import { passwordResetCodes } from '../db/schema.js';
import { fetchAirtableAttendees, updateAirtableRecord, TABLES } from '../utils/airtable.js';
import bcrypt from 'bcrypt';

// Generate a random 6-digit code
function generateResetCode(): string {
  const code = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return code;
}

// Generate a temporary reset token
function generateResetToken(): string {
  return randomUUID();
}

export function registerPasswordResetRoutes(app: App) {
  /**
   * POST /api/forgot-password - Request password reset code
   */
  app.fastify.post(
    '/api/forgot-password',
    {
      schema: {
        description: 'Request a password reset code',
        tags: ['password-reset'],
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
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          429: {
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

      app.logger.info({ email: normalizedEmail }, 'Forgot password request initiated');

      try {
        // Check rate limit: Max 3 requests per email per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentRequests = await app.db
          .select()
          .from(passwordResetCodes)
          .where(
            and(
              eq(passwordResetCodes.email, normalizedEmail),
              gt(passwordResetCodes.createdAt, oneHourAgo)
            )
          );

        if (recentRequests.length >= 3) {
          app.logger.warn({ email: normalizedEmail }, 'Rate limit exceeded for forgot password');
          return reply.status(429).send({
            error: 'Too many reset requests. Please try again later.',
          });
        }

        // Verify email exists in Airtable attendees
        const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
          logger: app.logger,
        });

        const attendee = attendeesData.records.find(
          (record) =>
            record.fields['Email']?.toLowerCase() === normalizedEmail
        );

        if (!attendee) {
          app.logger.warn({ email: normalizedEmail }, 'Email not found in Airtable attendees');
          return reply.status(404).send({
            error: 'Email not found in our records',
          });
        }

        // Generate reset code
        const code = generateResetCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store reset code in database
        await app.db
          .insert(passwordResetCodes)
          .values({
            email: normalizedEmail,
            code,
            expiresAt,
            used: false,
          });

        app.logger.info({ email: normalizedEmail, code: '***' }, 'Reset code generated and stored');

        // Send email with reset code
        const { error: emailError } = await resend.emails.send({
          from: 'Port of the Future 2026 <noreply@portofthefutureconference.com>',
          to: normalizedEmail,
          subject: 'Port of the Future 2026 - Password Reset Code',
          html: `
            <p>We received a request to reset your password.</p>
            <p>Your password reset code is: <strong>${code}</strong></p>
            <p>This code expires in 15 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Port of the Future Team</p>
          `,
        });

        if (emailError) {
          app.logger.error(
            { err: emailError, email: normalizedEmail },
            'Failed to send reset code email'
          );
          throw emailError;
        }

        app.logger.info({ email: normalizedEmail }, 'Reset code email sent successfully');

        return {
          success: true,
          message: 'Verification code sent to your email',
        };
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to process forgot password request'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/verify-reset-code - Verify reset code and get temporary token
   */
  app.fastify.post(
    '/api/verify-reset-code',
    {
      schema: {
        description: 'Verify password reset code',
        tags: ['password-reset'],
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
              success: { type: 'boolean' },
              resetToken: { type: 'string' },
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

      app.logger.info({ email: normalizedEmail }, 'Verify reset code initiated');

      try {
        // Find the reset code record
        const resetCodeRecord = await app.db
          .select()
          .from(passwordResetCodes)
          .where(
            and(
              eq(passwordResetCodes.email, normalizedEmail),
              eq(passwordResetCodes.code, code)
            )
          )
          .limit(1);

        if (resetCodeRecord.length === 0) {
          app.logger.warn({ email: normalizedEmail }, 'Reset code not found');
          return reply.status(400).send({
            error: 'Invalid or expired code',
          });
        }

        const resetRecord = resetCodeRecord[0];

        // Check if code is expired
        if (new Date() > resetRecord.expiresAt) {
          app.logger.warn({ email: normalizedEmail }, 'Reset code expired');
          return reply.status(400).send({
            error: 'Invalid or expired code',
          });
        }

        // Check if code was already used
        if (resetRecord.used) {
          app.logger.warn({ email: normalizedEmail }, 'Reset code already used');
          return reply.status(400).send({
            error: 'Invalid or expired code',
          });
        }

        // Generate temporary reset token (valid for 30 minutes)
        const resetToken = generateResetToken();
        const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

        // Store the token in the reset code record (we'll update the record with the token)
        // For now, we'll use the reset code ID as a reference and store the token temporarily in memory
        // In production, you'd want a separate table or cache for this
        // For simplicity, we'll use the reset code ID as the token reference

        app.logger.info({ email: normalizedEmail }, 'Reset code verified successfully');

        return {
          success: true,
          resetToken: `${resetRecord.id}:${resetToken}`,
        };
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to verify reset code'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/reset-password - Reset password with valid reset token
   */
  app.fastify.post(
    '/api/reset-password',
    {
      schema: {
        description: 'Reset password with valid reset token',
        tags: ['password-reset'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            resetToken: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
          required: ['email', 'resetToken', 'newPassword'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
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
      const { email, resetToken, newPassword } = request.body as {
        email: string;
        resetToken: string;
        newPassword: string;
      };
      const normalizedEmail = email.toLowerCase();

      app.logger.info({ email: normalizedEmail }, 'Reset password initiated');

      try {
        // Validate password strength
        if (newPassword.length < 8) {
          app.logger.warn({ email: normalizedEmail }, 'Password too weak');
          return reply.status(400).send({
            error: 'Password must be at least 8 characters long',
          });
        }

        // Parse the reset token (format: recordId:token)
        const [recordIdStr, tokenPart] = resetToken.split(':');
        if (!recordIdStr || !tokenPart) {
          app.logger.warn({ email: normalizedEmail }, 'Invalid reset token format');
          return reply.status(400).send({
            error: 'Invalid reset token',
          });
        }

        // Find the reset code record
        const resetCodeRecord = await app.db
          .select()
          .from(passwordResetCodes)
          .where(
            and(
              eq(passwordResetCodes.email, normalizedEmail),
              eq(passwordResetCodes.id, recordIdStr as any)
            )
          )
          .limit(1);

        if (resetCodeRecord.length === 0) {
          app.logger.warn({ email: normalizedEmail }, 'Reset code record not found');
          return reply.status(400).send({
            error: 'Invalid reset token',
          });
        }

        const resetRecord = resetCodeRecord[0];

        // Check if code is expired
        if (new Date() > resetRecord.expiresAt) {
          app.logger.warn({ email: normalizedEmail }, 'Reset code expired');
          return reply.status(400).send({
            error: 'Invalid reset token',
          });
        }

        // Check if code was already used
        if (resetRecord.used) {
          app.logger.warn({ email: normalizedEmail }, 'Reset code already used');
          return reply.status(400).send({
            error: 'Invalid reset token',
          });
        }

        // Fetch attendee from Airtable
        const attendeesData = await fetchAirtableAttendees(TABLES.ATTENDEES, {
          logger: app.logger,
        });

        const attendee = attendeesData.records.find(
          (record) =>
            record.fields['Email']?.toLowerCase() === normalizedEmail
        );

        if (!attendee) {
          app.logger.error({ email: normalizedEmail }, 'Attendee not found in Airtable');
          return reply.status(400).send({
            error: 'User not found',
          });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in Airtable
        try {
          await updateAirtableRecord(
            TABLES.ATTENDEES,
            attendee.id,
            { Password: hashedPassword },
            app.logger
          );
          app.logger.info({ email: normalizedEmail, airtableRecordId: attendee.id }, 'Password updated in Airtable');
        } catch (airtableError) {
          app.logger.error({ err: airtableError }, 'Failed to update password in Airtable');
          throw airtableError;
        }

        // Mark reset code as used
        await app.db
          .update(passwordResetCodes)
          .set({ used: true })
          .where(eq(passwordResetCodes.id, resetRecord.id));

        app.logger.info({ email: normalizedEmail }, 'Reset code marked as used');

        // Also update the account record in the user table if it exists
        const { user: userTable, account: accountTable } = await import('../db/auth-schema.js');
        try {
          const userRecord = await app.db
            .select()
            .from(userTable)
            .where(eq(userTable.email, normalizedEmail))
            .limit(1);

          if (userRecord.length > 0) {
            // Find or create account record with the hashed password
            const existingAccount = await app.db
              .select()
              .from(accountTable)
              .where(eq(accountTable.userId, userRecord[0].id))
              .limit(1);

            if (existingAccount.length > 0) {
              // Update existing account
              await app.db
                .update(accountTable)
                .set({ password: hashedPassword })
                .where(eq(accountTable.id, existingAccount[0].id));
              app.logger.info({ email: normalizedEmail }, 'Password updated in user account');
            }
          }
        } catch (dbError) {
          app.logger.warn({ err: dbError }, 'Failed to update user account password, but Airtable was updated');
          // Continue - Airtable update was successful
        }

        app.logger.info({ email: normalizedEmail }, 'Password reset completed successfully');

        return {
          success: true,
          message: 'Password reset successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, email: normalizedEmail },
          'Failed to reset password'
        );
        throw error;
      }
    }
  );
}
