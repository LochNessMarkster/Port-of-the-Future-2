import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { registerHomeRoutes } from './routes/home.js';
import { registerProfileRoutes } from './routes/profile.js';
import { registerSessionsRoutes } from './routes/sessions.js';
import { registerSpeakersRoutes } from './routes/speakers.js';
import { registerPortsRoutes } from './routes/ports.js';
import { registerExhibitorsRoutes } from './routes/exhibitors.js';
import { registerSponsorsRoutes } from './routes/sponsors.js';
import { registerAnnouncementsRoutes } from './routes/announcements.js';
import { registerScheduleRoutes } from './routes/schedule.js';
import { registerAttendeesRoutes } from './routes/attendees.js';
import { registerMessagesRoutes } from './routes/messages.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerSpeakerPresentationsRoutes } from './routes/speaker-presentations.js';
import { registerCacheRoutes } from './routes/cache.js';
import { registerActivitiesRoutes } from './routes/activities.js';
import { registerFloorPlanRoutes } from './routes/floor-plan.js';
import { registerRegistrationRoutes } from './routes/registration.js';
import { registerPasswordResetRoutes } from './routes/password-reset.js';
import { airtableCache } from './services/airtable-cache.js';

const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with email/password support
app.withAuth();

// Enable storage for file uploads
app.withStorage();

// Initialize Airtable cache
airtableCache.setLogger(app.logger);
await airtableCache.initialize();

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerHomeRoutes(app);
registerProfileRoutes(app);
registerSessionsRoutes(app);
registerSpeakersRoutes(app);
registerPortsRoutes(app);
registerExhibitorsRoutes(app);
registerSponsorsRoutes(app);
registerAnnouncementsRoutes(app);
registerScheduleRoutes(app);
registerAttendeesRoutes(app);
registerMessagesRoutes(app);
registerAdminRoutes(app);
registerSpeakerPresentationsRoutes(app);
registerCacheRoutes(app);
registerActivitiesRoutes(app);
registerFloorPlanRoutes(app);
registerRegistrationRoutes(app);
registerPasswordResetRoutes(app);

await app.run();
app.logger.info('Application running');
