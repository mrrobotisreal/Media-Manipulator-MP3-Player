import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth';
import { auth } from './firebase';
import mixpanel from 'mixpanel-browser';

// Extract username from email (part before @)
export const extractUsername = (email: string): string => {
  return email.split('@')[0];
};

// Set user properties for analytics
export const setUserProperties = (user: User | null) => {
  if (user && user.email) {
    const username = extractUsername(user.email);

    // Set Mixpanel user properties
    mixpanel.identify(user.uid);
    mixpanel.people.set({
      $email: user.email,
      $name: user.displayName || username,
      username: username,
      userId: user.uid
    });

    // Set global property for all events
    mixpanel.register({
      username: username,
      userId: user.uid
    });
  } else {
    // Clear user properties when logged out
    mixpanel.reset();
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }

    // Set user properties for analytics
    setUserProperties(userCredential.user);

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Set user properties for analytics
    setUserProperties(userCredential.user);

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    // Clear user properties
    setUserProperties(null);
  } catch (error) {
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, (user) => {
    // Set user properties when auth state changes
    setUserProperties(user);
    callback(user);
  });
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};