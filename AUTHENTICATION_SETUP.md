# Authentication Setup Guide

## Overview
Your MP3 Drive Player now has a complete authentication system with Firebase Auth, comprehensive analytics tracking, and user management. Users must log in with email/password before accessing the application.

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Mixpanel Configuration
VITE_MIXPANEL_TOKEN=your_mixpanel_token

# Google Drive Configuration (if not already set)
VITE_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
VITE_GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
```

## Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication and Analytics

2. **Enable Authentication:**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" authentication
   - Optionally enable "Email link (passwordless sign-in)"

3. **Get Configuration:**
   - Go to Project Settings > General
   - Add a web app if you haven't already
   - Copy the Firebase config values to your `.env.local` file

## Analytics Features

### Mixpanel Integration
- **Username Tracking**: All events now include a `username` property extracted from the user's email (e.g., `user@example.com` → `username: "user"`)
- **User Properties**: Automatically sets user properties when they log in
- **Event Tracking**: All existing events now include user context

### Firebase Analytics Integration
- **Login/Logout Events**: Tracks user authentication events
- **User Engagement**: Comprehensive event tracking for all user interactions
- **Error Tracking**: Authentication and application errors are tracked
- **Custom Events**: All MP3 player interactions are tracked with Firebase Analytics

## Authentication Flow

1. **Login Screen**: Users see a clean login/signup form
2. **Email/Password**: Users can create accounts or sign in with existing credentials
3. **Protected Routes**: Only authenticated users can access the MP3 player
4. **User Context**: The logged-in user's information is available throughout the app
5. **Logout**: Users can log out from the header

## New Features Added

### Authentication System
- ✅ Email/password authentication with Firebase Auth
- ✅ User registration and login forms
- ✅ Password visibility toggle
- ✅ Form validation and error handling
- ✅ Loading states and user feedback
- ✅ Automatic user session management

### Analytics Enhancement
- ✅ Username tracking in all Mixpanel events
- ✅ Firebase Analytics integration
- ✅ User property management
- ✅ Enhanced event tracking with user context
- ✅ Error tracking and monitoring

### User Experience
- ✅ Clean, responsive login/signup interface
- ✅ Welcome message with username in header
- ✅ Logout functionality
- ✅ Loading states during authentication
- ✅ Error messages and feedback

## Files Created/Modified

### New Files:
- `src/lib/auth.ts` - Firebase authentication utilities
- `src/contexts/AuthContext.tsx` - Authentication context provider
- `src/contexts/index.ts` - Context exports
- `src/components/AuthForm.tsx` - Login/signup form component
- `src/components/MP3DrivePlayer.tsx` - Main player component (extracted from App.tsx)

### Modified Files:
- `src/App.tsx` - Now handles authentication flow
- `src/main.tsx` - Removed duplicate Mixpanel initialization
- `src/lib/analytics.ts` - Enhanced with username tracking and Firebase Analytics
- `src/lib/firebase.ts` - Firebase configuration (already existed)

## Usage

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **First Time Users:**
   - Users will see the login/signup form
   - They can create an account with email/password
   - Once logged in, they'll see the MP3 player interface

3. **Returning Users:**
   - Users will be automatically logged in if they have an active session
   - They can log out using the logout button in the header

## Analytics Data

### Mixpanel Events
All events now include:
- `username`: Extracted from user's email
- `userId`: Firebase user ID
- `timestamp`: ISO timestamp
- Plus all existing event properties

### Firebase Analytics Events
- `login` - User authentication
- `logout` - User logout
- `sign_up` - New user registration
- `auth_error` - Authentication errors
- Plus all converted MP3 player events

## Security Notes

- User passwords are handled securely by Firebase Auth
- Email/password authentication is enabled by default
- User sessions are automatically managed
- All authentication state is handled through React Context
- Environment variables keep sensitive data secure

## Testing

Test the authentication flow:
1. Try creating a new account
2. Log out and log back in
3. Check that analytics events include username
4. Verify that only authenticated users can access the MP3 player

Your MP3 Drive Player now has enterprise-grade authentication and analytics! 🎵🔐📊