import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
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
 * Speaker Presentations - Track uploaded presentations by speakers
 */
export const speakerPresentations = pgTable(
  'speaker_presentations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    speakerId: text('speaker_id').notNull(), // Airtable speaker ID
    speakerName: text('speaker_name').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size'), // file size in bytes
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('speaker_presentations_speaker_id_idx').on(table.speakerId),
    index('speaker_presentations_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Floor Plans - Track uploaded floor plan images
 */
export const floorPlans = pgTable(
  'floor_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    imageUrl: text('image_url').notNull(),
    description: text('description'),
    uploadedBy: text('uploaded_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('floor_plans_created_at_idx').on(table.createdAt),
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

export const speakerPresentationsRelations = relations(speakerPresentations, ({ one }) => ({
  // Note: speakerId references Airtable speaker table, not our user table
}));

export const floorPlansRelations = relations(floorPlans, ({ one }) => ({
  uploader: one(user, {
    fields: [floorPlans.uploadedBy],
    references: [user.id],
  }),
}));
