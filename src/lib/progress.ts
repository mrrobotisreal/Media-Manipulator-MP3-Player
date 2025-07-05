import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserProgress,
  AudioProgress,
  BreadcrumbItem,
  ProgressStats
} from '@/types';

// Collection names
const PROGRESS_COLLECTION = 'progress';

// Extract language and level from breadcrumb path
export const extractLanguageAndLevel = (breadcrumb: BreadcrumbItem[]): { language: string; level: string } => {
  let language = 'Unknown';
  let level = 'Unknown';

  if (breadcrumb.length >= 2) {
    language = breadcrumb[1].name; // First subfolder is language
  }

  if (breadcrumb.length >= 3) {
    level = breadcrumb[2].name; // Second subfolder is level
  }

  return { language, level };
};

// Initialize user progress document
export const initializeUserProgress = async (userId: string, username: string, email: string): Promise<void> => {
  try {
    const userProgressRef = doc(db, PROGRESS_COLLECTION, userId);
    const userDoc = await getDoc(userProgressRef);

    if (!userDoc.exists()) {
      const initialProgress: Omit<UserProgress, 'createdAt' | 'updatedAt'> = {
        userId,
        username,
        email,
        totalListeningTime: 0,
        totalFilesCompleted: 0,
        languagesStarted: [],
        lastFolderPath: [{ id: null, name: 'Pimsleur' }],
        lastTrack: null,
        languagesProgress: {},
        audioProgress: {}
      };

      await setDoc(userProgressRef, {
        ...initialProgress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error initializing user progress:', error);
    throw error;
  }
};

// Get user progress
export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  try {
    const userProgressRef = doc(db, PROGRESS_COLLECTION, userId);
    const userDoc = await getDoc(userProgressRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserProgress;
    }

    return null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
};

// Update last visited folder
export const updateLastVisitedFolder = async (userId: string, folderPath: BreadcrumbItem[]): Promise<void> => {
  try {
    const userProgressRef = doc(db, PROGRESS_COLLECTION, userId);
    await updateDoc(userProgressRef, {
      lastFolderPath: folderPath,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last visited folder:', error);
    throw error;
  }
};

// Update last track info
export const updateLastTrack = async (
  userId: string,
  fileId: string,
  fileName: string,
  currentTime: number,
  language: string,
  level: string
): Promise<void> => {
  try {
    const userProgressRef = doc(db, PROGRESS_COLLECTION, userId);
    await updateDoc(userProgressRef, {
      lastTrack: {
        fileId,
        fileName,
        currentTime,
        language,
        level
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last track:', error);
    throw error;
  }
};

// Update audio progress
export const updateAudioProgress = async (
  userId: string,
  fileId: string,
  fileName: string,
  currentTime: number,
  duration: number,
  language: string,
  level: string,
  additionalPlayTime: number = 0
): Promise<void> => {
  try {
    const userProgressRef = doc(db, PROGRESS_COLLECTION, userId);
    const userDoc = await getDoc(userProgressRef);

    if (!userDoc.exists()) {
      throw new Error('User progress document not found');
    }

    const userData = userDoc.data() as UserProgress;
    const isCompleted = currentTime >= duration * 0.9; // 90% completion threshold

    // Update audio progress
    const audioProgressKey = `audioProgress.${fileId}`;
    const audioProgress: AudioProgress = {
      fileId,
      fileName,
      currentTime,
      duration,
      completed: isCompleted,
      lastPlayedAt: new Date(),
      language,
      level,
      totalPlayTime: (userData.audioProgress?.[fileId]?.totalPlayTime || 0) + additionalPlayTime
    };

    const updates: any = {
      [audioProgressKey]: audioProgress,
      updatedAt: serverTimestamp()
    };

    // Update total listening time
    if (additionalPlayTime > 0) {
      updates.totalListeningTime = increment(additionalPlayTime);
    }

    // Update language progress
    const languageProgressKey = `languagesProgress.${language}`;
    const existingLanguageProgress = userData.languagesProgress?.[language];

    if (!existingLanguageProgress) {
      // Add language to started languages
      updates.languagesStarted = [...(userData.languagesStarted || []), language];

      // Initialize language progress
      updates[languageProgressKey] = {
        language,
        totalFiles: 1,
        completedFiles: isCompleted ? 1 : 0,
        totalListeningTime: additionalPlayTime,
        lastAccessedAt: new Date(),
        currentLevel: level,
        levelsProgress: {
          [level]: {
            level,
            totalFiles: 1,
            completedFiles: isCompleted ? 1 : 0,
            totalListeningTime: additionalPlayTime,
            lastAccessedAt: new Date()
          }
        }
      };
    } else {
      // Update existing language progress
      const wasCompleted = userData.audioProgress?.[fileId]?.completed || false;
      const completedIncrement = isCompleted && !wasCompleted ? 1 : 0;

      updates[`${languageProgressKey}.totalListeningTime`] = increment(additionalPlayTime);
      updates[`${languageProgressKey}.lastAccessedAt`] = new Date();
      updates[`${languageProgressKey}.currentLevel`] = level;

      if (completedIncrement > 0) {
        updates[`${languageProgressKey}.completedFiles`] = increment(completedIncrement);
      }

      // Update level progress
      const levelProgressKey = `${languageProgressKey}.levelsProgress.${level}`;
      const existingLevelProgress = existingLanguageProgress.levelsProgress?.[level];

      if (!existingLevelProgress) {
        updates[levelProgressKey] = {
          level,
          totalFiles: 1,
          completedFiles: isCompleted ? 1 : 0,
          totalListeningTime: additionalPlayTime,
          lastAccessedAt: new Date()
        };
      } else {
        updates[`${levelProgressKey}.totalListeningTime`] = increment(additionalPlayTime);
        updates[`${levelProgressKey}.lastAccessedAt`] = new Date();

        if (completedIncrement > 0) {
          updates[`${levelProgressKey}.completedFiles`] = increment(completedIncrement);
        }
      }
    }

    // Update total completed files
    const wasCompleted = userData.audioProgress?.[fileId]?.completed || false;
    if (isCompleted && !wasCompleted) {
      updates.totalFilesCompleted = increment(1);
    }

    await updateDoc(userProgressRef, updates);
  } catch (error) {
    console.error('Error updating audio progress:', error);
    throw error;
  }
};

// Calculate progress statistics
export const calculateProgressStats = (userProgress: UserProgress): ProgressStats => {
  const languageBreakdown = Object.values(userProgress.languagesProgress).map(langProgress => ({
    language: langProgress.language,
    completedFiles: langProgress.completedFiles,
    totalFiles: langProgress.totalFiles,
    listeningTime: langProgress.totalListeningTime,
    progressPercentage: langProgress.totalFiles > 0 ? (langProgress.completedFiles / langProgress.totalFiles) * 100 : 0
  }));

  const totalLanguages = languageBreakdown.length;
  const completedLanguages = languageBreakdown.filter(lang => lang.progressPercentage >= 90).length;

  // Calculate weekly progress (last 7 days)
  // Note: Currently showing empty data since we don't have daily tracking implemented yet
  // In a real implementation, you'd store daily statistics in Firestore
  const weeklyProgress = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    weeklyProgress.push({
      date: dateString,
      listeningTime: 0, // Would come from daily stats collection
      filesCompleted: 0 // Would come from daily stats collection
    });
  }

  return {
    totalLanguages,
    completedLanguages,
    totalListeningHours: userProgress.totalListeningTime / 3600,
    currentStreak: 0, // Would calculate based on daily activity tracking
    weeklyProgress,
    languageBreakdown
  };
};

// Update file counts for a language/level (called when exploring folders)
export const updateLanguageLevelCounts = async (
  userId: string,
  language: string,
  level: string,
  totalFiles: number
): Promise<void> => {
  try {
    const userProgressRef = doc(db, PROGRESS_COLLECTION, userId);
    const userDoc = await getDoc(userProgressRef);

    if (!userDoc.exists()) {
      return;
    }

    const userData = userDoc.data() as UserProgress;
    const languageProgressKey = `languagesProgress.${language}`;
    const levelProgressKey = `${languageProgressKey}.levelsProgress.${level}`;

    const updates: any = {};

    // Update language progress
    if (!userData.languagesProgress?.[language]) {
      updates.languagesStarted = [...(userData.languagesStarted || []), language];
      updates[languageProgressKey] = {
        language,
        totalFiles,
        completedFiles: 0,
        totalListeningTime: 0,
        lastAccessedAt: new Date(),
        currentLevel: level,
        levelsProgress: {
          [level]: {
            level,
            totalFiles,
            completedFiles: 0,
            totalListeningTime: 0,
            lastAccessedAt: new Date()
          }
        }
      };
    } else {
      updates[`${languageProgressKey}.lastAccessedAt`] = new Date();
      updates[`${languageProgressKey}.currentLevel`] = level;

      // Update level progress
      if (!userData.languagesProgress[language].levelsProgress?.[level]) {
        updates[levelProgressKey] = {
          level,
          totalFiles,
          completedFiles: 0,
          totalListeningTime: 0,
          lastAccessedAt: new Date()
        };
      } else {
        updates[`${levelProgressKey}.lastAccessedAt`] = new Date();
        // Update total files if different
        if (userData.languagesProgress[language].levelsProgress[level].totalFiles !== totalFiles) {
          updates[`${levelProgressKey}.totalFiles`] = totalFiles;
        }
      }
    }

    updates.updatedAt = serverTimestamp();
    await updateDoc(userProgressRef, updates);
  } catch (error) {
    console.error('Error updating language/level counts:', error);
    throw error;
  }
};