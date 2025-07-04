import mixpanel from 'mixpanel-browser';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

// Initialize Mixpanel
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.MODE === 'development',
    track_pageview: true,
    persistence: 'localStorage',
  });
}

// Helper function to get common event properties
const getEventProperties = () => {
  const baseProps = {
    timestamp: new Date().toISOString(),
  };

  // Add username if available in mixpanel
  const mixpanelUser = mixpanel.get_distinct_id();
  if (mixpanelUser) {
    return {
      ...baseProps,
      // Username will be added by the global register from auth.ts
    };
  }

  return baseProps;
};

// Track page view (this will be called automatically by Mixpanel)
export const trackPageView = () => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      page: 'MP3 Drive Player',
      ...getEventProperties(),
    };

    mixpanel.track('Page View', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'page_view', {
      page_title: 'MP3 Drive Player',
      page_location: window.location.href,
    });
  }
};

// Track folder navigation
export const trackFolderView = (folderName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'Folder Name': folderName,
      'Folder Path': folderPath.join(' > '),
      'Folder Depth': folderPath.length,
      ...getEventProperties(),
    };

    mixpanel.track('Folder View', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'folder_view', {
      folder_name: folderName,
      folder_path: folderPath.join(' > '),
      folder_depth: folderPath.length,
    });
  }
};

// Track file selection
export const trackFileSelect = (fileName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'File Name': fileName,
      'File Type': 'MP3',
      'Folder Path': folderPath.join(' > '),
      ...getEventProperties(),
    };

    mixpanel.track('File Select', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'file_select', {
      file_name: fileName,
      file_type: 'MP3',
      folder_path: folderPath.join(' > '),
    });
  }
};

// Track play button click
export const trackPlayClick = (fileName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Play',
      ...getEventProperties(),
    };

    mixpanel.track('Play Button Click', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'play_button_click', {
      file_name: fileName,
      folder_path: folderPath.join(' > '),
      action: 'Play',
    });
  }
};

// Track pause button click
export const trackPauseClick = (fileName: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Pause',
      ...getEventProperties(),
    };

    mixpanel.track('Pause Button Click', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'pause_button_click', {
      file_name: fileName,
      folder_path: folderPath.join(' > '),
      action: 'Pause',
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

    const eventProps = {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Duration (seconds)': Math.round(duration),
      'Played Time (seconds)': Math.round(playedTime),
      'Completion Rate (%)': Math.round(completionRate),
      'End Reason': endReason,
      ...getEventProperties(),
    };

    mixpanel.track('Playback Session', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'playback_session', {
      file_name: fileName,
      folder_path: folderPath.join(' > '),
      duration_seconds: Math.round(duration),
      played_time_seconds: Math.round(playedTime),
      completion_rate: Math.round(completionRate),
      end_reason: endReason,
    });
  }
};

// Track skip/next button click
export const trackSkipNext = (currentFile: string, nextFile: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'Current File': currentFile,
      'Next File': nextFile,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Skip Next',
      ...getEventProperties(),
    };

    mixpanel.track('Skip Next Click', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'skip_next', {
      current_file: currentFile,
      next_file: nextFile,
      folder_path: folderPath.join(' > '),
    });
  }
};

// Track skip/previous button click
export const trackSkipPrevious = (currentFile: string, previousFile: string, folderPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'Current File': currentFile,
      'Previous File': previousFile,
      'Folder Path': folderPath.join(' > '),
      'Action': 'Skip Previous',
      ...getEventProperties(),
    };

    mixpanel.track('Skip Previous Click', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'skip_previous', {
      current_file: currentFile,
      previous_file: previousFile,
      folder_path: folderPath.join(' > '),
    });
  }
};

// Track breadcrumb navigation
export const trackBreadcrumbClick = (targetFolder: string, fromPath: string[], toPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'Target Folder': targetFolder,
      'From Path': fromPath.join(' > '),
      'To Path': toPath.join(' > '),
      'Levels Jumped': fromPath.length - toPath.length,
      ...getEventProperties(),
    };

    mixpanel.track('Breadcrumb Navigation', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'breadcrumb_navigation', {
      target_folder: targetFolder,
      from_path: fromPath.join(' > '),
      to_path: toPath.join(' > '),
      levels_jumped: fromPath.length - toPath.length,
    });
  }
};

// Track back button click
export const trackBackClick = (fromPath: string[], toPath: string[]) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'From Path': fromPath.join(' > '),
      'To Path': toPath.join(' > '),
      'Action': 'Navigate Back',
      ...getEventProperties(),
    };

    mixpanel.track('Back Button Click', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'back_button_click', {
      from_path: fromPath.join(' > '),
      to_path: toPath.join(' > '),
    });
  }
};

// Track volume change
export const trackVolumeChange = (newVolume: number) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'Volume Level': Math.round(newVolume * 100),
      ...getEventProperties(),
    };

    mixpanel.track('Volume Change', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'volume_change', {
      volume_level: Math.round(newVolume * 100),
    });
  }
};

// Track dark mode toggle
export const trackDarkModeToggle = (isDarkMode: boolean) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'Dark Mode': isDarkMode,
      'Theme': isDarkMode ? 'Dark' : 'Light',
      ...getEventProperties(),
    };

    mixpanel.track('Dark Mode Toggle', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'dark_mode_toggle', {
      dark_mode: isDarkMode,
      theme: isDarkMode ? 'Dark' : 'Light',
    });
  }
};

// Track audio loading errors
export const trackAudioError = (fileName: string, folderPath: string[], errorType: string) => {
  if (MIXPANEL_TOKEN) {
    const eventProps = {
      'File Name': fileName,
      'Folder Path': folderPath.join(' > '),
      'Error Type': errorType,
      ...getEventProperties(),
    };

    mixpanel.track('Audio Error', eventProps);

    // Track with Firebase Analytics
    logEvent(analytics, 'audio_error', {
      file_name: fileName,
      folder_path: folderPath.join(' > '),
      error_type: errorType,
    });
  }
};

// Helper function to get current folder path as array
export const getCurrentFolderPath = (breadcrumb: { name: string }[]): string[] => {
  return breadcrumb.map(item => item.name);
};