export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webContentLink?: string;
}

export interface GoogleDriveApiResponse {
  files: GoogleDriveFile[];
}

export interface BreadcrumbItem {
  id: string | null; // null for root level
  name: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  type?: string;
}

// Progress tracking types
export interface AudioProgress {
  fileId: string;
  fileName: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastPlayedAt: Date;
  language: string;
  level: string;
  totalPlayTime: number;
}

export interface LanguageProgress {
  language: string;
  totalFiles: number;
  completedFiles: number;
  totalListeningTime: number;
  lastAccessedAt: Date;
  currentLevel: string;
  levelsProgress: { [level: string]: LevelProgress };
}

export interface LevelProgress {
  level: string;
  totalFiles: number;
  completedFiles: number;
  totalListeningTime: number;
  lastAccessedAt: Date;
}

export interface UserProgress {
  userId: string;
  username: string;
  email: string;
  totalListeningTime: number;
  totalFilesCompleted: number;
  languagesStarted: string[];
  lastFolderPath: BreadcrumbItem[];
  lastTrack: {
    fileId: string;
    fileName: string;
    currentTime: number;
    language: string;
    level: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  languagesProgress: { [language: string]: LanguageProgress };
  audioProgress: { [fileId: string]: AudioProgress };
}

export interface ProgressStats {
  totalLanguages: number;
  completedLanguages: number;
  totalListeningHours: number;
  currentStreak: number;
  weeklyProgress: Array<{
    date: string;
    listeningTime: number;
    filesCompleted: number;
  }>;
  languageBreakdown: Array<{
    language: string;
    completedFiles: number;
    totalFiles: number;
    listeningTime: number;
    progressPercentage: number;
  }>;
}