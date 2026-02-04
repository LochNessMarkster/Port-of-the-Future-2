import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

/**
 * User Schedules - Track bookmarked sessions for users
 */
export const userSchedules = pgTable(
  'user_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull(), // Airtable session ID
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('user_schedules_user_id_idx').on(table.userId),
    index('user_schedules_session_id_idx').on(table.sessionId),
  ]
);

/**
 * Messages - In-app messaging between attendees
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    recipientId: text('recipient_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('messages_sender_id_idx').on(table.senderId),
    index('messages_recipient_id_idx').on(table.recipientId),
    index('messages_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Relations
 */
export const userSchedulesRelations = relations(userSchedules, ({ one }) => ({
  user: one(user, {
    fields: [userSchedules.userId],
    references: [user.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(user, {
    fields: [messages.senderId],
    references: [user.id],
  }),
  recipient: one(user, {
    fields: [messages.recipientId],
    references: [user.id],
  }),
}));
