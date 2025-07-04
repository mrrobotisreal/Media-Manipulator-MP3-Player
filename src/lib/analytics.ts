import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.MODE === 'development',
    track_pageview: true,
    persistence: 'localStorage',
  });
}

// Track page view (this will be called automatically by Mixpanel)
export const trackPageView = () => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Page View', {
      page: 'MP3 Drive Player',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track folder navigation
export const trackFolderView = (folderName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Folder View', {
      'Folder Name': folderName,
      'Folder Path': folderPath.join(' > '),
      'Folder Depth': folderPath.length,
      timestamp: new Date().toISOString(),
    });
  }
};

// Track file selection
export const trackFileSelect = (fileName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('File Select', {
      'File Name': fileName,
      'File Type': 'MP3',
      'Folder Path': folderPath.join(' > '),
      timestamp: new Date().toISOString(),
    });
  }
};

// Track play button click
export const trackPlayClick = (fileName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Play Button Click', {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Play',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track pause button click
export const trackPauseClick = (fileName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Pause Button Click', {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Pause',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track playback session (when song ends or user changes tracks)
export const trackPlaybackSession = (
  fileName: string,
  folderPath: string[],
  duration: number,
  playedTime: number,
  endReason: 'completed' | 'skipped' | 'paused' | 'changed_track'
) => {
  if (MIXPANEL_TOKEN) {
    const completionRate = duration > 0 ? (playedTime / duration) * 100 : 0;

    mixpanel.track('Playback Session', {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Duration (seconds)': Math.round(duration),
      'Played Time (seconds)': Math.round(playedTime),
      'Completion Rate (%)': Math.round(completionRate),
      'End Reason': endReason,
      timestamp: new Date().toISOString(),
    });
  }
};

// Track skip/next button click
export const trackSkipNext = (currentFile: string, nextFile: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Skip Next Click', {
      'Current File': currentFile,
      'Next File': nextFile,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Skip Next',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track skip/previous button click
export const trackSkipPrevious = (currentFile: string, previousFile: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Skip Previous Click', {
      'Current File': currentFile,
      'Previous File': previousFile,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Skip Previous',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track breadcrumb navigation
export const trackBreadcrumbClick = (targetFolder: string, fromPath: string[], toPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Breadcrumb Navigation', {
      'Target Folder': targetFolder,
      'From Path': fromPath.join(' > '),
      'To Path': toPath.join(' > '),
      'Levels Jumped': fromPath.length - toPath.length,
      timestamp: new Date().toISOString(),
    });
  }
};

// Track back button click
export const trackBackClick = (fromPath: string[], toPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Back Button Click', {
      'From Path': fromPath.join(' > '),
      'To Path': toPath.join(' > '),
      'Action': 'Navigate Back',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track volume change
export const trackVolumeChange = (newVolume: number) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Volume Change', {
      'Volume Level': Math.round(newVolume * 100),
      timestamp: new Date().toISOString(),
    });
  }
};

// Track dark mode toggle
export const trackDarkModeToggle = (isDarkMode: boolean) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Dark Mode Toggle', {
      'Dark Mode': isDarkMode,
      'Theme': isDarkMode ? 'Dark' : 'Light',
      timestamp: new Date().toISOString(),
    });
  }
};

// Track audio loading errors
export const trackAudioError = (fileName: string, folderPath: string[], errorType: string) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Audio Error', {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Error Type': errorType,
      timestamp: new Date().toISOString(),
    });
  }
};

// Helper function to get current folder path as array
export const getCurrentFolderPath = (breadcrumb: { name: string }[]): string[] => {
  return breadcrumb.map(item => item.name);
};