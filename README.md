# Port of the Future 2026 Conference App

A native iOS and Android conference app for the Port of the Future Conference 2026 (March 24-25, Houston, TX). Built with React Native, Expo 54, and Better Auth.

## Features

### 🔐 Authentication
- Email/password registration and login
- Google OAuth (web popup flow)
- Apple OAuth (web popup flow)
- Session persistence across app reloads
- Secure token storage (SecureStore on native, localStorage on web)

### 📱 Core Screens

#### Home
- Conference logo and details
- Quick navigation tiles to all sections
- Live announcements feed from backend

#### Agenda
- Day-by-day session listing (March 24 & 25)
- Session details with speaker, room, time, type
- Bookmark sessions to "My Schedule"
- Session detail modal with full description

#### Speakers
- Grid view of speaker cards with photos
- Speaker detail modal with bio, topic, and synopsis

#### Exhibitors
- List of exhibitors with logos and booth numbers
- Contact information and website links
- Email integration for direct contact

#### Ports
- Grid of participating ports
- Port details with bio and website

#### Sponsors
- Grouped by tier (Platinum, Gold, Silver, Bronze, Partner)
- Sponsor details with intro, bio, and website

#### Networking
- Directory of attendees who opted-in
- View attendee profiles
- Send direct messages to other attendees

#### Messages
- In-app messaging between attendees
- Conversation threads
- Real-time message status (read/unread)

#### Profile
- Edit personal information
- Privacy settings (opt-in/out of networking)
- Profile photo and bio

#### My Schedule
- View all bookmarked sessions
- Remove sessions from schedule

#### Admin Panel (Admin users only)
- Create, edit, and delete announcements
- View all registered users
- User statistics

## Backend Integration

The app is fully integrated with the backend API at:
```
https://uufwc6w3behkdb57y7ptup24r75vc4rq.app.specular.dev
```

### API Endpoints Used

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user session
- `POST /api/auth/logout` - Sign out

**Profile:**
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

**Conference Data:**
- `GET /api/announcements` - Get announcements
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session details
- `GET /api/speakers` - Get all speakers
- `GET /api/speakers/:id` - Get speaker details
- `GET /api/ports` - Get all ports
- `GET /api/ports/:id` - Get port details
- `GET /api/exhibitors` - Get all exhibitors
- `GET /api/exhibitors/:id` - Get exhibitor details
- `GET /api/sponsors` - Get all sponsors
- `GET /api/sponsors/:id` - Get sponsor details

**Schedule Management:**
- `GET /api/schedule` - Get user's bookmarked sessions
- `POST /api/schedule` - Add session to schedule
- `DELETE /api/schedule/:sessionId` - Remove session from schedule

**Networking:**
- `GET /api/attendees` - Get attendees who opted-in
- `GET /api/attendees/:id` - Get attendee profile

**Messaging:**
- `GET /api/messages` - Get message threads
- `GET /api/messages/:userId` - Get conversation with user
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark message as read

**Admin:**
- `GET /api/admin/users` - Get all registered users
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

## Testing Instructions

### 1. Sign Up / Sign In

**Create a test account:**
1. Launch the app
2. Tap "Don't have an account? Sign Up"
3. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - (Optional) Company, Title, Phone, LinkedIn, Bio
4. Tap "Create Account"

**Sign in with existing account:**
1. Launch the app
2. Enter email and password
3. Tap "Sign In"

### 2. Test Core Features

**Browse Agenda:**
1. Go to Agenda tab
2. Switch between March 24 and March 25
3. Tap on a session to view details
4. Tap bookmark icon to add to "My Schedule"

**View Speakers:**
1. Go to Speakers tab
2. Tap on a speaker card
3. View full bio and speaking topic

**Explore Exhibitors:**
1. Go to More → Exhibitors
2. Tap on an exhibitor
3. Test "Send Email" and "Visit Website" buttons

**Networking:**
1. Go to More → Profile
2. Enable "Allow other attendees to see my profile"
3. Go to More → Networking
4. View other attendees
5. Tap "Send Message" to start a conversation

**Messages:**
1. Go to More → Messages
2. View conversation threads
3. Send and receive messages

**My Schedule:**
1. Go to More → My Schedule
2. View bookmarked sessions
3. Remove sessions if needed

### 3. Test Admin Features (Admin users only)

**Create Announcement:**
1. Go to More → Admin Panel
2. Tap "Add" under Announcements
3. Enter title and content
4. Tap "Create"

**View Users:**
1. Scroll down to "Registered Users" section
2. View all registered users and their details

## Architecture

### Authentication Flow
- Uses Better Auth with Expo client
- Supports email/password and OAuth (Google, Apple)
- Web: Popup-based OAuth flow
- Native: Deep linking for OAuth redirects
- Session tokens stored securely (SecureStore/localStorage)
- Auto-refresh session every 5 minutes

### API Layer
- Centralized API client in `utils/api.ts`
- Reads backend URL from `app.json` (never hardcoded)
- Helper functions: `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- Authenticated helpers: `authenticatedGet`, `authenticatedPost`, etc.
- Automatic Bearer token injection for authenticated requests

### State Management
- React Context for authentication (`AuthContext`)
- Local state for UI components
- Real-time updates via API polling (messages, schedule)

### UI/UX
- Dark mode support
- Custom modals (no Alert.alert for web compatibility)
- Loading states for all async operations
- Error handling with user-friendly messages
- Responsive design for mobile and web

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Data Source

The app fetches data from Airtable via the backend API:
- Base ID: `appcNhRl5vEqug2D1`
- Tables: Sessions, Speakers, Ports, Exhibitors, Sponsors, Attendees, Announcements

## Tech Stack

- **Framework:** React Native + Expo 54
- **Navigation:** Expo Router (file-based routing)
- **Authentication:** Better Auth + @better-auth/expo
- **Storage:** expo-secure-store (native), localStorage (web)
- **Styling:** StyleSheet with custom theme system
- **Icons:** @expo/vector-icons + IconSymbol component
- **HTTP Client:** Fetch API with custom wrapper

## Project Structure

```
app/
├── (tabs)/           # Main tab navigation
│   ├── (home)/       # Home screen
│   ├── agenda.tsx    # Agenda screen
│   ├── speakers.tsx  # Speakers screen
│   └── more.tsx      # More menu
├── auth.tsx          # Authentication screen
├── ports.tsx         # Ports screen
├── sponsors.tsx      # Sponsors screen
├── exhibitors.tsx    # Exhibitors screen
├── schedule.tsx      # My Schedule screen
├── networking.tsx    # Networking screen
├── messages.tsx      # Messages screen
├── profile.tsx       # Profile screen
└── admin.tsx         # Admin panel

components/
├── IconSymbol.tsx    # Cross-platform icon component
├── FloatingTabBar.tsx # Custom tab bar
└── ...

contexts/
├── AuthContext.tsx   # Authentication context
└── WidgetContext.tsx # Widget state management

utils/
├── api.ts            # API client wrapper
└── errorLogger.ts    # Error logging

lib/
└── auth.ts           # Better Auth client configuration
```

## Notes

- The app requires an active internet connection for most features
- Offline support can be added with local caching
- Push notifications can be integrated for announcements
- Admin role is determined by the backend (user.role === 'admin')

---

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.
