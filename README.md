# Port of the Future Conference 2026

A comprehensive conference management app for the Port of the Future Conference, March 24-25, 2026 in Houston, Texas.

## 🚀 Features

### For Attendees
- **Conference Agenda** - Browse sessions by day with detailed information
- **Speakers Directory** - View speaker profiles, bios, and topics
- **Exhibitors & Sponsors** - Explore exhibitor booths and sponsor information
- **Ports Directory** - Learn about participating ports
- **My Schedule** - Bookmark sessions and manage your personal schedule
- **Networking** - Connect with other attendees who opted-in
- **Messaging** - Send direct messages to other attendees
- **Profile Management** - Update your profile and networking preferences

### For Admins
- **User Management** - View all registered users
- **Announcements** - Create, edit, and delete conference announcements
- **Admin Dashboard** - Manage conference content

## 🏗️ Tech Stack

- **Frontend**: React Native + Expo 54
- **Backend**: Node.js + Fastify + Better Auth
- **Database**: PostgreSQL (via Drizzle ORM)
- **Data Source**: Airtable (for conference content)
- **Authentication**: Better Auth with email/password + OAuth (Google, Apple)
- **Deployment**: Specular.dev

## 📱 Platform Support

- ✅ iOS (native tabs)
- ✅ Android (custom floating tab bar)
- ✅ Web (custom floating tab bar)

## 🔐 Authentication

The app uses Better Auth for secure authentication:
- Email/password sign up and sign in
- OAuth support (Google, Apple)
- Session persistence across app restarts
- Bearer token authentication for API calls

## 🎨 Design

- Dark mode support
- Consistent color scheme
- Smooth animations
- Responsive layouts
- Platform-specific optimizations

## 📊 Backend API

The backend is deployed at: `https://uufwc6w3behkdb57y7ptup24r75vc4rq.app.specular.dev`

### Key Endpoints

**Public Endpoints:**
- `GET /api/announcements` - Get all announcements
- `GET /api/sessions` - Get all conference sessions
- `GET /api/speakers` - Get all speakers
- `GET /api/exhibitors` - Get all exhibitors
- `GET /api/ports` - Get all ports
- `GET /api/sponsors` - Get all sponsors

**Protected Endpoints (require authentication):**
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/schedule` - Get user's bookmarked sessions
- `POST /api/schedule` - Add session to schedule
- `DELETE /api/schedule/:sessionId` - Remove session from schedule
- `GET /api/attendees` - Get attendees who opted-in to networking
- `GET /api/messages` - Get message threads
- `POST /api/messages` - Send a message
- `GET /api/messages/:userId` - Get conversation with specific user

**Admin Endpoints:**
- `GET /api/admin/users` - Get all registered users
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

## 🧪 Testing

### Test Account Creation

1. Open the app at https://future-port-2026-app-vhonvc.natively.dev/
2. Tap "Sign Up"
3. Fill in your information:
   - Name: Your full name
   - Email: test@example.com (or any email)
   - Password: Choose a secure password
   - Company, Title, Phone, LinkedIn, Bio (optional)
   - **Important**: Toggle "Opt-in to Networking" ON to appear in the networking directory
4. Tap "Create Account"
5. Sign in with your credentials

### Testing Networking

To test the networking feature:
1. Create 2-3 test accounts with different emails
2. Make sure to enable "Opt-in to Networking" for each account
3. Sign in with one account
4. Go to More → Networking
5. You should see the other test accounts
6. Tap on an attendee to view their profile
7. Tap "Send Message" to start a conversation

## 📝 Recent Updates

### Backend Fix (Latest)
- Fixed Airtable table IDs for Sessions and Speakers
- Sessions now use correct table ID: `tblhUTXC3XHVGssO4`
- Speakers now use correct table ID: `tblNp1JZk4ARZZZlT`
- This resolves 403 FORBIDDEN errors and enables proper data loading

### Frontend Status
- ✅ All API endpoints are integrated
- ✅ Authentication flow is complete
- ✅ All screens are functional
- ✅ Error handling and loading states implemented
- ✅ No TODO comments remaining

## 🔧 Development

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

### Project Structure

```
/app                    # Expo Router screens
  /(tabs)              # Tab navigation screens
    /(home)            # Home screen
    /agenda.tsx        # Conference agenda
    /speakers.tsx      # Speakers directory
    /profile.tsx       # User profile
    /more.tsx          # More menu
  /auth.tsx            # Authentication screen
  /exhibitors.tsx      # Exhibitors screen
  /sponsors.tsx        # Sponsors screen
  /ports.tsx           # Ports screen
  /schedule.tsx        # My Schedule screen
  /networking.tsx      # Networking screen
  /messages.tsx        # Messages screen
  /admin.tsx           # Admin panel
/components            # Reusable components
/contexts              # React contexts (Auth, Widget)
/utils                 # Utility functions (API client)
/lib                   # Libraries (Better Auth client)
/styles                # Common styles
/backend               # Backend API
  /src
    /routes            # API route handlers
    /db                # Database schema and migrations
    /utils             # Backend utilities (Airtable client)
```

## 📄 License

Made with 💙 for creativity.

## 🆘 Support

For issues or questions, please check the [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) file for the latest status and troubleshooting information.
