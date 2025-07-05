import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  initializeUserProgress,
  getUserProgress,
  updateLastVisitedFolder,
  updateLastTrack,
  updateAudioProgress,
  updateLanguageLevelCounts,
  calculateProgressStats,
  extractLanguageAndLevel
} from '@/lib/progress';
import { extractUsername } from '@/lib/auth';
import type { UserProgress, ProgressStats, BreadcrumbItem } from '@/types';

interface ProgressContextType {
  userProgress: UserProgress | null;
  progressStats: ProgressStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  refreshProgress: () => Promise<void>;
  updateFolderVisit: (folderPath: BreadcrumbItem[]) => Promise<void>;
  updateTrackProgress: (
    fileId: string,
    fileName: string,
    currentTime: number,
    duration: number,
    folderPath: BreadcrumbItem[],
    additionalPlayTime?: number
  ) => Promise<void>;
  updateTrackPosition: (
    fileId: string,
    fileName: string,
    currentTime: number,
    folderPath: BreadcrumbItem[]
  ) => Promise<void>;
  updateFileCountsForLevel: (
    language: string,
    level: string,
    totalFiles: number
  ) => Promise<void>;

  // Getters
  getLastTrackInfo: () => UserProgress['lastTrack'];
  getLastFolderPath: () => BreadcrumbItem[];
  getAudioProgress: (fileId: string) => number;
  isFileCompleted: (fileId: string) => boolean;
  getLanguageProgress: (language: string) => number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user progress when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeAndLoadProgress();
    } else {
      setUserProgress(null);
      setProgressStats(null);
      setError(null);
    }
  }, [isAuthenticated, user]);

  const initializeAndLoadProgress = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const username = extractUsername(user.email || '');
      await initializeUserProgress(user.uid, username, user.email || '');
      await refreshProgress();
    } catch (err) {
      console.error('Error initializing progress:', err);
      setError('Failed to initialize progress tracking');
    } finally {
      setLoading(false);
    }
  };

  const refreshProgress = async () => {
    if (!user) return;

    try {
      const progress = await getUserProgress(user.uid);
      setUserProgress(progress);

      if (progress) {
        const stats = calculateProgressStats(progress);
        setProgressStats(stats);
      }
    } catch (err) {
      console.error('Error refreshing progress:', err);
      setError('Failed to load progress data');
    }
  };

  const updateFolderVisit = async (folderPath: BreadcrumbItem[]) => {
    if (!user) return;

    try {
      await updateLastVisitedFolder(user.uid, folderPath);
      await refreshProgress();
    } catch (err) {
      console.error('Error updating folder visit:', err);
    }
  };

  const updateTrackProgress = async (
    fileId: string,
    fileName: string,
    currentTime: number,
    duration: number,
    folderPath: BreadcrumbItem[],
    additionalPlayTime: number = 0
  ) => {
    if (!user) return;

    try {
      const { language, level } = extractLanguageAndLevel(folderPath);

      await updateAudioProgress(
        user.uid,
        fileId,
        fileName,
        currentTime,
        duration,
        language,
        level,
        additionalPlayTime
      );

      await updateLastTrack(user.uid, fileId, fileName, currentTime, language, level);
      await refreshProgress();
    } catch (err) {
      console.error('Error updating track progress:', err);
    }
  };

  const updateTrackPosition = async (
    fileId: string,
    fileName: string,
    currentTime: number,
    folderPath: BreadcrumbItem[]
  ) => {
    if (!user) return;

    try {
      const { language, level } = extractLanguageAndLevel(folderPath);
      await updateLastTrack(user.uid, fileId, fileName, currentTime, language, level);
    } catch (err) {
      console.error('Error updating track position:', err);
    }
  };

  const updateFileCountsForLevel = async (
    language: string,
    level: string,
    totalFiles: number
  ) => {
    if (!user) return;

    try {
      await updateLanguageLevelCounts(user.uid, language, level, totalFiles);
      await refreshProgress();
    } catch (err) {
      console.error('Error updating file counts:', err);
    }
  };

  const getLastTrackInfo = () => {
    return userProgress?.lastTrack || null;
  };

  const getLastFolderPath = () => {
    return userProgress?.lastFolderPath || [{ id: null, name: 'Pimsleur' }];
  };

  const getAudioProgress = (fileId: string) => {
    const audioProgress = userProgress?.audioProgress?.[fileId];
    if (!audioProgress || !audioProgress.duration) return 0;
    return (audioProgress.currentTime / audioProgress.duration) * 100;
  };

  const isFileCompleted = (fileId: string) => {
    return userProgress?.audioProgress?.[fileId]?.completed || false;
  };

  const getLanguageProgress = (language: string) => {
    const langProgress = userProgress?.languagesProgress?.[language];
    if (!langProgress || !langProgress.totalFiles) return 0;
    return (langProgress.completedFiles / langProgress.totalFiles) * 100;
  };

  const value: ProgressContextType = {
    userProgress,
    progressStats,
    loading,
    error,
    refreshProgress,
    updateFolderVisit,
    updateTrackProgress,
    updateTrackPosition,
    updateFileCountsForLevel,
    getLastTrackInfo,
    getLastFolderPath,
    getAudioProgress,
    isFileCompleted,
    getLanguageProgress
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};