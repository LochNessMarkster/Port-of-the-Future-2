import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, or, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';

export function registerMessagesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/messages - Get user's message threads
   */
  app.fastify.get(
    '/api/messages',
    {
      schema: {
        description: "Get user's message threads",
        tags: ['messages'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                senderId: { type: 'string' },
                senderName: { type: 'string' },
                recipientId: { type: 'string' },
                recipientName: { type: 'string' },
                content: { type: 'string' },
                read: { type: 'boolean' },
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

      app.logger.info({ userId: session.user.id }, 'Fetching user messages');

      try {
        const messages = await app.db
          .select()
          .from(schema.messages)
          .where(
            or(
              eq(schema.messages.senderId, session.user.id),
              eq(schema.messages.recipientId, session.user.id)
            )
          );

        // Fetch sender and recipient details
        const result = await Promise.all(
          messages.map(async (message) => {
            let senderName = '';
            let recipientName = '';

            if (message.senderId === session.user.id) {
              senderName = session.user.name || '';
              const recipients = await app.db
                .select()
                .from(authSchema.user)
                .where(eq(authSchema.user.id, message.recipientId));
              recipientName = recipients[0]?.name || '';
            } else {
              const senders = await app.db
                .select()
                .from(authSchema.user)
                .where(eq(authSchema.user.id, message.senderId));
              senderName = senders[0]?.name || '';
              recipientName = session.user.name || '';
            }

            return {
              id: message.id,
              senderId: message.senderId,
              senderName,
              recipientId: message.recipientId,
              recipientName,
              content: message.content,
              read: message.read,
              createdAt: message.createdAt.toISOString(),
            };
          })
        );

        app.logger.info({ userId: session.user.id, count: result.length }, 'Messages fetched');
        return result;
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch messages');
        throw error;
      }
    }
  );

  /**
   * GET /api/messages/:userId - Get conversation with specific user
   */
  app.fastify.get(
    '/api/messages/:userId',
    {
      schema: {
        description: 'Get conversation with specific user',
        tags: ['messages'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                senderId: { type: 'string' },
                recipientId: { type: 'string' },
                content: { type: 'string' },
                read: { type: 'boolean' },
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

      const { userId } = request.params as { userId: string };
      app.logger.info({ currentUserId: session.user.id, otherUserId: userId }, 'Fetching conversation');

      try {
        const messages = await app.db
          .select()
          .from(schema.messages)
          .where(
            or(
              and(
                eq(schema.messages.senderId, session.user.id),
                eq(schema.messages.recipientId, userId)
              ),
              and(
                eq(schema.messages.senderId, userId),
                eq(schema.messages.recipientId, session.user.id)
              )
            )
          );

        const result = messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          content: message.content,
          read: message.read,
          createdAt: message.createdAt.toISOString(),
        }));

        app.logger.info({ currentUserId: session.user.id, count: result.length }, 'Conversation fetched');
        return result;
      } catch (error) {
        app.logger.error(
          { err: error, currentUserId: session.user.id, otherUserId: userId },
          'Failed to fetch conversation'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/messages - Send message
   */
  app.fastify.post(
    '/api/messages',
    {
      schema: {
        description: 'Send message',
        tags: ['messages'],
        body: {
          type: 'object',
          properties: {
            recipientId: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['recipientId', 'content'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              senderId: { type: 'string' },
              recipientId: { type: 'string' },
              content: { type: 'string' },
              read: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { recipientId, content } = request.body as {
        recipientId: string;
        content: string;
      };

      app.logger.info(
        { senderId: session.user.id, recipientId },
        'Sending message'
      );

      try {
        const [created] = await app.db
          .insert(schema.messages)
          .values({
            senderId: session.user.id,
            recipientId,
            content,
          })
          .returning();

        const result = {
          id: created.id,
          senderId: created.senderId,
          recipientId: created.recipientId,
          content: created.content,
          read: created.read,
          createdAt: created.createdAt.toISOString(),
        };

        app.logger.info({ messageId: created.id }, 'Message sent');
        return reply.status(201).send(result);
      } catch (error) {
        app.logger.error(
          { err: error, senderId: session.user.id, recipientId },
          'Failed to send message'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/messages/:id/read - Mark message as read
   */
  app.fastify.put(
    '/api/messages/:id/read',
    {
      schema: {
        description: 'Mark message as read',
        tags: ['messages'],
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
              read: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ messageId: id, userId: session.user.id }, 'Marking message as read');

      try {
        const [updated] = await app.db
          .update(schema.messages)
          .set({ read: true })
          .where(eq(schema.messages.id, id))
          .returning();

        if (!updated) {
          return reply.status(404).send({
            error: 'Message not found',
          });
        }

        app.logger.info({ messageId: id }, 'Message marked as read');
        return {
          id: updated.id,
          read: updated.read,
        };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to mark message as read');
        throw error;
      }
    }
  );
}
